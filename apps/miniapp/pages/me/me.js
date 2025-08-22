// pages/me/me.js
const app = getApp();
const { getUserSubscription, featureGate } = require('../../utils/featureGate');

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    subscription: null,
    menuItems: [
      {
        id: 'membership',
        title: '会员中心',
        icon: '👑',
        desc: '查看套餐和升级Pro',
        arrow: true,
      },
      {
        id: 'subscription',
        title: '订阅消息',
        icon: '🔔',
        desc: '价格提醒、AI报告通知',
        arrow: true,
      },
      {
        id: 'watchlist',
        title: '我的自选',
        icon: '⭐',
        desc: '管理关注的股票',
        arrow: true,
      },
      {
        id: 'history',
        title: '分析历史',
        icon: '📊',
        desc: '查看AI分析记录',
        arrow: true,
      },
      {
        id: 'settings',
        title: '设置',
        icon: '⚙️',
        desc: '个人偏好设置',
        arrow: true,
      },
      {
        id: 'help',
        title: '帮助中心',
        icon: '❓',
        desc: '使用指南和常见问题',
        arrow: true,
      },
      {
        id: 'about',
        title: '关于我们',
        icon: 'ℹ️',
        desc: '版本信息和联系方式',
        arrow: true,
      },
    ],
    appVersion: '1.0.0',
  },

  onLoad: function (options) {
    console.log('我的页面加载');
    this.checkLoginStatus();
    this.loadSubscriptionInfo();
  },

  onShow: function () {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
    this.loadSubscriptionInfo();
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');

    if (userInfo && token) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true,
      });
    } else {
      this.setData({
        userInfo: null,
        isLoggedIn: false,
      });
    }
  },

  // 点击登录
  onLoginTap: function () {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  // 点击头像
  onAvatarTap: function () {
    if (this.data.isLoggedIn) {
      // 已登录，显示用户信息
      wx.showModal({
        title: '用户信息',
        content: `昵称：${this.data.userInfo.nickName || '未设置'}\n手机：${this.data.userInfo.phone || '未绑定'}`,
        showCancel: false,
      });
    } else {
      // 未登录，跳转登录页
      this.onLoginTap();
    }
  },

  // 点击菜单项
  onMenuItemTap: function (e) {
    const itemId = e.currentTarget.dataset.id;

    switch (itemId) {
      case 'membership':
        this.handleMembership();
        break;
      case 'subscription':
        this.handleSubscription();
        break;
      case 'watchlist':
        wx.switchTab({
          url: '/pages/watchlist/watchlist',
        });
        break;
      case 'history':
        this.showComingSoon('分析历史');
        break;
      case 'settings':
        this.showComingSoon('设置');
        break;
      case 'help':
        this.showComingSoon('帮助中心');
        break;
      case 'about':
        this.showAbout();
        break;
      default:
        break;
    }
  },

  // 处理订阅消息
  handleSubscription: function () {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再设置订阅消息',
        confirmText: '去登录',
        success: res => {
          if (res.confirm) {
            this.onLoginTap();
          }
        },
      });
      return;
    }

    // 请求订阅消息权限
    wx.requestSubscribeMessage({
      tmplIds: ['price_alert_template', 'ai_report_template'], // 模板ID占位
      success: res => {
        console.log('订阅消息授权结果:', res);
        let successCount = 0;
        let messages = [];

        if (res['price_alert_template'] === 'accept') {
          successCount++;
          messages.push('价格提醒');
        }

        if (res['ai_report_template'] === 'accept') {
          successCount++;
          messages.push('AI报告');
        }

        if (successCount > 0) {
          wx.showToast({
            title: `已开启${messages.join('、')}通知`,
            icon: 'success',
          });
        } else {
          wx.showToast({
            title: '未开启任何通知',
            icon: 'none',
          });
        }
      },
      fail: err => {
        console.error('订阅消息请求失败:', err);
        wx.showToast({
          title: '订阅失败，请重试',
          icon: 'none',
        });
      },
    });
  },

  // 显示即将推出
  showComingSoon: function (feature) {
    wx.showModal({
      title: '即将推出',
      content: `${feature}功能正在开发中，敬请期待！`,
      showCancel: false,
    });
  },

  // 显示关于信息
  showAbout: function () {
    wx.showModal({
      title: '关于古灵通',
      content: `版本：${this.data.appVersion}\n\n古灵通是一款专业的股票分析工具，提供实时行情、AI智能分析等功能。\n\n如有问题请联系客服。`,
      showCancel: false,
    });
  },

  // 退出登录
  onLogoutTap: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');

          // 清除功能门控缓存
          featureGate.clearCache();

          // 更新页面状态
          this.setData({
            userInfo: null,
            isLoggedIn: false,
            subscription: null,
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success',
          });
        }
      },
    });
  },

  // 加载订阅信息
  async loadSubscriptionInfo() {
    try {
      const subscription = await getUserSubscription();
      this.setData({ subscription });
    } catch (error) {
      console.error('加载订阅信息失败:', error);
    }
  },

  // 处理会员中心
  handleMembership: function () {
    wx.navigateTo({
      url: '/pages/upgrade/upgrade',
    });
  },
});
