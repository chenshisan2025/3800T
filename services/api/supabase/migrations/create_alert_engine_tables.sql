-- PR-10 警报引擎扫描系统数据库迁移
-- 创建警报引擎相关表结构

-- 1. 创建警报规则表 (alert_rules)
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('price_above', 'price_below', 'price_change')),
    threshold DECIMAL(10,2) NOT NULL,
    change_percent DECIMAL(5,2), -- 用于price_change类型规则
    enabled BOOLEAN DEFAULT true,
    message TEXT, -- 自定义通知消息模板
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建通知表 (notifications)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    symbol VARCHAR(20),
    rule_type VARCHAR(50),
    trigger_price DECIMAL(10,2),
    current_price DECIMAL(10,2),
    type VARCHAR(50) NOT NULL DEFAULT 'alert',
    title VARCHAR(255),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    notification_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建通知幂等表 (notification_idempotency)
CREATE TABLE notification_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    notification_date DATE NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, symbol, rule_id, notification_date)
);

-- 4. 创建扫描日志表 (scan_logs)
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id VARCHAR(100) NOT NULL UNIQUE,
    scan_type VARCHAR(20) DEFAULT 'scheduled' CHECK (scan_type IN ('scheduled', 'manual')),
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- 扫描耗时(毫秒)
    rules_scanned INTEGER DEFAULT 0,
    rules_matched INTEGER DEFAULT 0,
    notifications_created INTEGER DEFAULT 0,
    errors TEXT[], -- 错误信息数组
    metadata JSONB -- 额外的扫描元数据
);

-- 创建索引以优化查询性能
CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_symbol ON alert_rules(symbol);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_alert_rules_user_symbol ON alert_rules(user_id, symbol);

CREATE INDEX idx_notifications_rule_id ON notifications(rule_id) WHERE rule_id IS NOT NULL;
CREATE INDEX idx_notifications_symbol ON notifications(symbol) WHERE symbol IS NOT NULL;
CREATE INDEX idx_notifications_date ON notifications(notification_date DESC) WHERE notification_date IS NOT NULL;
CREATE INDEX idx_notifications_user_date ON notifications(user_id, notification_date DESC) WHERE notification_date IS NOT NULL;

CREATE INDEX idx_notification_idempotency_composite ON notification_idempotency(user_id, symbol, rule_id, notification_date);
CREATE INDEX idx_notification_idempotency_key ON notification_idempotency(idempotency_key);

CREATE INDEX idx_scan_logs_scan_id ON scan_logs(scan_id);
CREATE INDEX idx_scan_logs_start_time ON scan_logs(start_time DESC);
CREATE INDEX idx_scan_logs_status ON scan_logs(status);

-- 添加表注释
COMMENT ON TABLE alert_rules IS '警报规则表，存储用户创建的股价警报规则';
COMMENT ON TABLE notification_idempotency IS '通知幂等表，防止同一天重复发送相同的警报通知';
COMMENT ON TABLE scan_logs IS '扫描日志表，记录警报扫描任务的执行历史和统计信息';

-- 启用行级安全策略 (RLS)
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- alert_rules表策略：用户只能访问自己的规则
CREATE POLICY "Users can view own alert rules" ON alert_rules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert rules" ON alert_rules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert rules" ON alert_rules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert rules" ON alert_rules
    FOR DELETE USING (auth.uid() = user_id);

-- notifications表策略：用户只能访问自己的通知
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- notification_idempotency表策略：用户只能访问自己的幂等记录
CREATE POLICY "Users can view own idempotency records" ON notification_idempotency
    FOR SELECT USING (auth.uid() = user_id);

-- scan_logs表策略：所有认证用户可以查看扫描日志
CREATE POLICY "Authenticated users can view scan logs" ON scan_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- 授予权限
-- 为anon角色授予基本权限
GRANT SELECT ON alert_rules TO anon;
GRANT SELECT ON notifications TO anon;
GRANT SELECT ON notification_idempotency TO anon;
GRANT SELECT ON scan_logs TO anon;

-- 为authenticated角色授予完整权限
GRANT ALL PRIVILEGES ON alert_rules TO authenticated;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT ON notification_idempotency TO authenticated;
GRANT SELECT ON scan_logs TO authenticated;

-- 为service_role授予所有权限（用于后端服务）
GRANT ALL PRIVILEGES ON alert_rules TO service_role;
GRANT ALL PRIVILEGES ON notifications TO service_role;
GRANT ALL PRIVILEGES ON notification_idempotency TO service_role;
GRANT ALL PRIVILEGES ON scan_logs TO service_role;

-- 创建存储过程：原子性创建通知和幂等记录
CREATE OR REPLACE FUNCTION create_notification_with_idempotency(
    p_user_id UUID,
    p_rule_id UUID,
    p_symbol VARCHAR(20),
    p_rule_type VARCHAR(50),
    p_trigger_price DECIMAL(10,2),
    p_current_price DECIMAL(10,2),
    p_message TEXT,
    p_notification_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_idempotency_key VARCHAR(255);
BEGIN
    -- 生成幂等键
    v_idempotency_key := p_user_id || ':' || p_symbol || ':' || p_rule_id || ':' || p_notification_date;
    
    -- 检查是否已存在幂等记录
    IF EXISTS (
        SELECT 1 FROM notification_idempotency 
        WHERE user_id = p_user_id 
        AND symbol = p_symbol 
        AND rule_id = p_rule_id 
        AND notification_date = p_notification_date
    ) THEN
        RETURN NULL; -- 已存在，返回NULL
    END IF;
    
    -- 创建通知记录
    INSERT INTO notifications (
        user_id, rule_id, symbol, rule_type, trigger_price, 
        current_price, message, notification_date, type
    ) VALUES (
        p_user_id, p_rule_id, p_symbol, p_rule_type, p_trigger_price,
        p_current_price, p_message, p_notification_date, 'alert'
    ) RETURNING id INTO v_notification_id;
    
    -- 创建幂等记录
    INSERT INTO notification_idempotency (
        user_id, symbol, rule_id, notification_date, idempotency_key
    ) VALUES (
        p_user_id, p_symbol, p_rule_id, p_notification_date, v_idempotency_key
    );
    
    RETURN v_notification_id;
EXCEPTION
    WHEN unique_violation THEN
        -- 并发情况下的重复插入，返回NULL
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 初始化测试数据（仅在开发环境）
-- 注意：生产环境部署时应移除此部分
DO $$
BEGIN
    -- 检查是否存在测试用户，如果不存在则跳过
    IF EXISTS (SELECT 1 FROM users WHERE email LIKE '%test%' LIMIT 1) THEN
        -- 插入测试警报规则
        INSERT INTO alert_rules (user_id, symbol, rule_type, threshold, enabled) 
        SELECT 
            u.id,
            unnest(ARRAY['AAPL', 'GOOGL', 'TSLA', 'MSFT']),
            unnest(ARRAY['price_above', 'price_below', 'price_above', 'price_change']),
            unnest(ARRAY[150.00, 2800.00, 200.00, 5.00]),
            unnest(ARRAY[true, true, true, false])
        FROM users u 
        WHERE u.email LIKE '%test%' 
        LIMIT 1;
    END IF;
END $$;