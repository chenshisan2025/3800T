-- 创建AI报告表
CREATE TABLE IF NOT EXISTS public.ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL REFERENCES public.stocks(symbol),
    report_type VARCHAR(50) NOT NULL,
    analysis_data JSONB NOT NULL,
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON public.ai_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_stock_symbol ON public.ai_reports(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON public.ai_reports(created_at DESC);

-- 启用行级安全策略
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- 为认证用户创建策略：用户只能查看自己的报告
CREATE POLICY "Users can view own ai reports" ON public.ai_reports
    FOR SELECT USING (auth.uid() = user_id);

-- 为认证用户创建策略：用户可以创建自己的报告
CREATE POLICY "Users can insert own ai reports" ON public.ai_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 为认证用户创建策略：用户可以更新自己的报告
CREATE POLICY "Users can update own ai reports" ON public.ai_reports
    FOR UPDATE USING (auth.uid() = user_id);

-- 为认证用户创建策略：用户可以删除自己的报告
CREATE POLICY "Users can delete own ai reports" ON public.ai_reports
    FOR DELETE USING (auth.uid() = user_id);

-- 授予基本权限
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_reports TO authenticated;
GRANT SELECT ON public.ai_reports TO anon;