// utils/subscription.js
// 微信小程序订阅消息管理工具

const { api } = require('../services/api');
const { storage } = require('./storage');

// 订阅消息模板ID配置
const TEMPLATE_IDS = {
  // 价格提醒模板
  PRICE_ALERT: 'GLT_PRICE_ALERT_001',
  // AI报告完成通知模板
  AI_REPORT: 'GLT_AI_REPORT_002',
  // 市场动态通知模板
  MARKET_NEWS: 'GLT_MARKET_NEWS_003',
  // 资产变动提醒模板
  ASSET_CHANGE: 'GLT_ASSET_CHANGE_004',
  // 系统维护通知模板
  SYSTEM_MAINTENANCE: 'GLT_SYSTEM_MAINT_005',
  // 交易确认通知模板
  TRADE_CONFIRM: 'GLT_TRADE_CONFIRM_006',
  // 风险提醒模板
  RISK_WARNING: 'GLT_RISK_WARNING_007',
  // 活动通知模板
  ACTIVITY_NOTICE: 'GLT_ACTIVITY_008',
  // 账户安全提醒模板
  SECURITY_ALERT: 'GLT_SECURITY_009',
  // 订阅到期提醒模板
  SUBSCRIPTION_EXPIRE: 'GLT_SUB_EXPIRE_010',
};

// 订阅消息类型
const MESSAGE_TYPES = {
  PRICE_ALERT: 'price_alert',
  AI_REPORT: 'ai_report',
  MARKET_NEWS: 'market_news',
  ASSET_CHANGE: 'asset_change',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  TRADE_CONFIRM: 'trade_confirm',
  RISK_WARNING: 'risk_warning',
  ACTIVITY_NOTICE: 'activity_notice',
  SECURITY_ALERT: 'security_alert',
  SUBSCRIPTION_EXPIRE: 'subscription_expire',
};

// 消息类型配置
const MESSAGE_CONFIG = {
  [MESSAGE_TYPES.PRICE_ALERT]: {
    name: '价格提醒',
    description: '当关注的资产价格达到设定条件时通知您',
    icon: '📈',
    priority: 'high',
    category: 'trading',
  },
  [MESSAGE_TYPES.AI_REPORT]: {
    name: 'AI报告通知',
    description: 'AI分析报告生成完成后及时通知您',
    icon: '🤖',
    priority: 'medium',
    category: 'analysis',
  },
  [MESSAGE_TYPES.MARKET_NEWS]: {
    name: '市场动态',
    description: '重要市场资讯和行情变化及时推送',
    icon: '📰',
    priority: 'medium',
    category: 'market',
  },
  [MESSAGE_TYPES.ASSET_CHANGE]: {
    name: '资产变动',
    description: '账户资产发生重要变化时通知您',
    icon: '💰',
    priority: 'high',
    category: 'account',
  },
  [MESSAGE_TYPES.SYSTEM_MAINTENANCE]: {
    name: '系统维护',
    description: '系统维护和更新通知',
    icon: '🔧',
    priority: 'low',
    category: 'system',
  },
  [MESSAGE_TYPES.TRADE_CONFIRM]: {
    name: '交易确认',
    description: '交易执行结果确认通知',
    icon: '✅',
    priority: 'high',
    category: 'trading',
  },
  [MESSAGE_TYPES.RISK_WARNING]: {
    name: '风险提醒',
    description: '投资风险和异常情况提醒',
    icon: '⚠️',
    priority: 'high',
    category: 'risk',
  },
  [MESSAGE_TYPES.ACTIVITY_NOTICE]: {
    name: '活动通知',
    description: '平台活动和优惠信息推送',
    icon: '🎉',
    priority: 'low',
    category: 'promotion',
  },
  [MESSAGE_TYPES.SECURITY_ALERT]: {
    name: '安全提醒',
    description: '账户安全相关的重要提醒',
    icon: '🔒',
    priority: 'high',
    category: 'security',
  },
  [MESSAGE_TYPES.SUBSCRIPTION_EXPIRE]: {
    name: '订阅到期',
    description: '付费服务到期前提醒续费',
    icon: '⏰',
    priority: 'medium',
    category: 'subscription',
  },
};

class SubscriptionManager {
  constructor() {
    this.templateIds = TEMPLATE_IDS;
    this.messageTypes = MESSAGE_TYPES;
  }

  /**
   * 请求订阅消息授权
   * @param {string|Array} messageType - 消息类型或类型数组
   * @returns {Promise<Object>} 授权结果
   */
  async requestSubscription(messageType) {
    try {
      // 确保messageType是数组
      const types = Array.isArray(messageType) ? messageType : [messageType];

      // 获取对应的模板ID
      const tmplIds = types
        .map(type => this.getTemplateId(type))
        .filter(id => id);

      if (tmplIds.length === 0) {
        throw new Error('无效的消息类型');
      }

      // 请求订阅消息授权
      const result = await this.requestMessageSubscribe(tmplIds);

      // 保存授权状态
      await this.saveSubscriptionStatus(types, result);

      // 同步到服务器
      await this.syncSubscriptionToServer(types, result);

      return {
        success: true,
        result,
        message: '订阅设置成功',
      };
    } catch (error) {
      console.error('请求订阅消息授权失败', error);
      return {
        success: false,
        error: error.message || '订阅设置失败',
      };
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
        success: res => {
          console.log('订阅消息授权结果', res);
          resolve(res);
        },
        fail: err => {
          console.error('订阅消息授权失败', err);
          reject(err);
        },
      });
    });
  }

  /**
   * 获取模板ID
   * @param {string} messageType - 消息类型
   * @returns {string} 模板ID
   */
  getTemplateId(messageType) {
    const templateMap = {
      [MESSAGE_TYPES.PRICE_ALERT]: TEMPLATE_IDS.PRICE_ALERT,
      [MESSAGE_TYPES.AI_REPORT]: TEMPLATE_IDS.AI_REPORT,
      [MESSAGE_TYPES.MARKET_NEWS]: TEMPLATE_IDS.MARKET_NEWS,
      [MESSAGE_TYPES.ASSET_CHANGE]: TEMPLATE_IDS.ASSET_CHANGE,
      [MESSAGE_TYPES.SYSTEM_MAINTENANCE]: TEMPLATE_IDS.SYSTEM_MAINTENANCE,
      [MESSAGE_TYPES.TRADE_CONFIRM]: TEMPLATE_IDS.TRADE_CONFIRM,
      [MESSAGE_TYPES.RISK_WARNING]: TEMPLATE_IDS.RISK_WARNING,
      [MESSAGE_TYPES.ACTIVITY_NOTICE]: TEMPLATE_IDS.ACTIVITY_NOTICE,
      [MESSAGE_TYPES.SECURITY_ALERT]: TEMPLATE_IDS.SECURITY_ALERT,
      [MESSAGE_TYPES.SUBSCRIPTION_EXPIRE]: TEMPLATE_IDS.SUBSCRIPTION_EXPIRE,
    };
    return templateMap[messageType] || null;
  }

  /**
   * 获取消息类型配置
   * @param {string} messageType - 消息类型
   * @returns {Object} 消息配置
   */
  getMessageConfig(messageType) {
    return (
      MESSAGE_CONFIG[messageType] || {
        name: '未知消息',
        description: '未知消息类型',
        icon: '📱',
        priority: 'low',
        category: 'other',
      }
    );
  }

  /**
   * 获取所有消息类型配置
   * @returns {Object} 所有消息配置
   */
  getAllMessageConfigs() {
    return MESSAGE_CONFIG;
  }

  /**
   * 根据分类获取消息类型
   * @param {string} category - 分类
   * @returns {Array} 消息类型数组
   */
  getMessageTypesByCategory(category) {
    return Object.keys(MESSAGE_CONFIG).filter(
      type => MESSAGE_CONFIG[type].category === category
    );
  }

  /**
   * 根据优先级获取消息类型
   * @param {string} priority - 优先级
   * @returns {Array} 消息类型数组
   */
  getMessageTypesByPriority(priority) {
    return Object.keys(MESSAGE_CONFIG).filter(
      type => MESSAGE_CONFIG[type].priority === priority
    );
  }

  /**
   * 保存订阅状态到本地
   * @param {Array} types - 消息类型数组
   * @param {Object} result - 授权结果
   */
  async saveSubscriptionStatus(types, result) {
    try {
      const subscriptions = (await storage.get('subscriptions')) || {};

      types.forEach(type => {
        const templateId = this.getTemplateId(type);
        if (templateId && result[templateId]) {
          subscriptions[type] = {
            status: result[templateId],
            updateTime: Date.now(),
            templateId,
          };
        }
      });

      await storage.set('subscriptions', subscriptions);
    } catch (error) {
      console.error('保存订阅状态失败', error);
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
        const templateId = this.getTemplateId(type);
        return {
          type,
          templateId,
          status: result[templateId] || 'reject',
          updateTime: Date.now(),
        };
      });

      await api.subscription.updateSubscription(subscriptionData);
    } catch (error) {
      console.error('同步订阅状态到服务器失败', error);
    }
  }

  /**
   * 获取本地订阅状态
   * @param {string} messageType - 消息类型
   * @returns {Promise<Object>} 订阅状态
   */
  async getSubscriptionStatus(messageType) {
    try {
      const subscriptions = (await storage.get('subscriptions')) || {};
      return subscriptions[messageType] || { status: 'unknown' };
    } catch (error) {
      console.error('获取订阅状态失败', error);
      return { status: 'unknown' };
    }
  }

  /**
   * 检查是否已订阅
   * @param {string} messageType - 消息类型
   * @returns {Promise<boolean>} 是否已订阅
   */
  async isSubscribed(messageType) {
    const status = await this.getSubscriptionStatus(messageType);
    return status.status === 'accept';
  }

  /**
   * 创建价格提醒订阅
   * @param {Object} alertData - 提醒数据
   * @returns {Promise<Object>} 创建结果
   */
  async createPriceAlert(alertData) {
    try {
      // 检查是否已订阅价格提醒
      const isSubscribed = await this.isSubscribed(MESSAGE_TYPES.PRICE_ALERT);

      if (!isSubscribed) {
        // 请求订阅授权
        const subscribeResult = await this.requestSubscription(
          MESSAGE_TYPES.PRICE_ALERT
        );
        if (!subscribeResult.success) {
          return subscribeResult;
        }

        // 检查用户是否同意授权
        const templateId = this.getTemplateId(MESSAGE_TYPES.PRICE_ALERT);
        if (subscribeResult.result[templateId] !== 'accept') {
          return {
            success: false,
            error: '需要授权订阅消息才能设置价格提醒',
          };
        }
      }

      // 创建价格提醒
      const result = await api.subscription.createPriceAlert(alertData);

      return {
        success: true,
        data: result,
        message: '价格提醒设置成功',
      };
    } catch (error) {
      console.error('创建价格提醒失败', error);
      return {
        success: false,
        error: error.message || '设置价格提醒失败',
      };
    }
  }

  /**
   * 订阅AI报告通知
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeAIReport(options = {}) {
    return await this.subscribeMessage(MESSAGE_TYPES.AI_REPORT, {
      url: '/api/subscription/ai-report',
      ...options,
    });
  }

  /**
   * 订阅市场动态通知
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeMarketNews(options = {}) {
    return await this.subscribeMessage(MESSAGE_TYPES.MARKET_NEWS, {
      url: '/api/subscription/market-news',
      ...options,
    });
  }

  /**
   * 订阅资产变动提醒
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeAssetChange(options = {}) {
    return await this.subscribeMessage(MESSAGE_TYPES.ASSET_CHANGE, {
      url: '/api/subscription/asset-change',
      ...options,
    });
  }

  /**
   * 订阅交易确认通知
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeTradeConfirm(options = {}) {
    return await this.subscribeMessage(MESSAGE_TYPES.TRADE_CONFIRM, {
      url: '/api/subscription/trade-confirm',
      ...options,
    });
  }

  /**
   * 订阅风险提醒
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeRiskWarning(options = {}) {
    return await this.subscribeMessage(MESSAGE_TYPES.RISK_WARNING, {
      url: '/api/subscription/risk-warning',
      ...options,
    });
  }

  /**
   * 订阅安全提醒
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeSecurityAlert(options = {}) {
    return await this.subscribeMessage(MESSAGE_TYPES.SECURITY_ALERT, {
      url: '/api/subscription/security-alert',
      ...options,
    });
  }

  /**
   * 通用订阅消息方法
   * @param {string} messageType - 消息类型
   * @param {Object} options - 订阅选项
   * @returns {Promise<boolean>} 订阅结果
   */
  async subscribeMessage(messageType, options = {}) {
    try {
      const config = this.getMessageConfig(messageType);

      // 检查是否已订阅
      const isSubscribed = await this.isSubscribed(messageType);
      if (isSubscribed) {
        wx.showToast({
          title: `已订阅${config.name}`,
          icon: 'success',
        });
        return true;
      }

      // 请求订阅授权
      const authorized = await this.requestSubscription([messageType]);
      if (!authorized) {
        return false;
      }

      // 调用后端API保存订阅
      const result = await request({
        url:
          options.url || `/api/subscription/${messageType.replace('_', '-')}`,
        method: 'POST',
        data: {
          templateId: this.getTemplateId(messageType),
          messageType,
          ...options,
        },
      });

      if (result.success) {
        // 保存本地订阅状态
        await this.saveSubscriptionStatus(messageType, true);
        wx.showToast({
          title: `${config.name}订阅成功`,
          icon: 'success',
        });
        return true;
      } else {
        wx.showToast({
          title: result.message || '订阅失败',
          icon: 'error',
        });
        return false;
      }
    } catch (error) {
      const config = this.getMessageConfig(messageType);
      console.error(`订阅${config.name}失败:`, error);
      wx.showToast({
        title: '订阅失败，请重试',
        icon: 'error',
      });
      return false;
    }
  }

  /**
   * 批量订阅消息
   * @param {Array} messageTypes - 消息类型数组
   * @returns {Promise<Object>} 订阅结果
   */
  async batchSubscribe(messageTypes) {
    try {
      const result = await this.requestSubscription(messageTypes);
      return result;
    } catch (error) {
      console.error('批量订阅消息失败', error);
      return {
        success: false,
        error: error.message || '批量订阅失败',
      };
    }
  }

  /**
   * 获取所有订阅状态
   * @returns {Promise<Object>} 所有订阅状态
   */
  async getAllSubscriptionStatus() {
    try {
      const subscriptions = (await storage.get('subscriptions')) || {};
      return subscriptions;
    } catch (error) {
      console.error('获取所有订阅状态失败', error);
      return {};
    }
  }

  /**
   * 清除订阅状态
   * @param {string} messageType - 消息类型（可选）
   */
  async clearSubscriptionStatus(messageType) {
    try {
      if (messageType) {
        const subscriptions = (await storage.get('subscriptions')) || {};
        delete subscriptions[messageType];
        await storage.set('subscriptions', subscriptions);
      } else {
        await storage.remove('subscriptions');
      }
    } catch (error) {
      console.error('清除订阅状态失败', error);
    }
  }

  /**
   * 显示订阅引导弹窗
   * @param {Array} messageTypes - 消息类型数组
   * @param {Object} options - 显示选项
   * @returns {Promise<boolean>} 用户是否同意订阅
   */
  async showSubscriptionGuide(messageTypes = [], options = {}) {
    const {
      title = '订阅消息通知',
      showDetails = false,
      category = null,
    } = options;

    // 如果指定了分类，获取该分类下的消息类型
    if (category && messageTypes.length === 0) {
      messageTypes = this.getMessageTypesByCategory(category);
    }

    // 如果没有指定消息类型，显示所有高优先级消息
    if (messageTypes.length === 0) {
      messageTypes = this.getMessageTypesByPriority('high');
    }

    let content = '开启消息通知，及时获取重要信息推送';

    // 如果需要显示详情，构建详细内容
    if (showDetails && messageTypes.length > 0) {
      const configs = messageTypes.map(type => this.getMessageConfig(type));
      content = '将为您推送以下类型的消息：\n\n';
      configs.forEach(config => {
        content += `${config.icon} ${config.name}\n${config.description}\n\n`;
      });
      content += '您可以随时在设置中管理订阅状态';
    }

    return new Promise(resolve => {
      wx.showModal({
        title,
        content,
        confirmText: '立即订阅',
        cancelText: '暂不订阅',
        success: res => {
          if (res.confirm) {
            // 用户同意订阅
            this.requestSubscription(messageTypes)
              .then(result => {
                resolve(result.success);
              })
              .catch(() => {
                resolve(false);
              });
          } else {
            // 用户取消订阅
            resolve(false);
          }
        },
        fail: () => {
          resolve(false);
        },
      });
    });
  }

  /**
   * 显示订阅管理页面
   * @returns {Promise<void>}
   */
  async showSubscriptionManager() {
    try {
      // 获取所有订阅状态
      const allStatus = await this.getAllSubscriptionStatus();
      const configs = this.getAllMessageConfigs();

      // 构建管理页面数据
      const subscriptionList = Object.keys(configs).map(messageType => ({
        messageType,
        config: configs[messageType],
        isSubscribed: allStatus[messageType] || false,
      }));

      // 按分类分组
      const groupedSubscriptions = {};
      subscriptionList.forEach(item => {
        const category = item.config.category;
        if (!groupedSubscriptions[category]) {
          groupedSubscriptions[category] = [];
        }
        groupedSubscriptions[category].push(item);
      });

      // 导航到订阅管理页面
      wx.navigateTo({
        url: `/pages/subscription/manager?data=${encodeURIComponent(JSON.stringify(groupedSubscriptions))}`,
      });
    } catch (error) {
      console.error('显示订阅管理页面失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'error',
      });
    }
  }

  /**
   * 批量更新订阅状态
   * @param {Object} subscriptions - 订阅状态对象 {messageType: boolean}
   * @returns {Promise<boolean>} 更新结果
   */
  async batchUpdateSubscriptions(subscriptions) {
    try {
      const updates = [];

      for (const [messageType, shouldSubscribe] of Object.entries(
        subscriptions
      )) {
        const currentStatus = await this.isSubscribed(messageType);

        if (currentStatus !== shouldSubscribe) {
          if (shouldSubscribe) {
            // 需要订阅
            updates.push({
              action: 'subscribe',
              messageType,
              templateId: this.getTemplateId(messageType),
            });
          } else {
            // 需要取消订阅
            updates.push({
              action: 'unsubscribe',
              messageType,
            });
          }
        }
      }

      if (updates.length === 0) {
        wx.showToast({
          title: '没有需要更新的订阅',
          icon: 'success',
        });
        return true;
      }

      // 对于需要订阅的消息，先请求授权
      const subscribeTypes = updates
        .filter(update => update.action === 'subscribe')
        .map(update => update.messageType);

      if (subscribeTypes.length > 0) {
        const authorized = await this.requestSubscription(subscribeTypes);
        if (!authorized) {
          return false;
        }
      }

      // 调用后端API批量更新
      const result = await request({
        url: '/api/subscription/batch-update',
        method: 'POST',
        data: { updates },
      });

      if (result.success) {
        // 更新本地状态
        for (const [messageType, shouldSubscribe] of Object.entries(
          subscriptions
        )) {
          await this.saveSubscriptionStatus(messageType, shouldSubscribe);
        }

        wx.showToast({
          title: '订阅设置已更新',
          icon: 'success',
        });
        return true;
      } else {
        wx.showToast({
          title: result.message || '更新失败',
          icon: 'error',
        });
        return false;
      }
    } catch (error) {
      console.error('批量更新订阅失败:', error);
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'error',
      });
      return false;
    }
  }
}

// 创建单例实例
const subscriptionManager = new SubscriptionManager();

module.exports = {
  subscriptionManager,
  MESSAGE_TYPES,
  MESSAGE_CONFIG,
  TEMPLATE_IDS,
};
