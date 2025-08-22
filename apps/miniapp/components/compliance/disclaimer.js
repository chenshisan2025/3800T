// components/compliance/disclaimer.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 免责声明类型：investment(投资风险), ai(AI分析), data(数据声明)
    type: {
      type: String,
      value: 'investment',
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
      investment: {
        zh: {
          title: '投资风险提示',
          content:
            '投资有风险，入市需谨慎。本平台提供的信息仅供参考，不构成投资建议。',
          linkText: '了解更多',
          linkUrl: '/pages/protocol/protocol?type=risk',
        },
        en: {
          title: 'Investment Risk Warning',
          content:
            'Investment involves risks. The information provided is for reference only and does not constitute investment advice.',
          linkText: 'Learn More',
          linkUrl: '/pages/protocol/protocol?type=risk',
        },
      },
      ai: {
        zh: {
          title: 'AI分析说明',
          content:
            'AI分析结果仅供参考，不构成投资建议。请结合其他信息进行综合判断。',
          linkText: '查看详情',
          linkUrl: '/pages/protocol/protocol?type=ai',
        },
        en: {
          title: 'AI Analysis Disclaimer',
          content:
            'AI analysis results are for reference only and do not constitute investment advice.',
          linkText: 'View Details',
          linkUrl: '/pages/protocol/protocol?type=ai',
        },
      },
      data: {
        zh: {
          title: '数据声明',
          content:
            '数据来源于公开市场，仅供参考。我们不保证数据的准确性和完整性。',
          linkText: '数据说明',
          linkUrl: '/pages/protocol/protocol?type=data',
        },
        en: {
          title: 'Data Disclaimer',
          content:
            'Data is sourced from public markets for reference only. We do not guarantee accuracy or completeness.',
          linkText: 'Data Info',
          linkUrl: '/pages/protocol/protocol?type=data',
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
        console.warn('Failed to load disclaimer config:', error);
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
      const { type, language } = this.properties;
      return (
        this.data.defaultConfigs[type]?.[language] ||
        this.data.defaultConfigs.investment.zh
      );
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
                resolve(globalConfig.disclaimerEnabled ?? true);
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
