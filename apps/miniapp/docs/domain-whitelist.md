# 微信小程序业务域名白名单配置指南

## 概述

本文档说明如何在微信小程序后台配置业务域名白名单，以确保股灵通小程序能够正常访问后端API服务和第三方服务。

## 前置条件

1. 已注册微信小程序账号
2. 小程序已通过审核并发布
3. 具有小程序管理员权限
4. 已准备好需要访问的域名列表

## 配置步骤

### 1. 登录微信公众平台

访问 [微信公众平台](https://mp.weixin.qq.com/) 并登录小程序账号。

### 2. 进入开发管理

1. 在左侧菜单中选择「开发」→「开发管理」
2. 点击「开发设置」选项卡
3. 找到「服务器域名」配置区域

### 3. 配置服务器域名

#### 3.1 request合法域名（必需）

用于 `wx.request`、`wx.uploadFile`、`wx.downloadFile` 等API的域名配置。

**需要配置的域名：**
```
# 生产环境API服务器
https://api.gulingtong.com

# 备用API服务器（可选）
https://api-backup.gulingtong.com

# CDN资源服务器（用于图片、文件等）
https://cdn.gulingtong.com

# 第三方数据服务（如股票数据API）
https://api.finance-data.com
https://quote.eastmoney.com
https://push2.eastmoney.com

# 微信支付相关（如需要）
https://api.mch.weixin.qq.com
```

#### 3.2 socket合法域名（可选）

用于 `wx.connectSocket` 的WebSocket连接域名。

**需要配置的域名：**
```
# WebSocket实时数据推送
wss://ws.gulingtong.com

# 备用WebSocket服务
wss://ws-backup.gulingtong.com
```

#### 3.3 uploadFile合法域名（可选）

用于 `wx.uploadFile` 的文件上传域名。

**需要配置的域名：**
```
# 文件上传服务器
https://upload.gulingtong.com

# 图片上传CDN
https://img-upload.gulingtong.com
```

#### 3.4 downloadFile合法域名（可选）

用于 `wx.downloadFile` 的文件下载域名。

**需要配置的域名：**
```
# 文件下载服务器
https://download.gulingtong.com

# 报告文件下载
https://reports.gulingtong.com
```

### 4. 域名验证要求

#### 4.1 HTTPS要求
- 所有域名必须支持HTTPS
- SSL证书必须有效且未过期
- 不支持IP地址，只能使用域名

#### 4.2 域名验证文件
配置域名时，需要在域名根目录下放置验证文件：
```
# 验证文件路径示例
https://api.gulingtong.com/MP_verify_xxxxxxxxxx.txt
```

验证文件内容为微信提供的随机字符串。

### 5. 开发环境配置

#### 5.1 开发者工具设置
在微信开发者工具中：
1. 点击右上角「详情」
2. 在「本地设置」中勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
3. 这样可以在开发阶段使用本地服务器或HTTP域名

#### 5.2 测试环境域名
```
# 测试环境API（仅开发阶段使用）
https://test-api.gulingtong.com
https://dev-api.gulingtong.com
```

## 代码中的域名使用

### 1. 环境配置

在 `utils/config.js` 中配置不同环境的域名：

```javascript
// utils/config.js
const ENV = 'production' // 'development' | 'test' | 'production'

const CONFIG = {
  development: {
    API_BASE_URL: 'https://dev-api.gulingtong.com',
    WS_BASE_URL: 'wss://dev-ws.gulingtong.com',
    CDN_BASE_URL: 'https://dev-cdn.gulingtong.com'
  },
  test: {
    API_BASE_URL: 'https://test-api.gulingtong.com',
    WS_BASE_URL: 'wss://test-ws.gulingtong.com',
    CDN_BASE_URL: 'https://test-cdn.gulingtong.com'
  },
  production: {
    API_BASE_URL: 'https://api.gulingtong.com',
    WS_BASE_URL: 'wss://ws.gulingtong.com',
    CDN_BASE_URL: 'https://cdn.gulingtong.com'
  }
}

module.exports = CONFIG[ENV]
```

### 2. API请求中使用

在 `services/api.js` 中使用配置的域名：

```javascript
// services/api.js
const config = require('../utils/config')

class ApiService {
  constructor() {
    this.baseURL = config.API_BASE_URL
  }

  request(options) {
    const url = options.url.startsWith('http') 
      ? options.url 
      : `${this.baseURL}${options.url}`
    
    return wx.request({
      ...options,
      url
    })
  }
}
```

### 3. WebSocket连接

```javascript
// utils/websocket.js
const config = require('./config')

class WebSocketManager {
  connect() {
    this.socket = wx.connectSocket({
      url: `${config.WS_BASE_URL}/realtime`
    })
  }
}
```

## 常见问题

### Q1: 域名配置后仍然无法访问？
A: 检查以下几点：
- 域名是否支持HTTPS
- SSL证书是否有效
- 验证文件是否正确放置
- 是否在开发者工具中关闭了域名校验

### Q2: 如何添加新的域名？
A: 在微信公众平台的开发设置中，点击对应类型域名的「修改」按钮，添加新域名并完成验证。

### Q3: 域名数量有限制吗？
A: 每种类型的域名最多可以配置20个，建议合理规划域名使用。

### Q4: 可以使用通配符域名吗？
A: 不支持通配符域名，每个子域名都需要单独配置。

### Q5: 本地开发如何处理域名限制？
A: 在开发者工具中关闭域名校验，或者使用内网穿透工具将本地服务映射到HTTPS域名。

## 安全建议

### 1. 域名安全
- 定期检查SSL证书有效期
- 使用强SSL配置（TLS 1.2+）
- 避免使用过多不必要的域名

### 2. API安全
- 实施API访问频率限制
- 使用JWT等安全的身份验证机制
- 对敏感API进行IP白名单限制

### 3. 监控告警
- 监控域名SSL证书到期时间
- 监控API服务可用性
- 设置异常访问告警

## 域名管理最佳实践

### 1. 域名规划
```
# 主域名
gulingtong.com

# API服务
api.gulingtong.com          # 主API服务
api-v2.gulingtong.com       # API版本管理

# 静态资源
cdn.gulingtong.com          # CDN资源
img.gulingtong.com          # 图片资源

# 实时服务
ws.gulingtong.com           # WebSocket服务
push.gulingtong.com         # 推送服务

# 文件服务
upload.gulingtong.com       # 文件上传
download.gulingtong.com     # 文件下载

# 环境区分
dev-api.gulingtong.com      # 开发环境
test-api.gulingtong.com     # 测试环境
```

### 2. 版本管理
- 为API服务规划版本域名
- 保持向后兼容性
- 提前规划域名升级策略

### 3. 备份方案
- 配置备用域名
- 实施故障转移机制
- 定期测试备用服务

## 相关链接

- [微信小程序服务器域名配置官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)
- [微信公众平台](https://mp.weixin.qq.com/)
- [SSL证书检测工具](https://www.ssllabs.com/ssltest/)

---

**更新日期：2024年1月1日**
**文档版本：v1.0**