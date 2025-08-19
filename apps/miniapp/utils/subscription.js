// utils/subscription.js
// 微信小程序订阅消息管理工具

const { api } = require('../services/api')
const { storage } = require('./storage')

// 订阅消息模板ID配置
const TEMPLATE_IDS = {
  // 价格提醒模板
  PRICE_ALERT: 'your_price_alert_template_id',
  // AI报告完成通知模板
  AI_REPORT: 'your_ai_report_template_id'
}

// 订阅消息类型
const MESSAGE_TYPES = {
  PRICE_ALERT: 'price_alert',
  AI_REPORT: 'ai_report'
}

class SubscriptionManager {
  constructor() {
    this.templateIds = TEMPLATE_IDS
    this.messageTypes = MESSAGE_TYPES
  }
  
  /**
   * 请求订阅消息授权
   * @param {string|Array} messageType - 消息类型或类型数组
   * @returns {Promise<Object>} 授权结果
   */
  async requestSubscription(messageType) {
    try {
      // 确保messageType是数组
      const types = Array.isArray(messageType) ? messageType : [messageType]
      
      // 获取对应的模板ID
      const tmplIds = types.map(type => this.getTemplateId(type)).filter(id => id)
      
      if (tmplIds.length === 0) {
        throw new Error('无效的消息类型')
      }
      
      // 请求订阅消息授权
      const result = await this.requestMessageSubscribe(tmplIds)
      
      // 保存授权状态
      await this.saveSubscriptionStatus(types, result)
      
      // 同步到服务器
      await this.syncSubscriptionToServer(types, result)
      
      return {
        success: true,
        result,
        message: '订阅设置成功'
      }
    } catch (error) {
      console.error('请求订阅消息授权失败', error)
      return {
        success: false,
        error: error.message || '订阅设置失败'
      }
    }
  }
  
  /**
   * 微信订阅消息API调用
   * @param {Array} tmplIds - 模板ID数组
   * @returns {Promise<Object>} 授权结果
   */
  requestMessageSubscribe(tmplIds) {
    return new Promise((resolve, reject) => {
      wx.requestSubscribeMessage({
        tmplIds,
        success: (res) => {
          console.log('订阅消息授权结果', res)
          resolve(res)
        },
        fail: (err) => {
          console.error('订阅消息授权失败', err)
          reject(err)
        }
      })
    })
  }
  
  /**
   * 获取模板ID
   * @param {string} messageType - 消息类型
   * @returns {string} 模板ID
   */
  getTemplateId(messageType) {
    switch (messageType) {
      case MESSAGE_TYPES.PRICE_ALERT:
        return TEMPLATE_IDS.PRICE_ALERT
      case MESSAGE_TYPES.AI_REPORT:
        return TEMPLATE_IDS.AI_REPORT
      default:
        return null
    }
  }
  
  /**
   * 保存订阅状态到本地
   * @param {Array} types - 消息类型数组
   * @param {Object} result - 授权结果
   */
  async saveSubscriptionStatus(types, result) {
    try {
      const subscriptions = await storage.get('subscriptions') || {}
      
      types.forEach(type => {
        const templateId = this.getTemplateId(type)
        if (templateId && result[templateId]) {
          subscriptions[type] = {
            status: result[templateId],
            updateTime: Date.now(),
            templateId
          }
        }
      })
      
      await storage.set('subscriptions', subscriptions)
    } catch (error) {
      console.error('保存订阅状态失败', error)
    }
  }
  
  /**
   * 同步订阅状态到服务器
   * @param {Array} types - 消息类型数组
   * @param {Object} result - 授权结果
   */
  async syncSubscriptionToServer(types, result) {
    try {
      const subscriptionData = types.map(type => {
        const templateId = this.getTemplateId(type)
        return {
          type,
          templateId,
          status: result[templateId] || 'reject',
          updateTime: Date.now()
        }
      })
      
      await api.subscription.updateSubscription(subscriptionData)
    } catch (error) {
      console.error('同步订阅状态到服务器失败', error)
    }
  }
  
  /**
   * 获取本地订阅状态
   * @param {string} messageType - 消息类型
   * @returns {Promise<Object>} 订阅状态
   */
  async getSubscriptionStatus(messageType) {
    try {
      const subscriptions = await storage.get('subscriptions') || {}
      return subscriptions[messageType] || { status: 'unknown' }
    } catch (error) {
      console.error('获取订阅状态失败', error)
      return { status: 'unknown' }
    }
  }
  
  /**
   * 检查是否已订阅
   * @param {string} messageType - 消息类型
   * @returns {Promise<boolean>} 是否已订阅
   */
  async isSubscribed(messageType) {
    const status = await this.getSubscriptionStatus(messageType)
    return status.status === 'accept'
  }
  
  /**
   * 创建价格提醒订阅
   * @param {Object} alertData - 提醒数据
   * @returns {Promise<Object>} 创建结果
   */
  async createPriceAlert(alertData) {
    try {
      // 检查是否已订阅价格提醒
      const isSubscribed = await this.isSubscribed(MESSAGE_TYPES.PRICE_ALERT)
      
      if (!isSubscribed) {
        // 请求订阅授权
        const subscribeResult = await this.requestSubscription(MESSAGE_TYPES.PRICE_ALERT)
        if (!subscribeResult.success) {
          return subscribeResult
        }
        
        // 检查用户是否同意授权
        const templateId = this.getTemplateId(MESSAGE_TYPES.PRICE_ALERT)
        if (subscribeResult.result[templateId] !== 'accept') {
          return {
            success: false,
            error: '需要授权订阅消息才能设置价格提醒'
          }
        }
      }
      
      // 创建价格提醒
      const result = await api.subscription.createPriceAlert(alertData)
      
      return {
        success: true,
        data: result,
        message: '价格提醒设置成功'
      }
    } catch (error) {
      console.error('创建价格提醒失败', error)
      return {
        success: false,
        error: error.message || '设置价格提醒失败'
      }
    }
  }
  
  /**
   * 订阅AI报告通知
   * @param {Object} reportData - 报告数据
   * @returns {Promise<Object>} 订阅结果
   */
  async subscribeAIReport(reportData) {
    try {
      // 检查是否已订阅AI报告通知
      const isSubscribed = await this.isSubscribed(MESSAGE_TYPES.AI_REPORT)
      
      if (!isSubscribed) {
        // 请求订阅授权
        const subscribeResult = await this.requestSubscription(MESSAGE_TYPES.AI_REPORT)
        if (!subscribeResult.success) {
          return subscribeResult
        }
        
        // 检查用户是否同意授权
        const templateId = this.getTemplateId(MESSAGE_TYPES.AI_REPORT)
        if (subscribeResult.result[templateId] !== 'accept') {
          return {
            success: false,
            error: '需要授权订阅消息才能接收AI报告通知'
          }
        }
      }
      
      // 订阅AI报告通知
      const result = await api.subscription.subscribeAIReport(reportData)
      
      return {
        success: true,
        data: result,
        message: 'AI报告通知订阅成功'
      }
    } catch (error) {
      console.error('订阅AI报告通知失败', error)
      return {
        success: false,
        error: error.message || '订阅AI报告通知失败'
      }
    }
  }
  
  /**
   * 批量订阅消息
   * @param {Array} messageTypes - 消息类型数组
   * @returns {Promise<Object>} 订阅结果
   */
  async batchSubscribe(messageTypes) {
    try {
      const result = await this.requestSubscription(messageTypes)
      return result
    } catch (error) {
      console.error('批量订阅消息失败', error)
      return {
        success: false,
        error: error.message || '批量订阅失败'
      }
    }
  }
  
  /**
   * 获取所有订阅状态
   * @returns {Promise<Object>} 所有订阅状态
   */
  async getAllSubscriptionStatus() {
    try {
      const subscriptions = await storage.get('subscriptions') || {}
      return subscriptions
    } catch (error) {
      console.error('获取所有订阅状态失败', error)
      return {}
    }
  }
  
  /**
   * 清除订阅状态
   * @param {string} messageType - 消息类型（可选）
   */
  async clearSubscriptionStatus(messageType) {
    try {
      if (messageType) {
        const subscriptions = await storage.get('subscriptions') || {}
        delete subscriptions[messageType]
        await storage.set('subscriptions', subscriptions)
      } else {
        await storage.remove('subscriptions')
      }
    } catch (error) {
      console.error('清除订阅状态失败', error)
    }
  }
  
  /**
   * 显示订阅引导弹窗
   * @param {string} messageType - 消息类型
   * @param {Object} options - 弹窗选项
   */
  showSubscriptionGuide(messageType, options = {}) {
    const typeNames = {
      [MESSAGE_TYPES.PRICE_ALERT]: '价格提醒',
      [MESSAGE_TYPES.AI_REPORT]: 'AI报告通知'
    }
    
    const typeName = typeNames[messageType] || '消息通知'
    
    wx.showModal({
      title: '开启消息通知',
      content: `开启${typeName}，及时获取重要信息`,
      confirmText: '立即开启',
      cancelText: '暂不开启',
      success: (res) => {
        if (res.confirm) {
          this.requestSubscription(messageType)
        }
        if (options.callback) {
          options.callback(res.confirm)
        }
      }
    })
  }
}

// 创建单例实例
const subscriptionManager = new SubscriptionManager()

module.exports = {
  subscriptionManager,
  MESSAGE_TYPES,
  TEMPLATE_IDS
}