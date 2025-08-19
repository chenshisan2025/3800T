// pages/login/login.js
const { auth } = require('../../utils/auth')
const { api } = require('../../services/api')

Page({
  data: {
    // 登录方式：phone | wechat
    loginType: 'phone',
    
    // 手机号登录相关
    phoneNumber: '',
    verifyCode: '',
    countdown: 0,
    canSendCode: true,
    
    // 微信登录相关
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    
    // 登录状态
    isLogging: false,
    
    // 协议同意状态
    agreeProtocol: false
  },
  
  onLoad(options) {
    // 检查是否已登录
    if (auth.checkLoginStatus()) {
      this.redirectToTarget()
      return
    }
    
    // 获取跳转目标页面
    this.targetUrl = options.redirect || '/pages/index/index'
    
    // 初始化页面
    this.initPage()
  },
  
  // 初始化页面
  initPage() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '登录'
    })
  },
  
  // 切换登录方式
  switchLoginType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      loginType: type,
      phoneNumber: '',
      verifyCode: '',
      countdown: 0,
      canSendCode: true
    })
  },
  
  // 手机号输入
  onPhoneInput(e) {
    this.setData({
      phoneNumber: e.detail.value
    })
  },
  
  // 验证码输入
  onCodeInput(e) {
    this.setData({
      verifyCode: e.detail.value
    })
  },
  
  // 发送验证码
  async sendVerifyCode() {
    const { phoneNumber, canSendCode } = this.data
    
    if (!canSendCode) {
      return
    }
    
    // 验证手机号格式
    if (!this.validatePhone(phoneNumber)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }
    
    try {
      // 调用发送验证码接口
      await api.auth.sendVerifyCode(phoneNumber)
      
      // 开始倒计时
      this.startCountdown()
      
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })
    } catch (error) {
      console.error('发送验证码失败', error)
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      })
    }
  },
  
  // 开始倒计时
  startCountdown() {
    let countdown = 60
    this.setData({
      countdown,
      canSendCode: false
    })
    
    const timer = setInterval(() => {
      countdown--
      this.setData({
        countdown
      })
      
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          canSendCode: true,
          countdown: 0
        })
      }
    }, 1000)
  },
  
  // 手机号登录
  async phoneLogin() {
    const { phoneNumber, verifyCode, agreeProtocol } = this.data
    
    // 验证输入
    if (!this.validatePhoneLogin()) {
      return
    }
    
    // 检查协议同意状态
    if (!agreeProtocol) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      })
      return
    }
    
    this.setData({ isLogging: true })
    
    try {
      // 调用登录接口
      const result = await auth.phoneLogin(phoneNumber, verifyCode)
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 延迟跳转
        setTimeout(() => {
          this.redirectToTarget()
        }, 1500)
      } else {
        wx.showToast({
          title: result.error || '登录失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('手机号登录失败', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLogging: false })
    }
  },
  
  // 微信登录
  async wechatLogin() {
    const { agreeProtocol } = this.data
    
    // 检查协议同意状态
    if (!agreeProtocol) {
      wx.showToast({
        title: '请先同意用户协议',
        icon: 'none'
      })
      return
    }
    
    this.setData({ isLogging: true })
    
    try {
      // 获取用户信息授权
      let userInfo = null
      
      if (this.data.canIUseGetUserProfile) {
        // 使用新的授权方式
        const userProfile = await this.getUserProfile()
        userInfo = userProfile.userInfo
      } else {
        // 使用旧的授权方式
        userInfo = await this.getUserInfo()
      }
      
      // 调用微信登录
      const result = await auth.wxLogin()
      
      if (result.success) {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 延迟跳转
        setTimeout(() => {
          this.redirectToTarget()
        }, 1500)
      } else {
        wx.showToast({
          title: result.error || '登录失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('微信登录失败', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLogging: false })
    }
  },
  
  // 获取用户信息（新版本）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      })
    })
  },
  
  // 获取用户信息（旧版本）
  getUserInfo() {
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success: (res) => resolve(res.userInfo),
        fail: reject
      })
    })
  },
  
  // 同意协议
  toggleProtocol() {
    this.setData({
      agreeProtocol: !this.data.agreeProtocol
    })
  },
  
  // 查看用户协议
  viewProtocol() {
    wx.navigateTo({
      url: '/pages/protocol/protocol?type=user'
    })
  },
  
  // 查看隐私政策
  viewPrivacy() {
    wx.navigateTo({
      url: '/pages/protocol/protocol?type=privacy'
    })
  },
  
  // 验证手机号格式
  validatePhone(phone) {
    const phoneReg = /^1[3-9]\d{9}$/
    return phoneReg.test(phone)
  },
  
  // 验证手机号登录输入
  validatePhoneLogin() {
    const { phoneNumber, verifyCode } = this.data
    
    if (!phoneNumber) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return false
    }
    
    if (!this.validatePhone(phoneNumber)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return false
    }
    
    if (!verifyCode) {
      wx.showToast({
        title: '请输入验证码',
        icon: 'none'
      })
      return false
    }
    
    if (verifyCode.length !== 6) {
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      })
      return false
    }
    
    return true
  },
  
  // 跳转到目标页面
  redirectToTarget() {
    const url = this.targetUrl || '/pages/index/index'
    
    if (url.startsWith('/pages/')) {
      // 检查是否是 tabBar 页面
      const tabBarPages = [
        '/pages/index/index',
        '/pages/market/market',
        '/pages/asset/asset',
        '/pages/ai/ai',
        '/pages/me/me'
      ]
      
      if (tabBarPages.includes(url)) {
        wx.switchTab({ url })
      } else {
        wx.redirectTo({ url })
      }
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },
  
  // 返回上一页
  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  }
})