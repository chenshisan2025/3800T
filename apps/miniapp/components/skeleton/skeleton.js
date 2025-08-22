// components/skeleton/skeleton.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示骨架屏
    show: {
      type: Boolean,
      value: false,
    },
    // 骨架屏类型：market(市场页面), list(列表), card(卡片), full(完整页面)
    type: {
      type: String,
      value: 'list',
    },
    // 列表项数量
    count: {
      type: Number,
      value: 8,
    },
    // 是否显示头像
    showAvatar: {
      type: Boolean,
      value: true,
    },
    // 是否显示副标题
    showSubtitle: {
      type: Boolean,
      value: true,
    },
    // 是否简化模式
    simple: {
      type: Boolean,
      value: false,
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 显示骨架屏
     */
    showSkeleton() {
      this.setData({
        show: true,
      });
    },

    /**
     * 隐藏骨架屏
     */
    hideSkeleton() {
      this.setData({
        show: false,
      });
    },

    /**
     * 切换骨架屏显示状态
     */
    toggleSkeleton() {
      this.setData({
        show: !this.data.show,
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
    },
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show() {
      // 页面被展示
    },

    hide() {
      // 页面被隐藏
    },
  },
});
