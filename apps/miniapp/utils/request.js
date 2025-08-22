// utils/request.js
const app = getApp();
const { cache, CacheStrategies } = require('./cache');
const { offlineQueue, offlineCache, networkMonitor } = require('./offline');

// 请求配置
const config = {
  baseUrl: 'https://api.gulingtong.com',
  timeout: 10000,
  header: {
    'Content-Type': 'application/json',
  },
  // 重试配置
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 基础延迟时间(ms)
    retryCondition: error => {
      // 网络错误或5xx服务器错误时重试
      return (
        error.type === 'network' ||
        (error.statusCode >= 500 && error.statusCode < 600)
      );
    },
  },
};

// 网络状态管理
const networkStatus = {
  isOnline: true,
  networkType: 'unknown',
  isWeak: false,
  quality: 'good', // good, fair, poor
  latency: 0,
  lastCheck: 0,
};

// 网络质量检测
function checkNetworkQuality() {
  return new Promise(resolve => {
    const startTime = Date.now();

    // 发送一个小的测试请求来检测网络质量
    wx.request({
      url: config.baseUrl + '/ping',
      method: 'GET',
      timeout: 5000,
      success: () => {
        const latency = Date.now() - startTime;
        networkStatus.latency = latency;
        networkStatus.lastCheck = Date.now();

        // 根据延迟判断网络质量
        if (latency < 200) {
          networkStatus.quality = 'good';
          networkStatus.isWeak = false;
        } else if (latency < 1000) {
          networkStatus.quality = 'fair';
          networkStatus.isWeak = true;
        } else {
          networkStatus.quality = 'poor';
          networkStatus.isWeak = true;
        }

        resolve(networkStatus.quality);
      },
      fail: () => {
        networkStatus.quality = 'poor';
        networkStatus.isWeak = true;
        networkStatus.latency = 9999;
        networkStatus.lastCheck = Date.now();
        resolve('poor');
      },
    });
  });
}

// 智能降级策略
function getRequestStrategy(options) {
  const strategy = {
    timeout: config.timeout,
    retries: config.retry.maxRetries,
    cache: false,
    compress: false,
  };

  // 根据网络质量调整策略
  switch (networkStatus.quality) {
    case 'poor':
      strategy.timeout = Math.min(config.timeout * 2, 30000); // 增加超时时间
      strategy.retries = Math.max(config.retry.maxRetries - 1, 1); // 减少重试次数
      strategy.cache = true; // 启用缓存
      strategy.compress = true; // 启用压缩
      break;
    case 'fair':
      strategy.timeout = Math.min(config.timeout * 1.5, 20000);
      strategy.cache = options.method === 'GET'; // GET请求启用缓存
      break;
    case 'good':
    default:
      // 使用默认策略
      break;
  }

  return strategy;
}

// 网络状态变化监听
networkMonitor.addListener((isOnline, networkType) => {
  networkStatus.isOnline = isOnline;
  networkStatus.networkType = networkType;

  console.log('网络状态变化:', { isOnline, networkType });

  if (isOnline) {
    showToast('网络连接已恢复', ToastTypes.SUCCESS);

    // 网络恢复时检测网络质量
    checkNetworkQuality().then(() => {
      console.log('网络质量检测完成:', networkStatus);
    });

    // 网络恢复时处理离线队列
    setTimeout(() => {
      offlineQueue.processQueue();
    }, 1000);
  } else {
    showToast('网络连接已断开', ToastTypes.ERROR);
    networkStatus.quality = 'poor';
    networkStatus.isWeak = true;
  }
});

// 获取网络状态
wx.getNetworkType({
  success: res => {
    networkStatus.networkType = res.networkType;
    networkStatus.isOnline = res.networkType !== 'none';
  },
});

// 请求队列管理
const requestQueue = new Map();
let requestId = 0;

// Toast提示类型
const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
  NETWORK_WEAK: 'network_weak',
  NETWORK_POOR: 'network_poor',
};

// 显示Toast提示
function showToast(message, type = ToastTypes.INFO, duration = 2000) {
  const icons = {
    [ToastTypes.SUCCESS]: 'success',
    [ToastTypes.ERROR]: 'none',
    [ToastTypes.WARNING]: 'none',
    [ToastTypes.INFO]: 'none',
    [ToastTypes.LOADING]: 'loading',
    [ToastTypes.NETWORK_WEAK]: 'none',
    [ToastTypes.NETWORK_POOR]: 'none',
  };

  // 弱网络环境下调整提示时长
  let adjustedDuration = duration;
  if (networkStatus.isWeak) {
    adjustedDuration =
      networkStatus.quality === 'poor' ? duration * 1.5 : duration * 1.2;
  }

  // 网络质量相关的特殊处理
  if (type === ToastTypes.NETWORK_WEAK || type === ToastTypes.NETWORK_POOR) {
    adjustedDuration = 3000; // 网络问题提示显示更长时间
  }

  wx.showToast({
    title: message,
    icon: icons[type] || 'none',
    duration: type === ToastTypes.LOADING ? 0 : adjustedDuration,
    mask: type === ToastTypes.LOADING,
  });
}

// 指数退避重试
function exponentialBackoff(attempt, baseDelay = 1000) {
  return baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
}

// Token 刷新锁
let isRefreshing = false;
let refreshSubscribers = [];

// 请求拦截器
function requestInterceptor(options) {
  // 添加 token
  const token = app.getToken();
  if (token) {
    options.header = {
      ...options.header,
      Authorization: `Bearer ${token}`,
    };
  }

  // 添加公共参数
  options.header = {
    ...options.header,
    'X-Client-Version': app.globalData.version || '1.0.0',
    'X-Client-Platform': 'miniapp',
    'X-Request-ID': generateRequestId(),
  };

  return options;
}

// 生成请求ID
function generateRequestId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 响应拦截器
function responseInterceptor(response, options) {
  const { statusCode, data } = response;

  // HTTP 状态码检查
  if (statusCode >= 200 && statusCode < 300) {
    // 业务状态码检查
    if (data.code === 0 || data.success) {
      return Promise.resolve(data.data || data);
    } else {
      // 业务错误
      const error = new Error(data.message || '请求失败');
      error.code = data.code;
      error.data = data;

      // 特殊错误处理
      if (data.code === 401 || data.code === 403) {
        // token 过期或无权限
        handleAuthError();
      }

      return Promise.reject(error);
    }
  } else {
    // HTTP 错误
    const error = new Error(getHttpErrorMessage(statusCode));
    error.statusCode = statusCode;
    error.data = data;

    return Promise.reject(error);
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
    504: '网关超时',
  };

  return messages[statusCode] || `请求失败 (${statusCode})`;
}

// 处理认证错误
function handleAuthError() {
  if (isRefreshing) {
    // 如果正在刷新token，将请求加入队列
    return new Promise(resolve => {
      refreshSubscribers.push(() => {
        resolve();
      });
    });
  }

  isRefreshing = true;

  // 尝试刷新token
  return refreshToken()
    .then(newToken => {
      if (newToken) {
        // 刷新成功，执行队列中的请求
        refreshSubscribers.forEach(callback => callback());
        refreshSubscribers = [];
        return Promise.resolve();
      } else {
        // 刷新失败，清除登录信息并跳转
        app.clearUserInfo();

        wx.showModal({
          title: '提示',
          content: '登录已过期，请重新登录',
          showCancel: false,
          success: () => {
            wx.switchTab({
              url: '/pages/me/me',
            });
          },
        });

        return Promise.reject(new Error('登录已过期'));
      }
    })
    .finally(() => {
      isRefreshing = false;
    });
}

// 刷新Token
function refreshToken() {
  const { storage } = require('./storage');
  const refreshToken = storage.get('refreshToken');

  if (!refreshToken) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    wx.request({
      url: config.baseUrl + '/api/auth/refresh-token',
      method: 'POST',
      data: { refreshToken },
      header: config.header,
      success: response => {
        if (response.statusCode === 200 && response.data.success) {
          const { token, refreshToken: newRefreshToken } = response.data.data;

          // 更新token
          app.globalData.token = token;
          storage.set('token', token);

          if (newRefreshToken) {
            storage.set('refreshToken', newRefreshToken);
          }

          resolve(token);
        } else {
          resolve(null);
        }
      },
      fail: () => {
        resolve(null);
      },
    });
  });
}

// 基础请求方法
function request(options) {
  return new Promise(async (resolve, reject) => {
    // 检查网络状态
    if (!networkStatus.isOnline) {
      // 如果允许离线队列，将请求添加到队列中
      if (
        options.offlineQueue !== false &&
        (options.method === 'POST' ||
          options.method === 'PUT' ||
          options.method === 'DELETE')
      ) {
        const queueId = offlineQueue.addRequest(
          {
            url: options.url,
            method: options.method,
            data: options.data,
            header: options.header,
          },
          options.priority || 'normal'
        );

        if (options.showError !== false) {
          showToast('网络不可用，请求已加入离线队列', ToastTypes.WARNING);
        }

        return resolve({ queueId, offline: true });
      } else {
        // 尝试从离线缓存获取数据
        if (options.method === 'GET' && options.offlineCache !== false) {
          const cacheKey = `${options.url}_${JSON.stringify(options.data || {})}`;
          const cachedData = offlineCache.getCachedData(cacheKey);

          if (cachedData) {
            if (options.showError !== false) {
              showToast('网络不可用，显示离线数据', ToastTypes.INFO);
            }
            return resolve(cachedData);
          }
        }

        const offlineError = new Error('网络连接不可用，请检查网络设置');
        offlineError.type = 'offline';

        if (options.showError !== false) {
          showToast('网络连接不可用', ToastTypes.ERROR);
        }

        return reject(offlineError);
      }
    }

    // 检查网络质量（如果超过5分钟未检测）
    if (Date.now() - networkStatus.lastCheck > 5 * 60 * 1000) {
      await checkNetworkQuality();
    }

    // 获取智能降级策略
    const strategy = getRequestStrategy(options);

    // 弱网络环境下优先使用缓存
    if (networkStatus.isWeak && options.method === 'GET' && strategy.cache) {
      const cacheKey = `${options.url}_${JSON.stringify(options.data || {})}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('弱网络环境使用缓存数据:', cacheKey);
        return resolve(cachedData);
      }
    }

    // 生成请求ID用于取消
    const currentRequestId = ++requestId;
    const requestKey = `${options.method || 'GET'}_${options.url}_${currentRequestId}`;

    // 应用智能降级策略
    const optimizedOptions = {
      ...options,
      timeout: strategy.timeout,
      maxRetries: strategy.retries,
    };

    // 请求拦截
    const requestOptions = requestInterceptor({
      url: optimizedOptions.url.startsWith('http')
        ? optimizedOptions.url
        : config.baseUrl + optimizedOptions.url,
      method: optimizedOptions.method || 'GET',
      data: optimizedOptions.data || {},
      header: {
        ...config.header,
        ...optimizedOptions.header,
      },
      timeout: optimizedOptions.timeout || config.timeout,
    });

    // 显示加载提示（弱网络环境下显示不同提示）
    if (options.loading !== false) {
      const loadingText = networkStatus.isWeak
        ? options.loadingText || '网络较慢，请稍候...'
        : options.loadingText || '加载中...';

      if (options.loadingType === 'toast') {
        showToast(loadingText, ToastTypes.LOADING);
      } else {
        wx.showLoading({
          title: loadingText,
          mask: true,
        });
      }
    }

    // 执行请求（带重试）
    executeRequestWithRetry(requestOptions, optimizedOptions, 0, requestKey)
      .then(result => {
        // 弱网络环境下缓存GET请求结果
        if (networkStatus.isWeak && options.method === 'GET') {
          const cacheKey = `${options.url}_${JSON.stringify(options.data || {})}`;
          const cacheExpire =
            networkStatus.quality === 'poor'
              ? CacheStrategies.LONG
              : CacheStrategies.MEDIUM;
          cache.set(cacheKey, result, cacheExpire);
        }
        resolve(result);
      })
      .catch(error => {
        // 处理网络错误
        if (error.type === 'network') {
          const networkError = new Error(
            networkStatus.isWeak
              ? '网络信号较弱，请求失败，请稍后重试'
              : '网络请求失败，请检查网络设置'
          );
          networkError.type = 'network';
          networkError.original = error;

          if (options.showError !== false) {
            showToast(networkError.message, ToastTypes.ERROR);
          }
          reject(networkError);
        } else {
          reject(error);
        }
      })
      .finally(() => {
        // 清理请求队列
        requestQueue.delete(requestKey);

        // 隐藏加载提示
        if (options.loading !== false) {
          if (options.loadingType === 'toast') {
            wx.hideToast();
          } else {
            wx.hideLoading();
          }
        }
      });
  });
}

// 执行带重试的请求
function executeRequestWithRetry(
  requestOptions,
  originalOptions,
  attempt,
  requestKey
) {
  return new Promise((resolve, reject) => {
    const requestTask = wx.request({
      ...requestOptions,
      success: response => {
        // 响应拦截
        responseInterceptor(response, requestOptions)
          .then(result => {
            // 缓存GET请求的成功响应到离线缓存
            if (
              requestOptions.method === 'GET' &&
              originalOptions.offlineCache !== false &&
              result
            ) {
              const cacheKey = `${requestOptions.url}_${JSON.stringify(requestOptions.data || {})}`;
              offlineCache.cacheData(cacheKey, result, 30 * 60 * 1000); // 缓存30分钟

              // 弱网络环境下额外缓存到本地缓存
              if (networkStatus.isWeak) {
                const expire =
                  networkStatus.quality === 'poor'
                    ? CacheStrategies.LONG
                    : CacheStrategies.MEDIUM;
                cache.set(cacheKey, result, expire);
              }
            }
            resolve(result);
          })
          .catch(error => {
            // 弱网络环境下的特殊处理
            if (networkStatus.isWeak && requestOptions.method === 'GET') {
              // 尝试从缓存获取数据作为降级方案
              const cacheKey = `${requestOptions.url}_${JSON.stringify(requestOptions.data || {})}`;
              const cachedData = cache.get(cacheKey);
              if (cachedData) {
                console.log(
                  '网络请求失败，使用缓存数据作为降级方案:',
                  cacheKey
                );
                resolve(cachedData);
                return;
              }
            }

            // 检查是否需要重试
            if (shouldRetry(error, attempt, originalOptions)) {
              // 根据网络质量调整重试延迟
              let delay = exponentialBackoff(attempt, config.retry.retryDelay);
              if (networkStatus.quality === 'poor') {
                delay = Math.min(delay * 2, 10000); // 弱网络环境下增加重试间隔
              }

              console.log(
                `请求失败 (网络质量: ${networkStatus.quality})，${delay}ms后进行第${attempt + 1}次重试:`,
                error.message
              );

              setTimeout(() => {
                executeRequestWithRetry(
                  requestOptions,
                  originalOptions,
                  attempt + 1,
                  requestKey
                )
                  .then(resolve)
                  .catch(reject);
              }, delay);
            } else {
              // 显示错误提示
              if (originalOptions.showError !== false) {
                let errorMessage = error.message || '请求失败';

                // 弱网络环境下的友好提示
                if (networkStatus.isWeak) {
                  errorMessage =
                    networkStatus.quality === 'poor'
                      ? '网络信号很差，请求失败，请稍后重试'
                      : '网络信号较弱，请求失败，请检查网络后重试';
                }

                showToast(errorMessage, ToastTypes.ERROR);
              }
              reject(error);
            }
          });
      },
      fail: error => {
        console.error(
          `网络请求失败 (尝试 ${attempt + 1}/${originalOptions.maxRetries || config.retry.maxRetries}):`,
          error
        );

        // 弱网络环境下的特殊处理
        if (networkStatus.isWeak && requestOptions.method === 'GET') {
          // 尝试从缓存获取数据作为降级方案
          const cacheKey = `${requestOptions.url}_${JSON.stringify(requestOptions.data || {})}`;
          const cachedData = cache.get(cacheKey);
          if (cachedData) {
            console.log('网络连接失败，使用缓存数据作为降级方案:', cacheKey);
            resolve(cachedData);
            return;
          }
        }

        // 网络错误
        const networkError = new Error('网络连接失败，请检查网络设置');
        networkError.type = 'network';
        networkError.original = error;
        networkError.quality = networkStatus.quality;

        // 检查是否需要重试
        if (shouldRetry(networkError, attempt, originalOptions)) {
          // 根据网络质量调整重试延迟
          let delay = exponentialBackoff(attempt, config.retry.retryDelay);
          if (networkStatus.quality === 'poor') {
            delay = Math.min(delay * 2, 10000); // 弱网络环境下增加重试间隔
          }

          console.log(
            `网络错误 (网络质量: ${networkStatus.quality})，${delay}ms后进行第${attempt + 1}次重试:`,
            error
          );

          setTimeout(() => {
            executeRequestWithRetry(
              requestOptions,
              originalOptions,
              attempt + 1,
              requestKey
            )
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          // 显示错误提示
          if (originalOptions.showError !== false) {
            let errorMessage = networkError.message;

            // 弱网络环境下的友好提示
            if (networkStatus.isWeak) {
              errorMessage =
                networkStatus.quality === 'poor'
                  ? '网络信号很差，连接失败，请稍后重试'
                  : '网络信号较弱，连接失败，请检查网络后重试';
            }

            showToast(errorMessage, ToastTypes.ERROR);
          }
          reject(networkError);
        }
      },
    });

    // 保存请求任务用于取消
    requestQueue.set(requestKey, requestTask);
  });
}

// 判断是否应该重试
function shouldRetry(error, attempt, options) {
  const maxRetries = options.maxRetries ?? config.retry.maxRetries;

  // 超过最大重试次数
  if (attempt >= maxRetries) {
    return false;
  }

  // 弱网络环境下的智能重试策略
  if (networkStatus.isWeak) {
    // 网络质量很差时，减少重试次数
    if (
      networkStatus.quality === 'poor' &&
      attempt >= Math.floor(maxRetries / 2)
    ) {
      return false;
    }

    // 对于某些错误类型，弱网络环境下不重试
    if (
      error.statusCode === 400 ||
      error.statusCode === 401 ||
      error.statusCode === 403
    ) {
      return false;
    }
  }

  // 网络错误或5xx服务器错误才重试
  if (
    error.type === 'network' ||
    (error.statusCode >= 500 && error.statusCode < 600)
  ) {
    return true;
  }

  // 超时错误在弱网络环境下也重试
  if (
    networkStatus.isWeak &&
    error.errMsg &&
    error.errMsg.includes('timeout')
  ) {
    return true;
  }

  return false;
}

// 取消请求
function cancelRequest(requestKey) {
  const requestTask = requestQueue.get(requestKey);
  if (requestTask) {
    requestTask.abort();
    requestQueue.delete(requestKey);
    return true;
  }
  return false;
}

// 取消所有请求
function cancelAllRequests() {
  requestQueue.forEach((requestTask, key) => {
    requestTask.abort();
  });
  requestQueue.clear();
}

// GET 请求
function get(url, params = {}, options = {}) {
  const query = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const fullUrl = query ? `${url}?${query}` : url;

  // 检查缓存
  if (options.cache) {
    const cacheKey = options.cacheKey || `${fullUrl}_${JSON.stringify(params)}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log(`缓存命中: ${cacheKey}`);
      return Promise.resolve(cachedData);
    }

    // 缓存未命中，发起请求并缓存结果
    return request({
      url: fullUrl,
      method: 'GET',
      ...options,
    }).then(result => {
      const expire = options.cacheExpire || CacheStrategies.MEDIUM;
      cache.set(cacheKey, result, expire);
      console.log(`缓存存储: ${cacheKey}`);
      return result;
    });
  }

  return request({
    url: fullUrl,
    method: 'GET',
    ...options,
  });
}

// POST 请求
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options,
  });
}

// PUT 请求
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options,
  });
}

// DELETE 请求
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options,
  });
}

// 上传文件
function upload(url, filePath, options = {}) {
  return new Promise((resolve, reject) => {
    // 添加 token
    const token = app.getToken();
    const header = {
      ...options.header,
    };

    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    // 显示上传进度
    if (options.loading !== false) {
      wx.showLoading({
        title: options.loadingText || '上传中...',
        mask: true,
      });
    }

    const uploadTask = wx.uploadFile({
      url: url.startsWith('http') ? url : config.baseUrl + url,
      filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      header,
      success: response => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading();
        }

        try {
          const data = JSON.parse(response.data);
          if (data.code === 0 || data.success) {
            resolve(data.data || data);
          } else {
            const error = new Error(data.message || '上传失败');
            error.code = data.code;
            error.data = data;
            reject(error);
          }
        } catch (error) {
          reject(new Error('响应数据解析失败'));
        }
      },
      fail: error => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading();
        }

        const uploadError = new Error('上传失败，请检查网络设置');
        uploadError.type = 'upload';
        uploadError.original = error;

        // 显示错误提示
        if (options.showError !== false) {
          wx.showToast({
            title: uploadError.message,
            icon: 'none',
            duration: 2000,
          });
        }

        reject(uploadError);
      },
    });

    // 监听上传进度
    if (options.onProgress) {
      uploadTask.onProgressUpdate(options.onProgress);
    }
  });
}

// 下载文件
function download(url, options = {}) {
  return new Promise((resolve, reject) => {
    // 添加 token
    const token = app.getToken();
    const header = {
      ...options.header,
    };

    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    // 显示下载进度
    if (options.loading !== false) {
      wx.showLoading({
        title: options.loadingText || '下载中...',
        mask: true,
      });
    }

    const downloadTask = wx.downloadFile({
      url: url.startsWith('http') ? url : config.baseUrl + url,
      header,
      success: response => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading();
        }

        if (response.statusCode === 200) {
          resolve(response.tempFilePath);
        } else {
          reject(new Error('下载失败'));
        }
      },
      fail: error => {
        // 隐藏加载提示
        if (options.loading !== false) {
          wx.hideLoading();
        }

        const downloadError = new Error('下载失败，请检查网络设置');
        downloadError.type = 'download';
        downloadError.original = error;

        // 显示错误提示
        if (options.showError !== false) {
          wx.showToast({
            title: downloadError.message,
            icon: 'none',
            duration: 2000,
          });
        }

        reject(downloadError);
      },
    });

    // 监听下载进度
    if (options.onProgress) {
      downloadTask.onProgressUpdate(options.onProgress);
    }
  });
}

// 带缓存的GET请求
function getCached(url, params = {}, cacheOptions = {}) {
  const defaultCacheOptions = {
    cache: true,
    cacheExpire: CacheStrategies.MEDIUM,
    cacheKey: `${url}_${JSON.stringify(params)}`,
  };

  return get(url, params, {
    ...defaultCacheOptions,
    ...cacheOptions,
  });
}

// 清除指定URL的缓存
function clearCache(cacheKey) {
  cache.remove(cacheKey);
}

// 清除所有缓存
function clearAllCache() {
  cache.clear();
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
  cancelRequest,
  cancelAllRequests,
  showToast,
  ToastTypes,
  networkStatus,
  config,
  offlineQueue,
  offlineCache,
  networkMonitor,
};
