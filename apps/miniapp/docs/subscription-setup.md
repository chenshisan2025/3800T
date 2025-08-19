# 微信小程序订阅消息配置指南

## 概述

本文档说明如何在微信小程序后台配置订阅消息模板，以支持股灵通小程序的价格提醒和AI报告完成通知功能。

## 前置条件

1. 已注册微信小程序账号
2. 小程序已通过审核并发布
3. 具有小程序管理员权限

## 配置步骤

### 1. 登录微信公众平台

访问 [微信公众平台](https://mp.weixin.qq.com/) 并登录小程序账号。

### 2. 进入订阅消息管理

1. 在左侧菜单中选择「功能」→「订阅消息」
2. 点击「公共模板库」选择合适的模板
3. 或点击「我的模板」管理已添加的模板

### 3. 添加价格提醒模板

#### 模板类型：价格提醒

**推荐模板关键词：**
- 股票名称 {{thing1.DATA}}
- 当前价格 {{amount2.DATA}}
- 提醒类型 {{thing3.DATA}}
- 提醒时间 {{time4.DATA}}
- 温馨提示 {{thing5.DATA}}

**模板示例：**
```
股票价格提醒

股票名称：{{thing1.DATA}}
当前价格：{{amount2.DATA}}
提醒类型：{{thing3.DATA}}
提醒时间：{{time4.DATA}}
温馨提示：{{thing5.DATA}}
```

**使用场景：**
- 股票价格达到用户设定的目标价格时发送提醒
- 股票价格突破重要技术位时发送提醒
- 股票涨跌幅超过设定阈值时发送提醒

### 4. 添加AI报告完成通知模板

#### 模板类型：AI报告完成通知

**推荐模板关键词：**
- 报告类型 {{thing1.DATA}}
- 股票名称 {{thing2.DATA}}
- 完成时间 {{time3.DATA}}
- 分析结果 {{thing4.DATA}}
- 查看提示 {{thing5.DATA}}

**模板示例：**
```
AI分析报告已完成

报告类型：{{thing1.DATA}}
股票名称：{{thing2.DATA}}
完成时间：{{time3.DATA}}
分析结果：{{thing4.DATA}}
查看提示：{{thing5.DATA}}
```

**使用场景：**
- AI技术分析报告生成完成时通知用户
- AI基本面分析报告完成时通知用户
- AI市场情绪分析完成时通知用户
- AI风险评估报告完成时通知用户

### 5. 获取模板ID

1. 在「我的模板」页面查看已添加的模板
2. 复制每个模板的模板ID（格式如：`ABC123def456GHI789jkl`）
3. 将模板ID更新到小程序代码中

### 6. 更新代码配置

在 `utils/subscription.js` 文件中更新模板ID：

```javascript
const TEMPLATE_IDS = {
  // 价格提醒模板ID（替换为实际的模板ID）
  PRICE_ALERT: 'your_actual_price_alert_template_id',
  // AI报告完成通知模板ID（替换为实际的模板ID）
  AI_REPORT: 'your_actual_ai_report_template_id'
}
```

## 使用说明

### 在代码中使用订阅消息

```javascript
const { subscriptionManager, MESSAGE_TYPES } = require('../utils/subscription')

// 创建价格提醒
const alertResult = await subscriptionManager.createPriceAlert({
  stockCode: '000001',
  stockName: '平安银行',
  targetPrice: 15.50,
  alertType: 'above' // above: 高于, below: 低于
})

// 订阅AI报告通知
const reportResult = await subscriptionManager.subscribeAIReport({
  stockCode: '000001',
  reportType: 'technical' // technical: 技术分析, fundamental: 基本面分析
})

// 批量订阅
const batchResult = await subscriptionManager.batchSubscribe([
  MESSAGE_TYPES.PRICE_ALERT,
  MESSAGE_TYPES.AI_REPORT
])
```

### 检查订阅状态

```javascript
// 检查是否已订阅价格提醒
const isPriceAlertSubscribed = await subscriptionManager.isSubscribed(MESSAGE_TYPES.PRICE_ALERT)

// 获取所有订阅状态
const allStatus = await subscriptionManager.getAllSubscriptionStatus()
```

## 注意事项

### 1. 模板审核
- 提交的模板需要通过微信审核才能使用
- 审核时间通常为1-3个工作日
- 模板内容需要符合微信规范，不能包含营销推广内容

### 2. 发送限制
- 用户需要主动触发订阅才能接收消息
- 每个用户每个模板每天最多发送3条消息
- 用户可以随时取消订阅

### 3. 数据格式要求
- `thing` 类型：20个以内字符，可以包含数字、字母、中文
- `amount` 类型：金额，支持小数点后两位
- `time` 类型：时间格式，如 "2024-01-01 12:00:00"
- `number` 类型：纯数字

### 4. 用户体验建议
- 在合适的时机引导用户订阅，避免过于频繁的弹窗
- 提供清晰的订阅说明，让用户了解会收到什么类型的消息
- 支持用户在设置页面管理订阅状态

## 测试验证

### 1. 开发环境测试
1. 在微信开发者工具中测试订阅消息功能
2. 检查模板ID是否正确配置
3. 验证订阅流程是否正常

### 2. 真机测试
1. 在真实设备上测试订阅消息
2. 验证消息是否能正常接收
3. 检查消息内容格式是否正确

### 3. 线上验证
1. 小程序发布后进行完整测试
2. 监控订阅消息的发送成功率
3. 收集用户反馈并优化

## 常见问题

### Q1: 模板审核不通过怎么办？
A: 检查模板内容是否符合微信规范，避免包含营销、广告等敏感词汇，重新提交审核。

### Q2: 用户收不到订阅消息？
A: 检查用户是否已订阅、模板ID是否正确、消息发送频率是否超限。

### Q3: 如何提高用户订阅率？
A: 在用户有明确需求时引导订阅，提供清晰的价值说明，避免强制订阅。

### Q4: 订阅消息发送失败？
A: 检查服务器端发送逻辑、用户订阅状态、模板参数格式是否正确。

## 相关链接

- [微信小程序订阅消息官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html)
- [微信公众平台](https://mp.weixin.qq.com/)
- [小程序开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

---

**更新日期：2024年1月1日**
**文档版本：v1.0**