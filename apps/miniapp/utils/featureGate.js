// utils/featureGate.js
const { request } = require('./request')
const { auth } = require('./auth')

/**
 * 功能门控工具类
 * 用于检查用户订阅权限和功能限制
 */
class FeatureGate {
  constructor() {
    this.userInfo = null
    this.subscriptionInfo = null
    this.lastUpdateTime = 0
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 获取用户订阅信息
   */
  async getUserSubscription() {
    const now = Date.now()
    
    // 检查缓存是否有效
    if (this.subscriptionInfo && (now - this.lastUpdateTime) < this.cacheTimeout) {
      return this.subscriptionInfo
    }

    try {
      // 检查登录状态
      const isLogin = await auth.checkLoginStatus()
      if (!isLogin) {
        return this.getDefaultSubscription()
      }

      // 获取用户信息和订阅状态
      const response = await request.get('/api/auth/me')
      if (response.success && response.data) {
        this.userInfo = response.data
        this.subscriptionInfo = response.data.subscription || this.getDefaultSubscription()
        this.lastUpdateTime = now
        return this.subscriptionInfo
      }
    } catch (error) {
      console.error('获取用户订阅信息失败:', error)
    }

    return this.getDefaultSubscription()
  }

  /**
   * 获取默认订阅信息（免费套餐）
   */
  getDefaultSubscription() {
    return {
      plan: 'free',
      features: {
        aiDeepAnalysis: false,
        dataExport: false,
        advancedCharts: false,
        realtimeData: false
      },
      limits: {
        aiReportsPerDay: 3,
        aiReportsPerMonth: 30,
        watchlistLimit: 10,
        alertLimit: 5
      },
      usage: {
        aiReportsToday: 0,
        aiReportsThisMonth: 0,
        watchlistCount: 0,
        alertCount: 0
      }
    }
  }

  /**
   * 检查功能权限
   * @param {string} feature 功能名称
   * @returns {boolean} 是否有权限
   */
  async hasFeature(feature) {
    const subscription = await this.getUserSubscription()
    return subscription.features[feature] || false
  }

  /**
   * 检查使用限制
   * @param {string} limitType 限制类型
   * @returns {object} 限制检查结果
   */
  async checkLimit(limitType) {
    const subscription = await this.getUserSubscription()
    const limit = subscription.limits[limitType]
    const usage = subscription.usage[limitType.replace('Limit', 'Count')]
    
    return {
      hasLimit: limit !== undefined,
      limit: limit || 0,
      usage: usage || 0,
      remaining: Math.max(0, (limit || 0) - (usage || 0)),
      canUse: !limit || (usage || 0) < limit
    }
  }

  /**
   * 显示升级提示
   * @param {string} feature 功能名称
   * @param {string} reason 升级原因
   */
  showUpgradePrompt(feature, reason) {
    const featureNames = {
      aiDeepAnalysis: 'AI深度分析',
      dataExport: '数据导出',
      advancedCharts: '高级图表',
      realtimeData: '实时行情',
      watchlistLimit: '自选股数量',
      alertLimit: '提醒数量',
      aiReportsPerDay: '每日AI报告',
      aiReportsPerMonth: '每月AI报告'
    }

    const featureName = featureNames[feature] || feature
    
    wx.showModal({
      title: '功能升级',
      content: `${featureName}是Pro会员专享功能。\n\n${reason || '升级Pro会员即可解锁更多高级功能！'}`,
      confirmText: '立即升级',
      cancelText: '暂不升级',
      success: (res) => {
        if (res.confirm) {
          this.navigateToUpgrade()
        }
      }
    })
  }

  /**
   * 显示限制提示
   * @param {string} limitType 限制类型
   * @param {object} limitInfo 限制信息
   */
  showLimitPrompt(limitType, limitInfo) {
    const limitMessages = {
      watchlistLimit: `您的自选股已达到上限（${limitInfo.limit}只）`,
      alertLimit: `您的提醒已达到上限（${limitInfo.limit}个）`,
      aiReportsPerDay: `您今日的AI报告已达到上限（${limitInfo.limit}次）`,
      aiReportsPerMonth: `您本月的AI报告已达到上限（${limitInfo.limit}次）`
    }

    const message = limitMessages[limitType] || `已达到使用上限（${limitInfo.limit}）`
    
    wx.showModal({
      title: '使用限制',
      content: `${message}\n\n升级Pro会员可获得更高的使用限额！`,
      confirmText: '立即升级',
      cancelText: '我知道了',
      success: (res) => {
        if (res.confirm) {
          this.navigateToUpgrade()
        }
      }
    })
  }

  /**
   * 跳转到升级页面
   */
  navigateToUpgrade() {
    wx.navigateTo({
      url: '/pages/upgrade/upgrade'
    })
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.userInfo = null
    this.subscriptionInfo = null
    this.lastUpdateTime = 0
  }

  /**
   * 获取套餐信息
   */
  async getPricingInfo() {
    try {
      const response = await request.get('/api/pricing')
      if (response.success) {
        return response.data
      }
    } catch (error) {
      console.error('获取套餐信息失败:', error)
    }
    return null
  }

  /**
   * 获取升级提示文案
   * @param {string} feature 功能名称
   */
  async getUpgradeMessage(feature) {
    try {
      const response = await request.get(`/api/pricing/upgrade-prompt?feature=${feature}`)
      if (response.success) {
        return response.data.message
      }
    } catch (error) {
      console.error('获取升级提示失败:', error)
    }
    return '升级Pro会员即可解锁此功能！'
  }
}

// 创建单例实例
const featureGate = new FeatureGate()

module.exports = {
  featureGate,
  
  // 便捷方法
  async hasFeature(feature) {
    return await featureGate.hasFeature(feature)
  },
  
  async checkLimit(limitType) {
    return await featureGate.checkLimit(limitType)
  },
  
  showUpgradePrompt(feature, reason) {
    featureGate.showUpgradePrompt(feature, reason)
  },
  
  showLimitPrompt(limitType, limitInfo) {
    featureGate.showLimitPrompt(limitType, limitInfo)
  },
  
  async getUserSubscription() {
    return await featureGate.getUserSubscription()
  },
  
  clearCache() {
    featureGate.clearCache()
  }
}