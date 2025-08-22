import { subscriptionManager, MESSAGE_CONFIG } from '../../utils/subscription';

// 分类名称映射
const CATEGORY_NAMES = {
  trading: '交易相关',
  analysis: '分析报告',
  market: '市场资讯',
  account: '账户管理',
  system: '系统通知',
  risk: '风险提醒',
  promotion: '活动推广',
  security: '安全提醒',
  subscription: '订阅服务',
};

Page({
  data: {
    categories: [],
    originalSubscriptions: {}, // 原始订阅状态
    currentSubscriptions: {}, // 当前订阅状态
    hasChanges: false,
    loading: false,
    loadingText: '加载中...',
  },

  onLoad(options) {
    // 从参数中获取订阅数据
    if (options.data) {
      try {
        const groupedSubscriptions = JSON.parse(
          decodeURIComponent(options.data)
        );
        this.initializeData(groupedSubscriptions);
      } catch (error) {
        console.error('解析订阅数据失败:', error);
        this.loadSubscriptionData();
      }
    } else {
      this.loadSubscriptionData();
    }
  },

  /**
   * 加载订阅数据
   */
  async loadSubscriptionData() {
    this.setData({ loading: true, loadingText: '加载订阅数据...' });

    try {
      // 获取所有订阅状态
      const allStatus = await subscriptionManager.getAllSubscriptionStatus();
      const configs = subscriptionManager.getAllMessageConfigs();

      // 构建订阅列表
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

      this.initializeData(groupedSubscriptions);
    } catch (error) {
      console.error('加载订阅数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'error',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 初始化数据
   */
  initializeData(groupedSubscriptions) {
    const categories = Object.keys(groupedSubscriptions).map(category => ({
      category,
      name: CATEGORY_NAMES[category] || category,
      subscriptions: groupedSubscriptions[category],
      expanded: true, // 默认展开
    }));

    // 按优先级排序分类
    categories.sort((a, b) => {
      const priorityOrder = {
        trading: 1,
        account: 2,
        security: 3,
        risk: 4,
        analysis: 5,
        market: 6,
        system: 7,
        promotion: 8,
        subscription: 9,
      };
      return (
        (priorityOrder[a.category] || 99) - (priorityOrder[b.category] || 99)
      );
    });

    // 构建订阅状态映射
    const originalSubscriptions = {};
    const currentSubscriptions = {};

    categories.forEach(category => {
      category.subscriptions.forEach(subscription => {
        originalSubscriptions[subscription.messageType] =
          subscription.isSubscribed;
        currentSubscriptions[subscription.messageType] =
          subscription.isSubscribed;
      });
    });

    this.setData({
      categories,
      originalSubscriptions,
      currentSubscriptions,
      hasChanges: false,
    });
  },

  /**
   * 切换分类展开/收起
   */
  toggleCategory(e) {
    const { category } = e.currentTarget.dataset;
    const categories = this.data.categories.map(item => {
      if (item.category === category) {
        return { ...item, expanded: !item.expanded };
      }
      return item;
    });
    this.setData({ categories });
  },

  /**
   * 切换订阅状态
   */
  toggleSubscription(e) {
    const { messageType } = e.currentTarget.dataset;
    const { value } = e.detail;

    const currentSubscriptions = {
      ...this.data.currentSubscriptions,
      [messageType]: value,
    };

    // 更新分类数据
    const categories = this.data.categories.map(category => ({
      ...category,
      subscriptions: category.subscriptions.map(subscription => {
        if (subscription.messageType === messageType) {
          return { ...subscription, isSubscribed: value };
        }
        return subscription;
      }),
    }));

    // 检查是否有变更
    const hasChanges = this.checkForChanges(currentSubscriptions);

    this.setData({
      categories,
      currentSubscriptions,
      hasChanges,
    });
  },

  /**
   * 检查是否有变更
   */
  checkForChanges(currentSubscriptions) {
    const { originalSubscriptions } = this.data;
    return Object.keys(currentSubscriptions).some(
      messageType =>
        currentSubscriptions[messageType] !== originalSubscriptions[messageType]
    );
  },

  /**
   * 全部订阅
   */
  async subscribeAll() {
    const currentSubscriptions = { ...this.data.currentSubscriptions };
    Object.keys(currentSubscriptions).forEach(messageType => {
      currentSubscriptions[messageType] = true;
    });

    this.updateAllSubscriptions(currentSubscriptions);
  },

  /**
   * 全部取消
   */
  async unsubscribeAll() {
    const currentSubscriptions = { ...this.data.currentSubscriptions };
    Object.keys(currentSubscriptions).forEach(messageType => {
      currentSubscriptions[messageType] = false;
    });

    this.updateAllSubscriptions(currentSubscriptions);
  },

  /**
   * 仅订阅高优先级
   */
  async subscribeHighPriority() {
    const currentSubscriptions = { ...this.data.currentSubscriptions };

    this.data.categories.forEach(category => {
      category.subscriptions.forEach(subscription => {
        currentSubscriptions[subscription.messageType] =
          subscription.config.priority === 'high';
      });
    });

    this.updateAllSubscriptions(currentSubscriptions);
  },

  /**
   * 更新所有订阅状态
   */
  updateAllSubscriptions(currentSubscriptions) {
    // 更新分类数据
    const categories = this.data.categories.map(category => ({
      ...category,
      subscriptions: category.subscriptions.map(subscription => ({
        ...subscription,
        isSubscribed: currentSubscriptions[subscription.messageType],
      })),
    }));

    // 检查是否有变更
    const hasChanges = this.checkForChanges(currentSubscriptions);

    this.setData({
      categories,
      currentSubscriptions,
      hasChanges,
    });
  },

  /**
   * 保存更改
   */
  async saveChanges() {
    if (!this.data.hasChanges) {
      return;
    }

    this.setData({ loading: true, loadingText: '保存中...' });

    try {
      const success = await subscriptionManager.batchUpdateSubscriptions(
        this.data.currentSubscriptions
      );

      if (success) {
        // 更新原始状态
        this.setData({
          originalSubscriptions: { ...this.data.currentSubscriptions },
          hasChanges: false,
        });

        wx.showToast({
          title: '保存成功',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('保存订阅设置失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 页面卸载时提醒保存
   */
  onUnload() {
    if (this.data.hasChanges) {
      wx.showModal({
        title: '提示',
        content: '您有未保存的更改，确定要离开吗？',
        success: res => {
          if (!res.confirm) {
            // 阻止页面卸载（实际上无法阻止，只是提醒用户）
            return false;
          }
        },
      });
    }
  },
});
