# 移动端打包与部署指南

## 1. iOS/Android 打包说明

### 1.1 iOS 打包配置

#### 证书配置
- **开发者证书**: 需要有效的 Apple Developer Program 账号
- **Distribution Certificate**: 用于App Store发布的分发证书
- **Provisioning Profile**: 包含应用Bundle ID和设备信息的配置文件
- **推送证书**: APNs证书用于推送通知功能

配置步骤：
1. 在Apple Developer Console创建App ID
2. 生成Distribution Certificate
3. 创建Provisioning Profile并下载
4. 在Xcode中配置签名设置

#### 应用图标
- **图标尺寸要求**:
  - App Store: 1024x1024px (PNG格式，无透明度)
  - iPhone: 60x60, 120x120, 180x180px
  - iPad: 76x76, 152x152, 167x167px
- **设计要求**: 圆角由系统自动处理，提供方形图标
- **文件格式**: PNG格式，RGB色彩空间

#### 隐私清单配置
创建 `PrivacyInfo.xcprivacy` 文件：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

#### App Store 上架表单
- **应用信息**:
  - 应用名称: 古灵通
  - 副标题: 智能股票分析助手
  - 关键词: 股票,投资,分析,AI,财经
  - 应用描述: 详细功能介绍
- **分类**: 财务类应用
- **年龄分级**: 4+（无限制内容）
- **价格**: 免费（含应用内购买）
- **隐私政策URL**: https://your-domain.com/privacy
- **支持URL**: https://your-domain.com/support

### 1.2 Android 打包配置

#### 签名证书
生成发布密钥：
```bash
keytool -genkey -v -keystore gulingtong-release-key.keystore -alias gulingtong -keyalg RSA -keysize 2048 -validity 10000
```

在 `android/gradle.properties` 中配置：
```properties
GULINGTONG_UPLOAD_STORE_FILE=gulingtong-release-key.keystore
GULINGTONG_UPLOAD_KEY_ALIAS=gulingtong
GULINGTONG_UPLOAD_STORE_PASSWORD=your_store_password
GULINGTONG_UPLOAD_KEY_PASSWORD=your_key_password
```

#### 应用图标
- **图标尺寸**:
  - mdpi: 48x48px
  - hdpi: 72x72px
  - xhdpi: 96x96px
  - xxhdpi: 144x144px
  - xxxhdpi: 192x192px
- **Play Store图标**: 512x512px (PNG格式)
- **自适应图标**: 提供前景和背景图层

#### 隐私清单
在 `android/app/src/main/AndroidManifest.xml` 中声明权限：
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

#### Google Play 上架表单
- **应用详情**:
  - 应用名称: 古灵通
  - 简短说明: AI驱动的股票分析工具
  - 完整说明: 详细功能介绍
- **图形资源**:
  - 应用图标: 512x512px
  - 功能图片: 1024x500px
  - 手机截图: 至少2张
- **内容分级**: 所有人
- **应用类别**: 财务
- **隐私政策**: 必须提供URL

## 2. 小程序上架清单

### 2.1 业务域名配置

#### 服务器域名设置
在微信公众平台配置以下域名：

**request合法域名**:
- https://api.gulingtong.com
- https://data.gulingtong.com

**socket合法域名**:
- wss://ws.gulingtong.com

**uploadFile合法域名**:
- https://upload.gulingtong.com

**downloadFile合法域名**:
- https://cdn.gulingtong.com

#### 业务域名验证
1. 下载验证文件到服务器根目录
2. 确保域名可正常访问验证文件
3. 在小程序管理后台完成验证

### 2.2 备案要求

#### ICP备案
- **主体备案**: 公司营业执照备案
- **网站备案**: 所有使用的域名必须完成ICP备案
- **备案号显示**: 在小程序页面底部显示备案号

#### 备案材料
- 营业执照副本
- 法人身份证
- 网站负责人身份证
- 真实性核验单
- 网站建设方案书

### 2.3 模板消息配置

#### 消息模板申请
在微信公众平台申请以下模板消息：

**股价提醒通知**:
```
{{thing1.DATA}}
股票代码：{{character_string2.DATA}}
当前价格：{{amount3.DATA}}
涨跌幅：{{phrase4.DATA}}
提醒时间：{{time5.DATA}}
```

**AI分析完成通知**:
```
{{thing1.DATA}}
分析股票：{{thing2.DATA}}
分析结果：{{thing3.DATA}}
完成时间：{{time4.DATA}}
```

#### 订阅消息配置
```javascript
// 在小程序中申请订阅权限
wx.requestSubscribeMessage({
  tmplIds: [
    'template_id_1', // 股价提醒
    'template_id_2'  // AI分析完成
  ],
  success(res) {
    console.log('订阅成功', res);
  }
});
```

### 2.4 小程序审核要点

#### 功能完整性
- 所有页面功能正常
- 无空白页面或错误页面
- 用户流程完整可用

#### 内容合规性
- 无违法违规内容
- 金融类内容需要相关资质
- 用户协议和隐私政策完整

#### 技术要求
- 兼容最新版本微信
- 加载速度符合要求
- 无明显bug或崩溃

## 3. 管理后台域名绑定与IP白名单

### 3.1 域名绑定配置

#### 内网域名配置
在 `apps/admin/.env.production` 中配置：
```env
# 允许的域名列表
ALLOWED_DOMAINS=admin.gulingtong.internal,admin.gulingtong.com

# 内网域名
INTERNAL_DOMAIN=admin.gulingtong.internal

# 公网域名（仅限白名单IP访问）
PUBLIC_DOMAIN=admin.gulingtong.com
```

#### Nginx配置
```nginx
server {
    listen 80;
    server_name admin.gulingtong.internal admin.gulingtong.com;
    
    # IP白名单配置
    location / {
        # 允许内网IP段
        allow 192.168.0.0/16;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        
        # 允许特定公网IP
        allow 203.0.113.0/24;  # 公司公网IP段
        allow 198.51.100.50;   # 特定管理员IP
        
        # 拒绝其他所有IP
        deny all;
        
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3.2 IP白名单管理

#### 白名单配置文件
创建 `config/ip-whitelist.json`：
```json
{
  "whitelist": {
    "internal_networks": [
      "192.168.0.0/16",
      "10.0.0.0/8",
      "172.16.0.0/12"
    ],
    "external_ips": [
      {
        "ip": "203.0.113.50",
        "description": "公司总部",
        "expires": "2024-12-31"
      },
      {
        "ip": "198.51.100.100",
        "description": "管理员家庭网络",
        "expires": "2024-06-30"
      }
    ]
  }
}
```

#### 中间件实现
在 `apps/admin/src/middleware/ipWhitelist.ts`：
```typescript
import { NextRequest, NextResponse } from 'next/server';
import ipWhitelist from '../../config/ip-whitelist.json';

export function ipWhitelistMiddleware(request: NextRequest) {
  const clientIP = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown';

  // 检查是否在白名单中
  if (!isIPAllowed(clientIP)) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  return NextResponse.next();
}

function isIPAllowed(ip: string): boolean {
  // 检查内网IP段
  for (const network of ipWhitelist.whitelist.internal_networks) {
    if (isIPInNetwork(ip, network)) {
      return true;
    }
  }

  // 检查外网白名单IP
  for (const allowedIP of ipWhitelist.whitelist.external_ips) {
    if (ip === allowedIP.ip && new Date() < new Date(allowedIP.expires)) {
      return true;
    }
  }

  return false;
}
```

### 3.3 SSL证书配置

#### 内网证书
使用自签名证书或内部CA：
```bash
# 生成私钥
openssl genrsa -out admin.gulingtong.internal.key 2048

# 生成证书签名请求
openssl req -new -key admin.gulingtong.internal.key -out admin.gulingtong.internal.csr

# 生成自签名证书
openssl x509 -req -days 365 -in admin.gulingtong.internal.csr -signkey admin.gulingtong.internal.key -out admin.gulingtong.internal.crt
```

#### 公网证书
使用Let's Encrypt或商业证书：
```bash
# 使用certbot申请Let's Encrypt证书
certbot certonly --nginx -d admin.gulingtong.com
```

## 4. 部署检查清单

### 4.1 iOS/Android 打包检查
- [ ] 开发者证书配置完成
- [ ] 应用图标符合规范
- [ ] 隐私清单文件完整
- [ ] 上架表单信息准确
- [ ] 测试版本功能正常
- [ ] 审核指南合规性检查

### 4.2 小程序上架检查
- [ ] 业务域名配置并验证
- [ ] ICP备案完成
- [ ] 模板消息申请通过
- [ ] 功能完整性测试
- [ ] 内容合规性审查
- [ ] 用户协议和隐私政策

### 4.3 管理后台安全检查
- [ ] 域名绑定配置
- [ ] IP白名单生效
- [ ] SSL证书安装
- [ ] 访问权限测试
- [ ] 安全日志监控
- [ ] 备份恢复机制

## 5. 联系信息

**技术支持**: tech@gulingtong.com  
**运维团队**: ops@gulingtong.com  
**紧急联系**: +86-xxx-xxxx-xxxx

---

*本文档最后更新时间: 2024年1月*