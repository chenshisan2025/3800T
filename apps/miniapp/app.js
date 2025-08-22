// app.js
const { request } = require('./utils/request');
const { storage } = require('./utils/storage');
const { auth } = require('./utils/auth');

App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://api.gulingtong.com', // API 基础地址
    version: '1.0.0',
  },

  onLaunch(options) {
    console.log('小程序启动', options);

    // 检查更新
    this.checkUpdate();

    // 初始化用户信息
    this.initUserInfo();

    // 获取系统信息
    this.getSystemInfo();
  },

  onShow(options) {
    console.log('小程序显示', options);
  },

  onHide() {
    console.log('小程序隐藏');
  },

  onError(error) {
    console.error('小程序错误', error);
    // 可以在这里上报错误日志
  },

  // 检查小程序更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();

      updateManager.onCheckForUpdate(res => {
        if (res.hasUpdate) {
          console.log('发现新版本');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: res => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          },
        });
      });

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败');
      });
    }
  },

  // 初始化用户信息
  async initUserInfo() {
    try {
      const token = await storage.get('token');
      const userInfo = await storage.get('userInfo');

      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;

        // 验证 token 是否有效
        const isValid = await auth.validateToken(token);
        if (!isValid) {
          await this.clearUserInfo();
        }
      }
    } catch (error) {
      console.error('初始化用户信息失败', error);
    }
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: res => {
        this.globalData.systemInfo = res;
        console.log('系统信息', res);
      },
      fail: error => {
        console.error('获取系统信息失败', error);
      },
    });
  },

  // 设置用户信息
  async setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;

    try {
      await storage.set('userInfo', userInfo);
      await storage.set('token', token);
    } catch (error) {
      console.error('保存用户信息失败', error);
    }
  },

  // 清除用户信息
  async clearUserInfo() {
    this.globalData.userInfo = null;
    this.globalData.token = null;

    try {
      await storage.remove('userInfo');
      await storage.remove('token');
    } catch (error) {
      console.error('清除用户信息失败', error);
    }
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo;
  },

  // 获取 token
  getToken() {
    return this.globalData.token;
  },

  // 检查是否已登录
  isLoggedIn() {
    return !!(this.globalData.token && this.globalData.userInfo);
  },

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true,
    });
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading();
  },

  // 显示消息提示
  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title,
      icon,
      duration,
      mask: true,
    });
  },

  // 显示确认对话框
  showModal(title, content) {
    return new Promise(resolve => {
      wx.showModal({
        title,
        content,
        success: res => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        },
      });
    });
  },

  // 页面跳转
  navigateTo(url, params = {}) {
    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const fullUrl = query ? `${url}?${query}` : url;

    wx.navigateTo({
      url: fullUrl,
      fail: error => {
        console.error('页面跳转失败', error);
      },
    });
  },

  // 页面重定向
  redirectTo(url, params = {}) {
    const query = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const fullUrl = query ? `${url}?${query}` : url;

    wx.redirectTo({
      url: fullUrl,
      fail: error => {
        console.error('页面重定向失败', error);
      },
    });
  },

  // 切换 Tab
  switchTab(url) {
    wx.switchTab({
      url,
      fail: error => {
        console.error('切换 Tab 失败', error);
      },
    });
  },

  // 返回上一页
  navigateBack(delta = 1) {
    wx.navigateBack({
      delta,
      fail: error => {
        console.error('返回上一页失败', error);
      },
    });
  },
});
