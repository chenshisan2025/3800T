// pages/upgrade/upgrade.js
const { featureGate } = require('../../utils/featureGate');
const { request } = require('../../utils/request');

Page({
  data: {
    pricingInfo: null,
    currentPlan: 'free',
    loading: true,
    selectedPlan: 'pro',
  },

  onLoad: function (options) {
    this.loadPricingInfo();
    this.loadUserInfo();
  },

  // 加载套餐信息
  async loadPricingInfo() {
    try {
      wx.showLoading({ title: '加载中...' });
      const pricingInfo = await featureGate.getPricingInfo();

      this.setData({
        pricingInfo: pricingInfo,
        loading: false,
      });
    } catch (error) {
      console.error('加载套餐信息失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const subscription = await featureGate.getUserSubscription();
      this.setData({
        currentPlan: subscription.plan,
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 选择套餐
  onPlanSelect: function (e) {
    const plan = e.currentTarget.dataset.plan;
    this.setData({
      selectedPlan: plan,
    });
  },

  // 立即升级
  onUpgrade: function () {
    if (this.data.selectedPlan === this.data.currentPlan) {
      wx.showToast({
        title: '您已是该套餐用户',
        icon: 'none',
      });
      return;
    }

    if (this.data.selectedPlan === 'free') {
      wx.showToast({
        title: '无需降级',
        icon: 'none',
      });
      return;
    }

    // 模拟升级流程
    wx.showModal({
      title: '确认升级',
      content: `确定要升级到${this.data.selectedPlan.toUpperCase()}套餐吗？`,
      success: res => {
        if (res.confirm) {
          this.processUpgrade();
        }
      },
    });
  },

  // 处理升级
  async processUpgrade() {
    try {
      wx.showLoading({ title: '升级中...' });

      // 模拟升级API调用
      await new Promise(resolve => setTimeout(resolve, 2000));

      wx.hideLoading();
      wx.showToast({
        title: '升级成功！',
        icon: 'success',
      });

      // 清除缓存，重新加载用户信息
      featureGate.clearCache();
      this.loadUserInfo();

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '升级失败',
        icon: 'error',
      });
      console.error('升级失败:', error);
    }
  },

  // 查看功能对比
  onCompareFeatures: function () {
    wx.navigateTo({
      url: '/pages/features/features',
    });
  },

  // 联系客服
  onContactService: function () {
    wx.showModal({
      title: '联系客服',
      content: '如有疑问，请添加客服微信：gulingtong-service',
      showCancel: false,
    });
  },

  // 分享页面
  onShareAppMessage: function () {
    return {
      title: '股灵通Pro会员 - 专业投资分析工具',
      path: '/pages/upgrade/upgrade',
    };
  },
});
