/**
 * 网络质量监控和优化工具
 * 提供弱网络环境下的优化策略和用户体验增强
 */

import { networkStatus, checkNetworkQuality } from './request.js';
import { cache, CacheStrategies } from './cache.js';

// 网络质量等级
const NetworkQuality = {
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
};

// 优化策略配置
const OptimizationStrategies = {
  [NetworkQuality.GOOD]: {
    enablePreload: true,
    cacheStrategy: CacheStrategies.SHORT,
    imageQuality: 'high',
    requestConcurrency: 6,
    enableAnimation: true,
  },
  [NetworkQuality.FAIR]: {
    enablePreload: false,
    cacheStrategy: CacheStrategies.MEDIUM,
    imageQuality: 'medium',
    requestConcurrency: 3,
    enableAnimation: true,
  },
  [NetworkQuality.POOR]: {
    enablePreload: false,
    cacheStrategy: CacheStrategies.LONG,
    imageQuality: 'low',
    requestConcurrency: 1,
    enableAnimation: false,
  },
};

/**
 * 网络优化器类
 */
class NetworkOptimizer {
  constructor() {
    this.listeners = new Set();
    this.currentStrategy = null;
    this.init();
  }

  /**
   * 初始化网络优化器
   */
  init() {
    this.updateStrategy();

    // 监听网络状态变化
    wx.onNetworkStatusChange(res => {
      if (res.isConnected) {
        // 网络恢复时检测质量
        setTimeout(() => {
          checkNetworkQuality().then(() => {
            this.updateStrategy();
          });
        }, 1000);
      } else {
        // 网络断开
        this.updateStrategy(NetworkQuality.POOR);
      }
    });
  }

  /**
   * 更新优化策略
   */
  updateStrategy(quality = null) {
    const currentQuality =
      quality || networkStatus.quality || NetworkQuality.FAIR;
    const newStrategy = OptimizationStrategies[currentQuality];

    if (JSON.stringify(this.currentStrategy) !== JSON.stringify(newStrategy)) {
      this.currentStrategy = newStrategy;
      this.notifyListeners(currentQuality, newStrategy);
    }
  }

  /**
   * 添加策略变化监听器
   */
  addListener(callback) {
    this.listeners.add(callback);

    // 立即调用一次，传递当前策略
    if (this.currentStrategy) {
      callback(
        networkStatus.quality || NetworkQuality.FAIR,
        this.currentStrategy
      );
    }

    return () => this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(quality, strategy) {
    this.listeners.forEach(callback => {
      try {
        callback(quality, strategy);
      } catch (error) {
        console.error('网络优化策略监听器执行错误:', error);
      }
    });
  }

  /**
   * 获取当前网络质量
   */
  getNetworkQuality() {
    return networkStatus.quality || NetworkQuality.FAIR;
  }

  /**
   * 获取当前优化策略
   */
  getCurrentStrategy() {
    return this.currentStrategy || OptimizationStrategies[NetworkQuality.FAIR];
  }

  /**
   * 检查是否应该启用某个功能
   */
  shouldEnable(feature) {
    const strategy = this.getCurrentStrategy();
    return strategy[feature] !== false;
  }

  /**
   * 获取推荐的图片质量
   */
  getImageQuality() {
    return this.getCurrentStrategy().imageQuality;
  }

  /**
   * 获取推荐的请求并发数
   */
  getRequestConcurrency() {
    return this.getCurrentStrategy().requestConcurrency;
  }

  /**
   * 获取推荐的缓存策略
   */
  getCacheStrategy() {
    return this.getCurrentStrategy().cacheStrategy;
  }

  /**
   * 是否启用预加载
   */
  shouldPreload() {
    return this.getCurrentStrategy().enablePreload;
  }

  /**
   * 是否启用动画
   */
  shouldEnableAnimation() {
    return this.getCurrentStrategy().enableAnimation;
  }

  /**
   * 获取网络状态描述
   */
  getNetworkDescription() {
    const quality = this.getNetworkQuality();
    const descriptions = {
      [NetworkQuality.GOOD]: '网络状况良好',
      [NetworkQuality.FAIR]: '网络状况一般',
      [NetworkQuality.POOR]: '网络状况较差',
    };
    return descriptions[quality] || '网络状况未知';
  }

  /**
   * 获取用户友好的网络提示
   */
  getNetworkTip() {
    const quality = this.getNetworkQuality();
    const tips = {
      [NetworkQuality.GOOD]: '',
      [NetworkQuality.FAIR]: '当前网络较慢，已为您优化加载速度',
      [NetworkQuality.POOR]: '当前网络很慢，已启用省流量模式',
    };
    return tips[quality] || '';
  }

  /**
   * 手动触发网络质量检测
   */
  async checkQuality() {
    try {
      await checkNetworkQuality();
      this.updateStrategy();
      return this.getNetworkQuality();
    } catch (error) {
      console.error('网络质量检测失败:', error);
      return NetworkQuality.POOR;
    }
  }
}

// 创建单例实例
const networkOptimizer = new NetworkOptimizer();

// 导出常量和实例
export { NetworkQuality, OptimizationStrategies, networkOptimizer };

export default networkOptimizer;
