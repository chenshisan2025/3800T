// components/compliance/data-source-hint.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 数据源类型：realtime(实时), delayed(延时), historical(历史), estimated(预估)
    type: {
      type: String,
      value: 'realtime',
    },
    // 显示位置：bottom(底部), top(顶部), inline(内联)
    position: {
      type: String,
      value: 'bottom',
    },
    // 主题样式：light(浅色), dark(深色), transparent(透明)
    theme: {
      type: String,
      value: 'light',
    },
    // 是否可关闭
    closable: {
      type: Boolean,
      value: true,
    },
    // 是否显示图标
    showIcon: {
      type: Boolean,
      value: true,
    },
    // 自定义类名
    customClass: {
      type: String,
      value: '',
    },
    // 语言设置：zh(中文), en(英文)
    language: {
      type: String,
      value: 'zh',
    },
    // 是否强制显示（忽略全局开关）
    forceShow: {
      type: Boolean,
      value: false,
    },
    // 数据提供商信息
    providers: {
      type: Array,
      value: [],
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    visible: true,
    loading: false,
    config: null,
    globalEnabled: true,
    // 默认配置
    defaultConfigs: {
      realtime: {
        zh: {
          title: '实时数据',
          content: '数据来源于交易所实时行情，更新频率约1秒',
          providers: [
            { name: '上海证券交易所', code: 'SSE' },
            { name: '深圳证券交易所', code: 'SZSE' },
          ],
          linkText: '数据说明',
          linkUrl: '/pages/protocol/protocol?type=data-source',
        },
        en: {
          title: 'Real-time Data',
          content:
            'Data sourced from exchange real-time quotes, updated approximately every 1 second',
          providers: [
            { name: 'Shanghai Stock Exchange', code: 'SSE' },
            { name: 'Shenzhen Stock Exchange', code: 'SZSE' },
          ],
          linkText: 'Data Info',
          linkUrl: '/pages/protocol/protocol?type=data-source',
        },
      },
      delayed: {
        zh: {
          title: '延时数据',
          content: '数据延时15-20分钟，仅供参考',
          providers: [{ name: '第三方数据提供商', code: 'VENDOR' }],
          linkText: '了解延时说明',
          linkUrl: '/pages/protocol/protocol?type=delayed-data',
        },
        en: {
          title: 'Delayed Data',
          content: 'Data delayed by 15-20 minutes, for reference only',
          providers: [{ name: 'Third-party Data Provider', code: 'VENDOR' }],
          linkText: 'Delay Info',
          linkUrl: '/pages/protocol/protocol?type=delayed-data',
        },
      },
      historical: {
        zh: {
          title: '历史数据',
          content: '基于历史交易数据整理，用于分析参考',
          providers: [{ name: '历史数据库', code: 'HIST' }],
          linkText: '数据来源',
          linkUrl: '/pages/protocol/protocol?type=historical-data',
        },
        en: {
          title: 'Historical Data',
          content: 'Based on historical trading data for analysis reference',
          providers: [{ name: 'Historical Database', code: 'HIST' }],
          linkText: 'Data Source',
          linkUrl: '/pages/protocol/protocol?type=historical-data',
        },
      },
      estimated: {
        zh: {
          title: '预估数据',
          content: '基于算法模型预估，仅供参考，不构成投资建议',
          providers: [{ name: '算法模型', code: 'MODEL' }],
          linkText: '预估说明',
          linkUrl: '/pages/protocol/protocol?type=estimated-data',
        },
        en: {
          title: 'Estimated Data',
          content:
            'Based on algorithmic models, for reference only, not investment advice',
          providers: [{ name: 'Algorithm Model', code: 'MODEL' }],
          linkText: 'Estimation Info',
          linkUrl: '/pages/protocol/protocol?type=estimated-data',
        },
      },
    },
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.loadConfig();
      this.checkGlobalSwitch();
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 加载配置
     */
    async loadConfig() {
      try {
        this.setData({ loading: true });

        // 尝试从缓存或API获取配置
        const config = await this.fetchConfig();

        this.setData({
          config: config || this.getDefaultConfig(),
          loading: false,
        });
      } catch (error) {
        console.warn('Failed to load data source hint config:', error);
        this.setData({
          config: this.getDefaultConfig(),
          loading: false,
        });
      }
    },

    /**
     * 获取配置
     */
    async fetchConfig() {
      // 模拟API调用，实际应该调用shared-sdk的配置管理
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(null); // 返回null使用默认配置
        }, 100);
      });
    },

    /**
     * 获取默认配置
     */
    getDefaultConfig() {
      const { type, language, providers } = this.properties;
      const defaultConfig =
        this.data.defaultConfigs[type]?.[language] ||
        this.data.defaultConfigs.realtime.zh;

      // 如果传入了自定义providers，使用自定义的
      if (providers && providers.length > 0) {
        return {
          ...defaultConfig,
          providers,
        };
      }

      return defaultConfig;
    },

    /**
     * 检查全局开关
     */
    async checkGlobalSwitch() {
      try {
        // 模拟检查全局开关状态
        const globalEnabled = await this.getGlobalSwitch();
        this.setData({ globalEnabled });
      } catch (error) {
        console.warn('Failed to check global switch:', error);
        this.setData({ globalEnabled: true });
      }
    },

    /**
     * 获取全局开关状态
     */
    async getGlobalSwitch() {
      try {
        const apiUrl = 'http://localhost:3003'; // 可以从配置中获取

        return new Promise((resolve, reject) => {
          wx.request({
            url: `${apiUrl}/api/compliance/config`,
            method: 'GET',
            header: {
              'Content-Type': 'application/json',
            },
            success: res => {
              if (res.statusCode === 200 && res.data.success) {
                const globalConfig = res.data.data.globalConfig;
                resolve(globalConfig.dataSourceHintEnabled ?? true);
              } else {
                resolve(true); // 默认启用
              }
            },
            fail: err => {
              console.warn('API call failed:', err);
              resolve(true); // 出错时默认启用
            },
          });
        });
      } catch (error) {
        console.warn('Failed to get global switch:', error);
        return true;
      }
    },

    /**
     * 关闭组件
     */
    handleClose() {
      this.setData({ visible: false });
      this.triggerEvent('close', {
        type: this.properties.type,
      });
    },

    /**
     * 点击链接
     */
    handleLinkTap() {
      const config = this.data.config;
      if (config && config.linkUrl) {
        wx.navigateTo({
          url: config.linkUrl,
          fail: err => {
            console.warn('Navigation failed:', err);
            // 如果是外部链接，可以复制到剪贴板
            if (config.linkUrl.startsWith('http')) {
              wx.setClipboardData({
                data: config.linkUrl,
                success: () => {
                  wx.showToast({
                    title: '链接已复制',
                    icon: 'success',
                  });
                },
              });
            }
          },
        });
      }
    },

    /**
     * 点击数据提供商
     */
    handleProviderTap(e) {
      const { provider } = e.currentTarget.dataset;
      this.triggerEvent('providerTap', {
        provider,
        type: this.properties.type,
      });
    },

    /**
     * 显示组件
     */
    show() {
      this.setData({ visible: true });
    },

    /**
     * 隐藏组件
     */
    hide() {
      this.setData({ visible: false });
    },

    /**
     * 切换显示状态
     */
    toggle() {
      this.setData({ visible: !this.data.visible });
    },
  },

  /**
   * 计算属性
   */
  computed: {
    shouldShow() {
      const { forceShow } = this.properties;
      const { visible, globalEnabled } = this.data;
      return visible && (forceShow || globalEnabled);
    },
  },
});
