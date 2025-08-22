/**
 * 网络优化混入
 * 为页面提供弱网络环境下的优化功能
 */

import networkOptimizer, { NetworkQuality } from '../utils/networkOptimizer.js';
import { showToast, ToastTypes } from '../utils/request.js';

/**
 * 网络优化混入
 */
const networkOptimizationMixin = {
  data() {
    return {
      // 网络状态
      networkQuality: NetworkQuality.FAIR,
      networkStrategy: null,
      isWeakNetwork: false,
      networkTip: '',

      // 优化相关状态
      enableAnimation: true,
      enablePreload: true,
      imageQuality: 'medium',
      requestConcurrency: 3,
    };
  },

  onLoad() {
    this.initNetworkOptimization();
  },

  onUnload() {
    this.cleanupNetworkOptimization();
  },

  methods: {
    /**
     * 初始化网络优化
     */
    initNetworkOptimization() {
      // 添加网络策略监听器
      this.networkUnsubscribe = networkOptimizer.addListener(
        (quality, strategy) => {
          this.onNetworkStrategyChange(quality, strategy);
        }
      );

      // 初始化当前状态
      const currentQuality = networkOptimizer.getNetworkQuality();
      const currentStrategy = networkOptimizer.getCurrentStrategy();
      this.onNetworkStrategyChange(currentQuality, currentStrategy);
    },

    /**
     * 清理网络优化
     */
    cleanupNetworkOptimization() {
      if (this.networkUnsubscribe) {
        this.networkUnsubscribe();
        this.networkUnsubscribe = null;
      }
    },

    /**
     * 网络策略变化处理
     */
    onNetworkStrategyChange(quality, strategy) {
      const oldQuality = this.networkQuality;

      this.setData({
        networkQuality: quality,
        networkStrategy: strategy,
        isWeakNetwork:
          quality === NetworkQuality.POOR || quality === NetworkQuality.FAIR,
        networkTip: networkOptimizer.getNetworkTip(),
        enableAnimation: strategy.enableAnimation,
        enablePreload: strategy.enablePreload,
        imageQuality: strategy.imageQuality,
        requestConcurrency: strategy.requestConcurrency,
      });

      // 网络质量变化时的处理
      if (oldQuality !== quality) {
        this.onNetworkQualityChange(quality, oldQuality);
      }

      // 调用页面自定义的网络策略变化处理
      if (typeof this.onCustomNetworkStrategyChange === 'function') {
        this.onCustomNetworkStrategyChange(quality, strategy);
      }
    },

    /**
     * 网络质量变化处理
     */
    onNetworkQualityChange(newQuality, oldQuality) {
      console.log(`网络质量变化: ${oldQuality} -> ${newQuality}`);

      // 网络质量恶化时的提示
      if (this.shouldShowNetworkTip(newQuality, oldQuality)) {
        const tip = networkOptimizer.getNetworkTip();
        if (tip) {
          showToast(tip, ToastTypes.WARNING, 3000);
        }
      }

      // 网络质量改善时重新加载数据
      if (this.shouldRefreshOnNetworkImprove(newQuality, oldQuality)) {
        this.refreshDataOnNetworkImprove();
      }

      // 调用页面自定义的网络质量变化处理
      if (typeof this.onCustomNetworkQualityChange === 'function') {
        this.onCustomNetworkQualityChange(newQuality, oldQuality);
      }
    },

    /**
     * 是否应该显示网络提示
     */
    shouldShowNetworkTip(newQuality, oldQuality) {
      // 从好网络变为差网络时提示
      return (
        (oldQuality === NetworkQuality.GOOD &&
          newQuality !== NetworkQuality.GOOD) ||
        (oldQuality === NetworkQuality.FAIR &&
          newQuality === NetworkQuality.POOR)
      );
    },

    /**
     * 是否应该在网络改善时刷新数据
     */
    shouldRefreshOnNetworkImprove(newQuality, oldQuality) {
      // 从差网络变为好网络时刷新
      return (
        (oldQuality === NetworkQuality.POOR &&
          newQuality !== NetworkQuality.POOR) ||
        (oldQuality === NetworkQuality.FAIR &&
          newQuality === NetworkQuality.GOOD)
      );
    },

    /**
     * 网络改善时刷新数据
     */
    refreshDataOnNetworkImprove() {
      // 调用页面的刷新方法
      if (typeof this.refreshData === 'function') {
        console.log('网络质量改善，刷新页面数据');
        this.refreshData();
      }
    },

    /**
     * 获取优化后的图片URL
     */
    getOptimizedImageUrl(originalUrl, options = {}) {
      if (!originalUrl) return '';

      const quality = options.quality || this.data.imageQuality;
      const { width, height } = options;

      // 根据网络质量调整图片参数
      let params = [];

      if (width) params.push(`w_${width}`);
      if (height) params.push(`h_${height}`);

      switch (quality) {
        case 'low':
          params.push('q_60', 'f_auto');
          break;
        case 'medium':
          params.push('q_80', 'f_auto');
          break;
        case 'high':
        default:
          params.push('q_90', 'f_auto');
          break;
      }

      // 如果原URL已经包含参数，需要智能合并
      if (originalUrl.includes('?')) {
        return `${originalUrl}&${params.join('&')}`;
      } else {
        return params.length > 0
          ? `${originalUrl}?${params.join('&')}`
          : originalUrl;
      }
    },

    /**
     * 检查是否应该启用某个功能
     */
    shouldEnableFeature(feature) {
      return networkOptimizer.shouldEnable(feature);
    },

    /**
     * 获取网络状态描述
     */
    getNetworkDescription() {
      return networkOptimizer.getNetworkDescription();
    },

    /**
     * 手动检测网络质量
     */
    async checkNetworkQuality() {
      try {
        wx.showLoading({ title: '检测网络中...' });
        const quality = await networkOptimizer.checkQuality();
        wx.hideLoading();

        showToast(
          `网络检测完成：${networkOptimizer.getNetworkDescription()}`,
          ToastTypes.INFO
        );
        return quality;
      } catch (error) {
        wx.hideLoading();
        showToast('网络检测失败', ToastTypes.ERROR);
        throw error;
      }
    },

    /**
     * 获取弱网络环境下的加载提示文本
     */
    getLoadingText(defaultText = '加载中...') {
      if (this.data.isWeakNetwork) {
        return this.data.networkQuality === NetworkQuality.POOR
          ? '网络较慢，请耐心等待...'
          : '正在加载，请稍候...';
      }
      return defaultText;
    },

    /**
     * 获取重试提示文本
     */
    getRetryText() {
      if (this.data.isWeakNetwork) {
        return this.data.networkQuality === NetworkQuality.POOR
          ? '网络信号差，点击重试'
          : '网络较慢，点击重试';
      }
      return '加载失败，点击重试';
    },
  },
};

export default networkOptimizationMixin;
