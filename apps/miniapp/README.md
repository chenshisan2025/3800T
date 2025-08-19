# 股灵通微信小程序

## 项目概述

股灵通是一款专业的股票投资分析微信小程序，提供实时行情、AI智能分析、个股详情、投资组合管理等功能。

## 功能特性

### 📱 核心页面
- **首页 (index)**: 市场概览、热门股票、最新资讯
- **行情 (market)**: 实时股票行情、涨跌排行、板块分析
- **个股 (asset)**: 个股详情、技术分析、基本面数据
- **AI分析 (ai)**: 智能投资建议、市场情绪分析、风险评估
- **我的 (me)**: 用户中心、设置、投资组合管理

### 🔐 用户认证
- 手机号登录（验证码登录）
- 微信授权登录
- JWT Token 自动刷新机制
- 用户状态持久化存储

### 🌐 网络层架构
- 统一API请求封装
- 智能缓存机制（支持多种缓存策略）
- 请求拦截器和响应拦截器
- 错误处理和重试机制
- Token自动刷新和队列管理

### 📬 订阅消息
- 价格提醒订阅
- AI报告完成通知
- 订阅状态管理
- 批量订阅支持

### 🎨 UI设计规范
- 品牌色彩系统（主色调：#2166A5）
- 响应式设计适配
- 统一的组件样式库
- 底部免责声明固定区域

## 技术架构

### 前端技术栈
- **框架**: 微信小程序原生开发
- **样式**: WXSS + 响应式设计
- **状态管理**: 本地存储 + 内存缓存
- **网络请求**: 封装的API服务层

### 项目结构
```
app/miniapp/
├── app.js                 # 小程序入口文件
├── app.json              # 全局配置文件
├── app.wxss              # 全局样式文件
├── pages/                # 页面目录
│   ├── index/           # 首页
│   ├── market/          # 行情页
│   ├── asset/           # 个股页
│   ├── ai/              # AI分析页
│   ├── me/              # 我的页面
│   ├── login/           # 登录页
│   └── protocol/        # 协议页
├── services/            # 服务层
│   ├── api.js          # API服务
│   └── cache.js        # 缓存服务
├── utils/               # 工具类
│   ├── auth.js         # 认证工具
│   ├── request.js      # 请求工具
│   ├── storage.js      # 存储工具
│   └── subscription.js # 订阅消息工具
└── docs/               # 文档目录
    ├── subscription-setup.md    # 订阅消息配置指南
    └── domain-whitelist.md     # 域名白名单配置指南
```

## 核心功能实现

### 1. 页面路由配置

在 `app.json` 中配置了完整的页面路由和TabBar：

```json
{
  "pages": [
    "pages/index/index",
    "pages/market/market",
    "pages/asset/asset",
    "pages/ai/ai",
    "pages/me/me",
    "pages/login/login",
    "pages/protocol/protocol"
  ],
  "tabBar": {
    "color": "#666666",
    "selectedColor": "#2166A5",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/market/market",
        "text": "行情",
        "iconPath": "images/market.png",
        "selectedIconPath": "images/market-active.png"
      },
      {
        "pagePath": "pages/asset/asset",
        "text": "个股",
        "iconPath": "images/asset.png",
        "selectedIconPath": "images/asset-active.png"
      },
      {
        "pagePath": "pages/ai/ai",
        "text": "AI",
        "iconPath": "images/ai.png",
        "selectedIconPath": "images/ai-active.png"
      },
      {
        "pagePath": "pages/me/me",
        "text": "我的",
        "iconPath": "images/me.png",
        "selectedIconPath": "images/me-active.png"
      }
    ]
  }
}
```

### 2. 网络层封装

#### API服务 (`services/api.js`)
- 统一的API接口管理
- 请求和响应拦截
- 错误处理和重试机制
- 支持多种HTTP方法

#### 缓存服务 (`services/cache.js`)
- 多级缓存策略（SHORT/MEDIUM/LONG）
- 自动过期清理
- 内存和本地存储结合
- 缓存统计和监控

#### 请求工具 (`utils/request.js`)
- JWT Token自动管理
- 请求队列和并发控制
- 自动重试和错误恢复
- 请求日志和监控

### 3. 用户认证系统

#### 认证工具 (`utils/auth.js`)
- Token存储和管理
- 用户状态检查
- 自动登录和退出
- 权限验证

#### 登录页面 (`pages/login/`)
- 双登录方式（手机号/微信）
- 验证码倒计时
- 协议同意检查
- 自动跳转逻辑

### 4. 订阅消息系统

#### 订阅管理 (`utils/subscription.js`)
- 模板消息配置
- 订阅状态管理
- 批量订阅支持
- 服务器同步

支持的消息类型：
- 价格提醒通知
- AI报告完成通知

### 5. UI组件系统

#### 全局样式 (`app.wxss`)
- 品牌色彩系统
- 响应式工具类
- 通用组件样式
- 统一的免责声明样式

#### 页面样式
- 一致的视觉风格
- 响应式布局适配
- 品牌色彩应用
- 交互反馈效果

## 部署配置

### 1. 订阅消息模板配置

参考 `docs/subscription-setup.md` 文档，在微信公众平台配置以下模板：

- **价格提醒模板**: 股票价格变动通知
- **AI报告模板**: AI分析报告完成通知

### 2. 业务域名白名单

参考 `docs/domain-whitelist.md` 文档，配置以下域名：

```
# API服务域名
https://api.gulingtong.com
https://api-backup.gulingtong.com

# WebSocket服务域名
wss://ws.gulingtong.com

# CDN资源域名
https://cdn.gulingtong.com

# 第三方数据服务域名
https://api.finance-data.com
https://quote.eastmoney.com
```

### 3. 环境配置

在 `utils/config.js` 中配置不同环境的参数：

```javascript
const CONFIG = {
  development: {
    API_BASE_URL: 'https://dev-api.gulingtong.com',
    WS_BASE_URL: 'wss://dev-ws.gulingtong.com'
  },
  production: {
    API_BASE_URL: 'https://api.gulingtong.com',
    WS_BASE_URL: 'wss://ws.gulingtong.com'
  }
}
```

## 开发指南

### 1. 本地开发

1. 安装微信开发者工具
2. 导入项目目录
3. 配置AppID和开发设置
4. 在详情中关闭域名校验（开发阶段）

### 2. 代码规范

- 使用ES6+语法
- 遵循微信小程序开发规范
- 统一的命名约定
- 完善的错误处理
- 详细的代码注释

### 3. 测试验证

#### 页面功能测试
- ✅ 首页：市场数据展示、搜索功能
- ✅ 行情：股票列表、实时更新
- ✅ 个股：详情展示、技术分析
- ✅ AI分析：智能对话、报告生成
- ✅ 我的：用户信息、设置管理

#### 登录功能测试
- ✅ 手机号登录：验证码发送、登录流程
- ✅ 微信登录：授权流程、用户信息获取
- ✅ Token管理：自动刷新、过期处理

#### 订阅消息测试
- ✅ 模板配置：价格提醒、AI报告通知
- ✅ 订阅流程：用户授权、状态管理
- ✅ 消息发送：服务器集成、推送测试

#### UI样式测试
- ✅ 品牌色彩：统一的色彩应用
- ✅ 响应式设计：不同屏幕尺寸适配
- ✅ 免责声明：底部固定区域显示

## 性能优化

### 1. 缓存策略
- API响应缓存
- 图片资源缓存
- 用户数据本地存储

### 2. 网络优化
- 请求合并和批处理
- 智能重试机制
- 并发请求控制

### 3. 渲染优化
- 虚拟列表（长列表优化）
- 图片懒加载
- 页面预加载

## 安全考虑

### 1. 数据安全
- JWT Token安全存储
- 敏感数据加密
- API接口鉴权

### 2. 网络安全
- HTTPS强制使用
- 请求签名验证
- 防重放攻击

### 3. 用户隐私
- 最小权限原则
- 数据使用透明化
- 用户同意机制

## 监控和维护

### 1. 错误监控
- 异常日志收集
- 性能指标监控
- 用户行为分析

### 2. 版本管理
- 渐进式更新
- 向后兼容性
- 回滚机制

## 联系信息

- **项目负责人**: 开发团队
- **技术支持**: tech@gulingtong.com
- **用户反馈**: feedback@gulingtong.com

---

**免责声明**: 本应用提供的所有信息仅供参考，不构成投资建议。投资有风险，入市需谨慎。

**版本**: v1.0.0  
**更新日期**: 2024年1月1日