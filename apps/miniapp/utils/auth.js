// utils/auth.js
const { request } = require('./request');
const { storage } = require('./storage');

const app = getApp();

// 认证相关工具
const auth = {
  // 微信登录
  async wxLogin() {
    try {
      // 获取微信登录凭证
      const loginRes = await this.getWxLoginCode();

      // 获取用户信息
      const userInfo = await this.getWxUserInfo();

      // 调用后端登录接口
      const loginData = await request({
        url: '/api/auth/wx-login',
        method: 'POST',
        data: {
          code: loginRes.code,
          userInfo: userInfo,
        },
        loadingText: '登录中...',
      });

      // 保存登录信息
      await app.setUserInfo(loginData.user, loginData.token);

      return {
        success: true,
        user: loginData.user,
        token: loginData.token,
      };
    } catch (error) {
      console.error('微信登录失败', error);

      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000,
      });

      return {
        success: false,
        error: error.message || '登录失败',
      };
    }
  },

  // 获取微信登录凭证
  getWxLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          if (res.code) {
            resolve(res);
          } else {
            reject(new Error('获取登录凭证失败'));
          }
        },
        fail: error => {
          reject(new Error('获取登录凭证失败'));
        },
      });
    });
  },

  // 获取微信用户信息
  getWxUserInfo() {
    return new Promise((resolve, reject) => {
      // 检查是否已授权
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已授权，直接获取用户信息
            wx.getUserInfo({
              success: userRes => {
                resolve({
                  nickName: userRes.userInfo.nickName,
                  avatarUrl: userRes.userInfo.avatarUrl,
                  gender: userRes.userInfo.gender,
                  city: userRes.userInfo.city,
                  province: userRes.userInfo.province,
                  country: userRes.userInfo.country,
                });
              },
              fail: error => {
                reject(new Error('获取用户信息失败'));
              },
            });
          } else {
            // 未授权，需要用户授权
            reject(new Error('需要用户授权'));
          }
        },
        fail: error => {
          reject(new Error('检查授权状态失败'));
        },
      });
    });
  },

  // 手机号登录
  async phoneLogin(phoneNumber, verifyCode) {
    try {
      const loginData = await request({
        url: '/api/auth/phone-login',
        method: 'POST',
        data: {
          phoneNumber,
          verifyCode,
        },
        loadingText: '登录中...',
      });

      // 保存登录信息
      await app.setUserInfo(loginData.user, loginData.token);

      return {
        success: true,
        user: loginData.user,
        token: loginData.token,
      };
    } catch (error) {
      console.error('手机号登录失败', error);

      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000,
      });

      return {
        success: false,
        error: error.message || '登录失败',
      };
    }
  },

  // 发送验证码
  async sendVerifyCode(phoneNumber) {
    try {
      await request({
        url: '/api/auth/send-verify-code',
        method: 'POST',
        data: {
          phoneNumber,
        },
        loadingText: '发送中...',
      });

      wx.showToast({
        title: '验证码已发送',
        icon: 'success',
        duration: 2000,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('发送验证码失败', error);

      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none',
        duration: 2000,
      });

      return {
        success: false,
        error: error.message || '发送失败',
      };
    }
  },

  // 退出登录
  async logout() {
    try {
      // 调用后端退出接口
      await request({
        url: '/api/auth/logout',
        method: 'POST',
        loading: false,
      });
    } catch (error) {
      console.error('退出登录接口调用失败', error);
    } finally {
      // 清除本地登录信息
      await app.clearUserInfo();

      wx.showToast({
        title: '已退出登录',
        icon: 'success',
        duration: 1500,
      });

      // 跳转到登录页面或首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }, 1500);
    }
  },

  // 验证 token 是否有效
  async validateToken(token) {
    try {
      await request({
        url: '/api/auth/validate-token',
        method: 'GET',
        header: {
          Authorization: `Bearer ${token}`,
        },
        loading: false,
        showError: false,
      });

      return true;
    } catch (error) {
      console.error('token 验证失败', error);
      return false;
    }
  },

  // 刷新 token
  async refreshToken() {
    try {
      const refreshToken = storage.get('refreshToken');
      if (!refreshToken) {
        throw new Error('没有刷新令牌');
      }

      const tokenData = await request({
        url: '/api/auth/refresh-token',
        method: 'POST',
        data: {
          refreshToken,
        },
        loading: false,
        showError: false,
      });

      // 更新 token
      app.globalData.token = tokenData.token;
      storage.set('token', tokenData.token);

      if (tokenData.refreshToken) {
        storage.set('refreshToken', tokenData.refreshToken);
      }

      return tokenData.token;
    } catch (error) {
      console.error('刷新 token 失败', error);

      // 刷新失败，清除登录信息
      await app.clearUserInfo();

      return null;
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      const userInfo = await request({
        url: '/api/user/profile',
        method: 'GET',
        loading: false,
      });

      // 更新本地用户信息
      app.globalData.userInfo = userInfo;
      storage.set('userInfo', userInfo);

      return userInfo;
    } catch (error) {
      console.error('获取用户信息失败', error);
      return null;
    }
  },

  // 更新用户信息
  async updateUserInfo(userInfo) {
    try {
      const updatedInfo = await request({
        url: '/api/user/profile',
        method: 'PUT',
        data: userInfo,
        loadingText: '更新中...',
      });

      // 更新本地用户信息
      app.globalData.userInfo = updatedInfo;
      storage.set('userInfo', updatedInfo);

      wx.showToast({
        title: '更新成功',
        icon: 'success',
        duration: 2000,
      });

      return {
        success: true,
        userInfo: updatedInfo,
      };
    } catch (error) {
      console.error('更新用户信息失败', error);

      wx.showToast({
        title: error.message || '更新失败',
        icon: 'none',
        duration: 2000,
      });

      return {
        success: false,
        error: error.message || '更新失败',
      };
    }
  },

  // 绑定手机号
  async bindPhone(phoneNumber, verifyCode) {
    try {
      const result = await request({
        url: '/api/user/bind-phone',
        method: 'POST',
        data: {
          phoneNumber,
          verifyCode,
        },
        loadingText: '绑定中...',
      });

      // 更新本地用户信息
      if (result.userInfo) {
        app.globalData.userInfo = result.userInfo;
        storage.set('userInfo', result.userInfo);
      }

      wx.showToast({
        title: '绑定成功',
        icon: 'success',
        duration: 2000,
      });

      return {
        success: true,
        userInfo: result.userInfo,
      };
    } catch (error) {
      console.error('绑定手机号失败', error);

      wx.showToast({
        title: error.message || '绑定失败',
        icon: 'none',
        duration: 2000,
      });

      return {
        success: false,
        error: error.message || '绑定失败',
      };
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = app.getToken();
    const userInfo = app.getUserInfo();

    return !!(token && userInfo);
  },

  // 要求登录
  requireLogin(showModal = true) {
    if (this.checkLoginStatus()) {
      return Promise.resolve(true);
    }

    return new Promise(resolve => {
      if (showModal) {
        wx.showModal({
          title: '提示',
          content: '请先登录后再进行操作',
          confirmText: '去登录',
          cancelText: '取消',
          success: res => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/login/login',
              });
            }
            resolve(false);
          },
          fail: () => {
            resolve(false);
          },
        });
      } else {
        resolve(false);
      }
    });
  },
};

module.exports = {
  auth,
};
