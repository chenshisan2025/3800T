# 管理后台安全配置实施指南

## 1. IP白名单配置实现

### 1.1 配置文件结构

创建 `apps/admin/config/ip-whitelist.json`：
```json
{
  "version": "1.0",
  "last_updated": "2024-01-15T10:00:00Z",
  "whitelist": {
    "internal_networks": [
      {
        "network": "192.168.0.0/16",
        "description": "内网A段",
        "enabled": true
      },
      {
        "network": "10.0.0.0/8",
        "description": "内网B段",
        "enabled": true
      },
      {
        "network": "172.16.0.0/12",
        "description": "内网C段",
        "enabled": true
      }
    ],
    "external_ips": [
      {
        "ip": "203.0.113.50",
        "description": "公司总部固定IP",
        "expires": "2024-12-31T23:59:59Z",
        "enabled": true,
        "added_by": "admin",
        "added_at": "2024-01-15T10:00:00Z"
      },
      {
        "ip": "198.51.100.100",
        "description": "CTO家庭网络",
        "expires": "2024-06-30T23:59:59Z",
        "enabled": true,
        "added_by": "admin",
        "added_at": "2024-01-15T10:00:00Z"
      }
    ],
    "emergency_access": {
      "enabled": false,
      "temp_ips": [],
      "expires_at": null
    }
  },
  "settings": {
    "strict_mode": true,
    "log_blocked_attempts": true,
    "max_attempts_per_hour": 10,
    "auto_ban_duration": 3600
  }
}
```

### 1.2 环境变量配置

在 `apps/admin/.env.production` 中添加：
```env
# 域名配置
ALLOWED_DOMAINS=admin.gulingtong.internal,admin.gulingtong.com
INTERNAL_DOMAIN=admin.gulingtong.internal
PUBLIC_DOMAIN=admin.gulingtong.com

# 安全配置
IP_WHITELIST_ENABLED=true
IP_WHITELIST_STRICT_MODE=true
SECURITY_LOG_LEVEL=info

# SSL配置
SSL_CERT_PATH=/etc/ssl/certs/admin.gulingtong.com.crt
SSL_KEY_PATH=/etc/ssl/private/admin.gulingtong.com.key

# 会话安全
SESSION_TIMEOUT=3600
FORCE_HTTPS=true
SECURE_COOKIES=true
```

### 1.3 中间件实现

创建 `apps/admin/src/middleware/security.ts`：
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isIP } from 'net';

interface IPWhitelistConfig {
  version: string;
  last_updated: string;
  whitelist: {
    internal_networks: Array<{
      network: string;
      description: string;
      enabled: boolean;
    }>;
    external_ips: Array<{
      ip: string;
      description: string;
      expires: string;
      enabled: boolean;
      added_by: string;
      added_at: string;
    }>;
    emergency_access: {
      enabled: boolean;
      temp_ips: string[];
      expires_at: string | null;
    };
  };
  settings: {
    strict_mode: boolean;
    log_blocked_attempts: boolean;
    max_attempts_per_hour: number;
    auto_ban_duration: number;
  };
}

class SecurityMiddleware {
  private config: IPWhitelistConfig;
  private blockedIPs: Map<string, { count: number; lastAttempt: number }> = new Map();

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const configPath = join(process.cwd(), 'config', 'ip-whitelist.json');
      const configData = readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load IP whitelist config:', error);
      // 使用默认配置
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): IPWhitelistConfig {
    return {
      version: '1.0',
      last_updated: new Date().toISOString(),
      whitelist: {
        internal_networks: [
          { network: '192.168.0.0/16', description: '内网A段', enabled: true },
          { network: '10.0.0.0/8', description: '内网B段', enabled: true },
          { network: '172.16.0.0/12', description: '内网C段', enabled: true }
        ],
        external_ips: [],
        emergency_access: {
          enabled: false,
          temp_ips: [],
          expires_at: null
        }
      },
      settings: {
        strict_mode: true,
        log_blocked_attempts: true,
        max_attempts_per_hour: 10,
        auto_ban_duration: 3600
      }
    };
  }

  public async handle(request: NextRequest): Promise<NextResponse> {
    const clientIP = this.getClientIP(request);
    
    // 检查是否启用IP白名单
    if (!process.env.IP_WHITELIST_ENABLED) {
      return NextResponse.next();
    }

    // 检查是否被临时封禁
    if (this.isTemporarilyBlocked(clientIP)) {
      this.logSecurityEvent('TEMP_BLOCKED', clientIP, request);
      return new NextResponse('Too Many Attempts', { status: 429 });
    }

    // 检查IP是否在白名单中
    if (!this.isIPAllowed(clientIP)) {
      this.recordFailedAttempt(clientIP);
      this.logSecurityEvent('ACCESS_DENIED', clientIP, request);
      return new NextResponse('Access Denied', { status: 403 });
    }

    // 检查域名是否允许
    if (!this.isDomainAllowed(request.headers.get('host') || '')) {
      this.logSecurityEvent('INVALID_DOMAIN', clientIP, request);
      return new NextResponse('Invalid Domain', { status: 403 });
    }

    // 添加安全头
    const response = NextResponse.next();
    this.addSecurityHeaders(response);
    
    this.logSecurityEvent('ACCESS_GRANTED', clientIP, request);
    return response;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.ip;

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (remoteAddr) {
      return remoteAddr;
    }
    return 'unknown';
  }

  private isIPAllowed(ip: string): boolean {
    if (!isIP(ip)) {
      return false;
    }

    // 检查紧急访问
    if (this.config.whitelist.emergency_access.enabled) {
      const expiresAt = this.config.whitelist.emergency_access.expires_at;
      if (!expiresAt || new Date() < new Date(expiresAt)) {
        if (this.config.whitelist.emergency_access.temp_ips.includes(ip)) {
          return true;
        }
      }
    }

    // 检查内网IP段
    for (const network of this.config.whitelist.internal_networks) {
      if (network.enabled && this.isIPInNetwork(ip, network.network)) {
        return true;
      }
    }

    // 检查外网白名单IP
    for (const allowedIP of this.config.whitelist.external_ips) {
      if (allowedIP.enabled && 
          ip === allowedIP.ip && 
          new Date() < new Date(allowedIP.expires)) {
        return true;
      }
    }

    return false;
  }

  private isIPInNetwork(ip: string, network: string): boolean {
    const [networkAddr, prefixLength] = network.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    // 简化的IP网段检查（实际应用中建议使用专业库如ipaddr.js）
    const ipParts = ip.split('.').map(Number);
    const networkParts = networkAddr.split('.').map(Number);
    
    const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
    const networkInt = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
    const mask = (-1 << (32 - prefix)) >>> 0;
    
    return (ipInt & mask) === (networkInt & mask);
  }

  private isDomainAllowed(host: string): boolean {
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    return allowedDomains.some(domain => host === domain.trim());
  }

  private isTemporarilyBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip);
    if (!blocked) return false;

    const now = Date.now();
    if (now - blocked.lastAttempt > this.config.settings.auto_ban_duration * 1000) {
      this.blockedIPs.delete(ip);
      return false;
    }

    return blocked.count >= this.config.settings.max_attempts_per_hour;
  }

  private recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const blocked = this.blockedIPs.get(ip) || { count: 0, lastAttempt: 0 };
    
    // 重置计数器如果超过1小时
    if (now - blocked.lastAttempt > 3600000) {
      blocked.count = 0;
    }
    
    blocked.count++;
    blocked.lastAttempt = now;
    this.blockedIPs.set(ip, blocked);
  }

  private addSecurityHeaders(response: NextResponse): void {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    if (process.env.FORCE_HTTPS === 'true') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }

  private logSecurityEvent(event: string, ip: string, request: NextRequest): void {
    if (!this.config.settings.log_blocked_attempts) return;

    const logData = {
      timestamp: new Date().toISOString(),
      event,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      method: request.method,
      host: request.headers.get('host') || 'unknown'
    };

    console.log(`[SECURITY] ${JSON.stringify(logData)}`);
    
    // 这里可以集成到日志系统或安全监控平台
    // 例如发送到ELK Stack、Splunk等
  }
}

// 导出中间件实例
export const securityMiddleware = new SecurityMiddleware();

// Next.js中间件函数
export async function middleware(request: NextRequest) {
  return await securityMiddleware.handle(request);
}

// 配置匹配路径
export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 2. Nginx反向代理配置

### 2.1 主配置文件

创建 `/etc/nginx/sites-available/admin.gulingtong.conf`：
```nginx
# 上游服务器配置
upstream admin_backend {
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# 限制请求频率
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=10r/m;

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name admin.gulingtong.com admin.gulingtong.internal;
    return 301 https://$server_name$request_uri;
}

# HTTPS配置
server {
    listen 443 ssl http2;
    server_name admin.gulingtong.com admin.gulingtong.internal;
    
    # SSL证书配置
    ssl_certificate /etc/ssl/certs/admin.gulingtong.com.crt;
    ssl_certificate_key /etc/ssl/private/admin.gulingtong.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # IP白名单配置
    location / {
        # 内网IP段
        allow 192.168.0.0/16;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        
        # 公司公网IP
        allow 203.0.113.0/24;
        allow 198.51.100.50;
        
        # 拒绝其他IP
        deny all;
        
        # 请求频率限制
        limit_req zone=admin_limit burst=20 nodelay;
        
        # 代理配置
        proxy_pass http://admin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查端点（不受IP限制）
    location /api/health {
        proxy_pass http://admin_backend;
        access_log off;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://admin_backend;
    }
    
    # 日志配置
    access_log /var/log/nginx/admin.access.log combined;
    error_log /var/log/nginx/admin.error.log warn;
}
```

### 2.2 防火墙配置

使用UFW配置防火墙：
```bash
# 启用UFW
sudo ufw enable

# 允许SSH（确保不被锁定）
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允许内网访问管理端口
sudo ufw allow from 192.168.0.0/16 to any port 3001
sudo ufw allow from 10.0.0.0/8 to any port 3001
sudo ufw allow from 172.16.0.0/12 to any port 3001

# 允许特定公网IP访问
sudo ufw allow from 203.0.113.50 to any port 443
sudo ufw allow from 198.51.100.100 to any port 443

# 查看规则
sudo ufw status numbered
```

## 3. 监控和日志

### 3.1 安全日志监控

创建 `apps/admin/src/lib/security-monitor.ts`：
```typescript
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

interface SecurityEvent {
  timestamp: string;
  event: string;
  ip: string;
  userAgent: string;
  url: string;
  method: string;
  host: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private logPath: string;
  private alertThresholds = {
    failed_attempts_per_minute: 5,
    blocked_ips_per_hour: 10,
    suspicious_patterns: [
      /\.\.\//, // 路径遍历
      /<script/i, // XSS尝试
      /union.*select/i, // SQL注入
      /eval\(/i, // 代码注入
    ]
  };

  constructor() {
    this.logPath = join(process.cwd(), 'logs', 'security.log');
  }

  public logEvent(event: SecurityEvent): void {
    const logEntry = JSON.stringify(event) + '\n';
    appendFileSync(this.logPath, logEntry);

    // 检查是否需要告警
    if (this.shouldAlert(event)) {
      this.sendAlert(event);
    }
  }

  private shouldAlert(event: SecurityEvent): boolean {
    // 高危事件直接告警
    if (event.severity === 'critical' || event.severity === 'high') {
      return true;
    }

    // 检查可疑模式
    for (const pattern of this.alertThresholds.suspicious_patterns) {
      if (pattern.test(event.url)) {
        return true;
      }
    }

    return false;
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    // 发送告警到监控系统
    const alertData = {
      title: `安全告警: ${event.event}`,
      message: `检测到可疑活动\nIP: ${event.ip}\nURL: ${event.url}\n时间: ${event.timestamp}`,
      severity: event.severity,
      timestamp: event.timestamp
    };

    // 这里可以集成到告警系统
    // 例如：钉钉、企业微信、邮件、短信等
    console.error(`[SECURITY ALERT] ${JSON.stringify(alertData)}`);
    
    // 示例：发送到钉钉机器人
    if (process.env.DINGTALK_WEBHOOK) {
      try {
        await fetch(process.env.DINGTALK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msgtype: 'text',
            text: {
              content: `🚨 ${alertData.title}\n${alertData.message}`
            }
          })
        });
      } catch (error) {
        console.error('Failed to send DingTalk alert:', error);
      }
    }
  }

  public generateSecurityReport(): object {
    // 生成安全报告
    // 这里可以分析日志文件，生成统计报告
    return {
      report_time: new Date().toISOString(),
      summary: {
        total_events: 0,
        blocked_attempts: 0,
        allowed_access: 0,
        top_blocked_ips: [],
        security_alerts: 0
      }
    };
  }
}

export const securityMonitor = new SecurityMonitor();
```

### 3.2 系统监控脚本

创建 `scripts/security-check.sh`：
```bash
#!/bin/bash

# 安全检查脚本
echo "=== 管理后台安全检查 ==="
echo "检查时间: $(date)"

# 检查Nginx状态
echo "\n1. 检查Nginx状态:"
sudo systemctl status nginx --no-pager -l

# 检查SSL证书有效期
echo "\n2. 检查SSL证书:"
echo | openssl s_client -servername admin.gulingtong.com -connect admin.gulingtong.com:443 2>/dev/null | openssl x509 -noout -dates

# 检查防火墙状态
echo "\n3. 检查防火墙状态:"
sudo ufw status

# 检查最近的安全日志
echo "\n4. 最近的安全事件:"
tail -n 20 /var/log/nginx/admin.error.log

# 检查系统资源
echo "\n5. 系统资源使用:"
df -h
free -h

# 检查网络连接
echo "\n6. 活跃网络连接:"
ss -tuln | grep :443
ss -tuln | grep :3001

echo "\n=== 检查完成 ==="
```

## 4. 部署脚本

### 4.1 自动部署脚本

创建 `scripts/deploy-admin.sh`：
```bash
#!/bin/bash

set -e

echo "=== 管理后台部署脚本 ==="

# 配置变量
APP_DIR="/opt/gulingtong/apps/admin"
NGINX_CONFIG="/etc/nginx/sites-available/admin.gulingtong.conf"
SSL_CERT_DIR="/etc/ssl/certs"
SSL_KEY_DIR="/etc/ssl/private"

# 检查权限
if [ "$EUID" -ne 0 ]; then
  echo "请使用sudo运行此脚本"
  exit 1
fi

# 1. 更新应用代码
echo "1. 更新应用代码..."
cd $APP_DIR
git pull origin main
npm ci --production
npm run build

# 2. 更新IP白名单配置
echo "2. 检查IP白名单配置..."
if [ ! -f "$APP_DIR/config/ip-whitelist.json" ]; then
  echo "警告: IP白名单配置文件不存在"
  exit 1
fi

# 3. 更新Nginx配置
echo "3. 更新Nginx配置..."
cp nginx/admin.conf $NGINX_CONFIG
nginx -t
if [ $? -eq 0 ]; then
  systemctl reload nginx
  echo "Nginx配置更新成功"
else
  echo "Nginx配置测试失败"
  exit 1
fi

# 4. 检查SSL证书
echo "4. 检查SSL证书..."
if [ -f "$SSL_CERT_DIR/admin.gulingtong.com.crt" ]; then
  CERT_EXPIRY=$(openssl x509 -enddate -noout -in "$SSL_CERT_DIR/admin.gulingtong.com.crt" | cut -d= -f2)
  echo "SSL证书有效期至: $CERT_EXPIRY"
else
  echo "警告: SSL证书文件不存在"
fi

# 5. 重启应用服务
echo "5. 重启应用服务..."
systemctl restart gulingtong-admin
if [ $? -eq 0 ]; then
  echo "应用服务重启成功"
else
  echo "应用服务重启失败"
  exit 1
fi

# 6. 健康检查
echo "6. 执行健康检查..."
sleep 10
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://admin.gulingtong.com/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
  echo "健康检查通过"
else
  echo "健康检查失败，HTTP状态码: $HEALTH_CHECK"
  exit 1
fi

# 7. 更新防火墙规则（如果需要）
echo "7. 检查防火墙规则..."
ufw status | grep -q "Status: active"
if [ $? -eq 0 ]; then
  echo "防火墙已启用"
else
  echo "警告: 防火墙未启用"
fi

echo "\n=== 部署完成 ==="
echo "管理后台已成功部署并启动"
echo "访问地址: https://admin.gulingtong.com"
echo "内网地址: https://admin.gulingtong.internal"
```

### 4.2 SSL证书自动更新脚本

创建 `scripts/renew-ssl.sh`：
```bash
#!/bin/bash

# SSL证书自动更新脚本
echo "=== SSL证书更新检查 ==="

# 检查证书有效期
CERT_FILE="/etc/ssl/certs/admin.gulingtong.com.crt"
if [ -f "$CERT_FILE" ]; then
  EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
  EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
  CURRENT_TIMESTAMP=$(date +%s)
  DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
  
  echo "证书有效期至: $EXPIRY_DATE"
  echo "剩余天数: $DAYS_UNTIL_EXPIRY"
  
  # 如果证书在30天内过期，尝试更新
  if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "证书即将过期，开始更新..."
    certbot renew --nginx --quiet
    if [ $? -eq 0 ]; then
      echo "证书更新成功"
      systemctl reload nginx
    else
      echo "证书更新失败"
      # 发送告警
      curl -X POST "$DINGTALK_WEBHOOK" \
        -H 'Content-Type: application/json' \
        -d '{"msgtype": "text", "text": {"content": "🚨 SSL证书更新失败，请手动处理"}}'
    fi
  else
    echo "证书有效期充足，无需更新"
  fi
else
  echo "错误: 证书文件不存在"
  exit 1
fi
```

## 5. 系统服务配置

### 5.1 Systemd服务文件

创建 `/etc/systemd/system/gulingtong-admin.service`：
```ini
[Unit]
Description=Gulingtong Admin Panel
After=network.target
Requires=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/gulingtong/apps/admin
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gulingtong-admin

# 安全配置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/gulingtong/apps/admin/logs

# 资源限制
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### 5.2 日志轮转配置

创建 `/etc/logrotate.d/gulingtong-admin`：
```
/opt/gulingtong/apps/admin/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload gulingtong-admin
    endscript
}

/var/log/nginx/admin.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        systemctl reload nginx
    endscript
}
```

## 6. 安全检查清单

### 6.1 部署前检查
- [ ] IP白名单配置文件已创建并验证
- [ ] SSL证书已安装并有效
- [ ] Nginx配置已测试通过
- [ ] 防火墙规则已配置
- [ ] 系统服务文件已创建
- [ ] 日志目录权限已设置
- [ ] 环境变量已配置

### 6.2 部署后验证
- [ ] 管理后台可正常访问
- [ ] IP白名单生效（非白名单IP被拒绝）
- [ ] HTTPS强制跳转正常
- [ ] 安全头设置正确
- [ ] 日志记录正常
- [ ] 监控告警正常
- [ ] 证书自动更新配置

### 6.3 定期维护
- [ ] 每周检查安全日志
- [ ] 每月更新IP白名单
- [ ] 每季度安全审计
- [ ] 证书到期前30天更新
- [ ] 系统补丁及时安装

---

*配置文档最后更新: 2024年1月*