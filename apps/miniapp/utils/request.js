// utils/request.js
const app = getApp()
const { cache, CacheStrategies } = require('../services/cache')

// 请求配置
const config = {
  baseUrl: 'https://api.gulingtong.com',
  timeout: 10000,
  header: {
    'Content-Type': 'application/json'
  }
}

// Token 刷新锁
let isRefreshing = false
let refreshSubscribers = []

// 请求拦截器
function requestInterceptor(options) {
  // 添加 token
  const token = app.getToken()
  if (token) {
    options.header = {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
  }
  
  // 添加公共参数
  options.header = {
    ...options.header,
    'X-Client-Version': app.globalData.version || '1.0.0',
    'X-Client-Platform': 'miniapp',
    'X-Request-ID': generateRequestId()
  }
  
  return options
}

// 生成请求ID
function generateRequestId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 响应拦截器
function responseInterceptor(response, options) {
  const { statusCode, data } = response
  
  // HTTP 状态码检查
  if (statusCode >= 200 && statusCode < 300) {
    // 业务状态码检查
    if (data.code === 0 || data.success) {
      return Promise.resolve(data.data || data)
    } else {
      // 业务错误
      const error = new Error(data.message || '请求失败')
      error.code = data.code
      error.data = data
      
      // 特殊错误处理
      if (data.code === 401 || data.code === 403) {
        // token 过期或无权限
        handleAuthError()
      }
      
      return Promise.reject(error)
    }
  } else {
    // HTTP 错误
    const error = new Error(getHttpErrorMessage(statusCode))
    error.statusCode = statusCode
    error.data = data
    
    return Promise.reject(error)
  }
}

// 获取 HTTP 错误信息
function getHttpErrorMessage(statusCode) {
  const messages = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '拒绝访问',
    404: '请求的资源不存在',
    405: '请求方法不允许',
    408: '请求超时',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  }
  
  return messages[statusCode] || `请求失败 (${statusCode})`
}

// 处理认证错误
function handleAuthError() {
  if (isRefreshing) {
    // 如果正在刷新token，将请求加入队列
    return new Promise((resolve) => {
      refreshSubscribers.push(() => {
        resolve()
      })
    })
  }
  
  isRefreshing = true
  
  // 尝试刷新token
  return refreshToken()
    .then((newToken) => {
      if (newToken) {
        // 刷新成功，执行队列中的请求
        refreshSubscribers.forEach(callback => callback())
        refreshSubscribers = []
        return Promise.resolve()
      } else {
        // 刷新失败，清除登录信息并跳转
        app.clearUserInfo()
        
        wx.showModal({
          title: '提示',
          content: '登录已过期，请重新登录',
          showCancel: false,
          success: () => {
            wx.switchTab({
              url: '/pages/me/me'
            })
          }
        })
        
        return Promise.reject(new Error('登录已过期'))
      }
    })
    .finally(() => {
      isRefreshing = false
    })
}

// 刷新Token
function refreshToken() {
  const { storage } = require('./storage')
  const refreshToken = storage.get('refreshToken')
  
  if (!refreshToken) {
    return Promise.resolve(null)
  }
  
  return new Promise((resolve) => {
    wx.request({
      url: config.baseUrl + '/api/auth/refresh-token',
      method: 'POST',
      data: { refreshToken },
      header: config.header,
      success: (response) => {
        if (response.statusCode === 200 && response.data.success) {
          const { token, refreshToken: newRefreshToken } = response.data.data
          
          // 更新token
          app.globalData.token = token
          storage.set('token', token)
          
          if (newRefreshToken) {
            storage.set('refreshToken', newRefreshToken)
          }
          
          resolve(token)
        } else {
          resolve(null)
        }
      },
      fail: () => {
        resolve(null)
      }
    })
  })
}

// 基础请求方法
function request(options) {
  return new Promise((resolve, reject) => {
    // 请求拦截
    const requestOptions = requestInterceptor({
      url: options.url.startsWith('http') ? options.url : config.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        ...config.header,
        ...options.header
      },
      timeout: options.timeout || config.timeout
    })
    
    // 显示加载提示
    if (options.loading !== false) {
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      })
    }
    
    wx.request({
      ...requestOptions,
      success: (response) => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading()
        }
        
        // 响应拦截
        responseInterceptor(response, requestOptions)
          .then(resolve)
          .catch(reject)
      },
      fail: (error) => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading()
        }
        
        // 网络错误
        const networkError = new Error('网络连接失败，请检查网络设置')
        networkError.type = 'network'
        networkError.original = error
        
        // 显示错误提示
        if (options.showError !== false) {
          wx.showToast({
            title: networkError.message,
            icon: 'none',
            duration: 2000
          })
        }
        
        reject(networkError)
      }
    })
  })
}

// GET 请求
function get(url, params = {}, options = {}) {
  const query = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&')
  
  const fullUrl = query ? `${url}?${query}` : url
  
  // 检查缓存
  if (options.cache) {
    const cacheKey = options.cacheKey || `${fullUrl}_${JSON.stringify(params)}`
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log(`缓存命中: ${cacheKey}`)
      return Promise.resolve(cachedData)
    }
    
    // 缓存未命中，发起请求并缓存结果
    return request({
      url: fullUrl,
      method: 'GET',
      ...options
    }).then(result => {
      const expire = options.cacheExpire || CacheStrategies.MEDIUM
      cache.set(cacheKey, result, expire)
      console.log(`缓存存储: ${cacheKey}`)
      return result
    })
  }
  
  return request({
    url: fullUrl,
    method: 'GET',
    ...options
  })
}

// POST 请求
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

// PUT 请求
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

// DELETE 请求
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

// 上传文件
function upload(url, filePath, options = {}) {
  return new Promise((resolve, reject) => {
    // 添加 token
    const token = app.getToken()
    const header = {
      ...options.header
    }
    
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    
    // 显示上传进度
    if (options.loading !== false) {
      wx.showLoading({
        title: options.loadingText || '上传中...',
        mask: true
      })
    }
    
    const uploadTask = wx.uploadFile({
      url: url.startsWith('http') ? url : config.baseUrl + url,
      filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      header,
      success: (response) => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading()
        }
        
        try {
          const data = JSON.parse(response.data)
          if (data.code === 0 || data.success) {
            resolve(data.data || data)
          } else {
            const error = new Error(data.message || '上传失败')
            error.code = data.code
            error.data = data
            reject(error)
          }
        } catch (error) {
          reject(new Error('响应数据解析失败'))
        }
      },
      fail: (error) => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading()
        }
        
        const uploadError = new Error('上传失败，请检查网络设置')
        uploadError.type = 'upload'
        uploadError.original = error
        
        // 显示错误提示
        if (options.showError !== false) {
          wx.showToast({
            title: uploadError.message,
            icon: 'none',
            duration: 2000
          })
        }
        
        reject(uploadError)
      }
    })
    
    // 监听上传进度
    if (options.onProgress) {
      uploadTask.onProgressUpdate(options.onProgress)
    }
  })
}

// 下载文件
function download(url, options = {}) {
  return new Promise((resolve, reject) => {
    // 添加 token
    const token = app.getToken()
    const header = {
      ...options.header
    }
    
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    
    // 显示下载进度
    if (options.loading !== false) {
      wx.showLoading({
        title: options.loadingText || '下载中...',
        mask: true
      })
    }
    
    const downloadTask = wx.downloadFile({
      url: url.startsWith('http') ? url : config.baseUrl + url,
      header,
      success: (response) => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading()
        }
        
        if (response.statusCode === 200) {
          resolve(response.tempFilePath)
        } else {
          reject(new Error('下载失败'))
        }
      },
      fail: (error) => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading()
        }
        
        const downloadError = new Error('下载失败，请检查网络设置')
        downloadError.type = 'download'
        downloadError.original = error
        
        // 显示错误提示
        if (options.showError !== false) {
          wx.showToast({
            title: downloadError.message,
            icon: 'none',
            duration: 2000
          })
        }
        
        reject(downloadError)
      }
    })
    
    // 监听下载进度
    if (options.onProgress) {
      downloadTask.onProgressUpdate(options.onProgress)
    }
  })
}

// 带缓存的GET请求
function getCached(url, params = {}, cacheOptions = {}) {
  const defaultCacheOptions = {
    cache: true,
    cacheExpire: CacheStrategies.MEDIUM,
    cacheKey: `${url}_${JSON.stringify(params)}`
  }
  
  return get(url, params, {
    ...defaultCacheOptions,
    ...cacheOptions
  })
}

// 清除指定URL的缓存
function clearCache(cacheKey) {
  cache.remove(cacheKey)
}

// 清除所有缓存
function clearAllCache() {
  cache.clear()
}

module.exports = {
  request,
  get,
  getCached,
  post,
  put,
  delete: del,
  upload,
  download,
  clearCache,
  clearAllCache,
  config
}