// utils/offline.js
const { storage } = require('./storage');
const { showToast, ToastTypes } = require('./request');

// 离线队列管理
class OfflineQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.storageKey = 'offline_request_queue';
    this.loadQueue();
  }

  // 从本地存储加载队列
  loadQueue() {
    try {
      const savedQueue = storage.get(this.storageKey);
      if (savedQueue && Array.isArray(savedQueue)) {
        this.queue = savedQueue;
      }
    } catch (error) {
      console.error('加载离线队列失败:', error);
      this.queue = [];
    }
  }

  // 保存队列到本地存储
  saveQueue() {
    try {
      storage.set(this.storageKey, this.queue);
    } catch (error) {
      console.error('保存离线队列失败:', error);
    }
  }

  // 添加请求到离线队列
  addRequest(requestOptions, priority = 'normal') {
    const queueItem = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      requestOptions,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    // 根据优先级插入队列
    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    this.saveQueue();
    console.log('请求已添加到离线队列:', queueItem.id);

    return queueItem.id;
  }

  // 移除队列中的请求
  removeRequest(requestId) {
    const index = this.queue.findIndex(item => item.id === requestId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
      return true;
    }
    return false;
  }

  // 处理离线队列
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`开始处理离线队列，共${this.queue.length}个请求`);

    const { request } = require('./request');
    const processedItems = [];

    for (const item of this.queue) {
      try {
        // 检查请求是否过期（24小时）
        if (Date.now() - item.timestamp > 24 * 60 * 60 * 1000) {
          console.log('请求已过期，跳过:', item.id);
          processedItems.push(item.id);
          continue;
        }

        // 执行请求
        await request({
          ...item.requestOptions,
          loading: false, // 批量处理时不显示加载提示
          showError: false, // 批量处理时不显示错误提示
        });

        console.log('离线请求处理成功:', item.id);
        processedItems.push(item.id);
      } catch (error) {
        console.error('离线请求处理失败:', item.id, error);

        // 增加重试次数
        item.retryCount++;

        // 如果超过最大重试次数，移除该请求
        if (item.retryCount >= item.maxRetries) {
          console.log('请求重试次数已达上限，移除:', item.id);
          processedItems.push(item.id);
        }
      }
    }

    // 移除已处理的请求
    processedItems.forEach(id => this.removeRequest(id));

    this.isProcessing = false;

    if (processedItems.length > 0) {
      showToast(`已同步${processedItems.length}个离线请求`, ToastTypes.SUCCESS);
    }
  }

  // 清空队列
  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  // 获取队列状态
  getQueueStatus() {
    return {
      total: this.queue.length,
      highPriority: this.queue.filter(item => item.priority === 'high').length,
      normalPriority: this.queue.filter(item => item.priority === 'normal')
        .length,
      isProcessing: this.isProcessing,
    };
  }
}

// 离线数据缓存管理
class OfflineCache {
  constructor() {
    this.cachePrefix = 'offline_cache_';
  }

  // 缓存数据
  cacheData(key, data, expireTime = 24 * 60 * 60 * 1000) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expireTime,
    };

    storage.set(this.cachePrefix + key, cacheItem);
  }

  // 获取缓存数据
  getCachedData(key) {
    try {
      const cacheItem = storage.get(this.cachePrefix + key);

      if (!cacheItem) {
        return null;
      }

      // 检查是否过期
      if (Date.now() - cacheItem.timestamp > cacheItem.expireTime) {
        this.removeCachedData(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('获取离线缓存失败:', error);
      return null;
    }
  }

  // 移除缓存数据
  removeCachedData(key) {
    storage.remove(this.cachePrefix + key);
  }

  // 清空所有缓存
  clearAllCache() {
    const keys = storage.getAllKeys();
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        storage.remove(key);
      }
    });
  }

  // 获取缓存统计
  getCacheStats() {
    const keys = storage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));

    let totalSize = 0;
    let expiredCount = 0;

    cacheKeys.forEach(key => {
      try {
        const cacheItem = storage.get(key);
        if (cacheItem) {
          totalSize += JSON.stringify(cacheItem).length;

          if (Date.now() - cacheItem.timestamp > cacheItem.expireTime) {
            expiredCount++;
          }
        }
      } catch (error) {
        console.error('统计缓存失败:', error);
      }
    });

    return {
      totalItems: cacheKeys.length,
      totalSize,
      expiredCount,
    };
  }
}

// 网络状态监听器
class NetworkMonitor {
  constructor() {
    this.listeners = [];
    this.isOnline = true;
    this.networkType = 'unknown';

    this.init();
  }

  init() {
    // 获取初始网络状态
    wx.getNetworkType({
      success: res => {
        this.isOnline = res.networkType !== 'none';
        this.networkType = res.networkType;
        this.notifyListeners(this.isOnline, res.networkType);
      },
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange(res => {
      this.isOnline = res.isConnected;
      this.networkType = res.networkType;
      this.notifyListeners(res.isConnected, res.networkType);
    });
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 移除监听器
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 通知所有监听器
  notifyListeners(isOnline, networkType) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline, networkType);
      } catch (error) {
        console.error('网络状态监听器回调失败:', error);
      }
    });
  }

  // 获取网络状态
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      networkType: this.networkType,
    };
  }
}

// 创建单例实例
const offlineQueue = new OfflineQueue();
const offlineCache = new OfflineCache();
const networkMonitor = new NetworkMonitor();

// 网络恢复时自动处理离线队列
networkMonitor.addListener(isOnline => {
  if (isOnline) {
    console.log('网络已恢复，开始处理离线队列');
    setTimeout(() => {
      offlineQueue.processQueue();
    }, 1000); // 延迟1秒确保网络稳定
  }
});

module.exports = {
  offlineQueue,
  offlineCache,
  networkMonitor,
  OfflineQueue,
  OfflineCache,
  NetworkMonitor,
};
