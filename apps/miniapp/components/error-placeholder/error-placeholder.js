// components/error-placeholder/error-placeholder.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示错误占位
    show: {
      type: Boolean,
      value: false,
    },
    // 错误类型：network(网络错误), empty(空数据), server(服务器错误), custom(自定义)
    type: {
      type: String,
      value: 'network',
    },
    // 自定义标题
    title: {
      type: String,
      value: '',
    },
    // 自定义描述
    description: {
      type: String,
      value: '',
    },
    // 是否显示重试按钮
    showRetry: {
      type: Boolean,
      value: true,
    },
    // 是否显示刷新按钮
    showRefresh: {
      type: Boolean,
      value: false,
    },
    // 重试按钮文本
    retryText: {
      type: String,
      value: '重试',
    },
    // 刷新按钮文本
    refreshText: {
      type: String,
      value: '刷新',
    },
    // 自定义操作按钮
    customActions: {
      type: Array,
      value: [],
    },
    // 额外信息
    extraInfo: {
      type: String,
      value: '',
    },
    // 是否紧凑模式
    compact: {
      type: Boolean,
      value: false,
    },
    // 布局方式：vertical(垂直), horizontal(水平)
    layout: {
      type: String,
      value: 'vertical',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    retrying: false,
    refreshing: false,
    // 默认错误信息配置
    errorConfig: {
      network: {
        title: '网络连接异常',
        description: '请检查网络设置后重试',
      },
      empty: {
        title: '暂无数据',
        description: '当前没有相关数据',
      },
      server: {
        title: '服务异常',
        description: '服务器开小差了，请稍后重试',
      },
      custom: {
        title: '出现错误',
        description: '请稍后重试',
      },
    },
  },

  /**
   * 计算属性
   */
  computed: {
    defaultTitle() {
      return this.data.errorConfig[this.properties.type]?.title || '出现错误';
    },

    defaultDescription() {
      return (
        this.data.errorConfig[this.properties.type]?.description || '请稍后重试'
      );
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理重试
     */
    handleRetry() {
      if (this.data.retrying) return;

      this.setData({ retrying: true });

      // 触发重试事件
      this.triggerEvent('retry', {
        type: this.properties.type,
      });

      // 模拟重试过程，实际应该由父组件控制
      setTimeout(() => {
        this.setData({ retrying: false });
      }, 1000);
    },

    /**
     * 处理刷新
     */
    handleRefresh() {
      if (this.data.refreshing) return;

      this.setData({ refreshing: true });

      // 触发刷新事件
      this.triggerEvent('refresh', {
        type: this.properties.type,
      });

      // 模拟刷新过程
      setTimeout(() => {
        this.setData({ refreshing: false });
      }, 1000);
    },

    /**
     * 处理自定义操作
     */
    handleCustomAction(e) {
      const { action } = e.currentTarget.dataset;
      const actionItem = this.properties.customActions.find(
        item => item.key === action
      );

      if (!actionItem || actionItem.loading) return;

      // 更新按钮加载状态
      const updatedActions = this.properties.customActions.map(item => {
        if (item.key === action) {
          return { ...item, loading: true };
        }
        return item;
      });

      this.setData({
        customActions: updatedActions,
      });

      // 触发自定义操作事件
      this.triggerEvent('customAction', {
        action,
        type: this.properties.type,
      });

      // 模拟操作过程
      setTimeout(() => {
        const resetActions = this.properties.customActions.map(item => {
          if (item.key === action) {
            return { ...item, loading: false };
          }
          return item;
        });

        this.setData({
          customActions: resetActions,
        });
      }, 1000);
    },

    /**
     * 显示错误占位
     */
    showError(type = 'network', options = {}) {
      this.setData({
        show: true,
        type,
        ...options,
      });
    },

    /**
     * 隐藏错误占位
     */
    hideError() {
      this.setData({
        show: false,
        retrying: false,
        refreshing: false,
      });
    },

    /**
     * 重置状态
     */
    resetState() {
      this.setData({
        retrying: false,
        refreshing: false,
      });

      // 重置自定义操作按钮状态
      const resetActions = this.properties.customActions.map(item => ({
        ...item,
        loading: false,
      }));

      this.setData({
        customActions: resetActions,
      });
    },
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例被放入页面节点树后执行
    },

    detached() {
      // 组件实例被从页面节点树移除后执行
      this.resetState();
    },
  },

  /**
   * 监听属性变化
   */
  observers: {
    show: function (show) {
      if (!show) {
        this.resetState();
      }
    },
  },
});
