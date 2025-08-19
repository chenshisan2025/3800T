// pages/ai/ai.js
const app = getApp();
const { featureGate, hasFeature, checkLimit, showUpgradePrompt, showLimitPrompt } = require('../../utils/featureGate');

Page({
  data: {
    messages: [],
    inputValue: '',
    isAnalyzing: false,
    analysisTypes: [
      {
        id: 'technical',
        name: '技术分析',
        icon: '📈',
        color: '#ff6b6b',
        description: '基于技术指标和图表形态分析'
      },
      {
        id: 'fundamental',
        name: '基本面分析',
        icon: '📊',
        color: '#4ecdc4',
        description: '基于财务数据和公司基本面分析'
      },
      {
        id: 'sentiment',
        name: '情绪分析',
        icon: '💭',
        color: '#45b7d1',
        description: '基于市场情绪和新闻舆情分析'
      },
      {
        id: 'risk',
        name: '风险评估',
        icon: '⚠️',
        color: '#f9ca24',
        description: '基于风险指标和波动性分析'
      }
    ],
    selectedStock: 'AAPL'
  },

  onLoad: function (options) {
    console.log('AI分析页面加载');
    this.initWelcomeMessage();
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 初始化欢迎消息
  initWelcomeMessage: function () {
    const welcomeMessage = {
      id: Date.now(),
      type: 'system',
      content: '欢迎使用AI股票分析助手！请选择分析类型或输入股票代码开始分析。',
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.setData({
      messages: [welcomeMessage]
    });
  },

  // 选择分析类型
  onAnalysisTypeTap: async function (e) {
    const typeId = e.currentTarget.dataset.type;
    const type = this.data.analysisTypes.find(t => t.id === typeId);
    
    if (type) {
      // 检查AI报告使用限制
      const dailyLimit = await checkLimit('aiReportsPerDay');
      const monthlyLimit = await checkLimit('aiReportsPerMonth');
      
      if (!dailyLimit.canUse) {
        showLimitPrompt('aiReportsPerDay', dailyLimit);
        return;
      }
      
      if (!monthlyLimit.canUse) {
        showLimitPrompt('aiReportsPerMonth', monthlyLimit);
        return;
      }
      
      // 检查深度分析权限
      if (typeId === 'fundamental' || typeId === 'risk') {
        const hasDeepAnalysis = await hasFeature('aiDeepAnalysis');
        if (!hasDeepAnalysis) {
          showUpgradePrompt('aiDeepAnalysis', '基本面分析和风险评估需要Pro会员权限');
          return;
        }
      }
      
      this.startAnalysis(type);
    }
  },

  // 开始分析
  startAnalysis: function (analysisType) {
    this.setData({
      isAnalyzing: true
    });

    // 添加用户选择消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `请进行${analysisType.name}：${this.data.selectedStock}`,
      timestamp: new Date().toLocaleTimeString()
    };

    this.addMessage(userMessage);

    // 模拟AI分析过程
    setTimeout(() => {
      this.simulateAIResponse(analysisType);
    }, 1500);
  },

  // 模拟AI响应
  simulateAIResponse: function (analysisType) {
    const responses = {
      technical: `${analysisType.icon} 技术分析结果：\n\n• RSI指标显示超买状态\n• MACD出现金叉信号\n• 支撑位：$170，阻力位：$180\n• 建议：短期谨慎，中期看涨`,
      fundamental: `${analysisType.icon} 基本面分析结果：\n\n• P/E比率：28.5（行业平均25.2）\n• 营收增长率：8.2%\n• 净利润率：25.3%\n• 建议：基本面良好，适合长期持有`,
      sentiment: `${analysisType.icon} 情绪分析结果：\n\n• 市场情绪：中性偏乐观\n• 新闻情绪得分：7.2/10\n• 社交媒体提及量：↑15%\n• 建议：市场情绪支撑股价`,
      risk: `${analysisType.icon} 风险评估结果：\n\n• 波动率：22.5%（中等）\n• Beta系数：1.15\n• 最大回撤：-12.3%\n• 建议：风险可控，适合稳健投资者`
    };

    const aiMessage = {
      id: Date.now(),
      type: 'ai',
      content: responses[analysisType.id] || '分析完成，请查看结果。',
      timestamp: new Date().toLocaleTimeString(),
      analysisType: analysisType
    };

    this.addMessage(aiMessage);
    this.setData({
      isAnalyzing: false
    });
  },

  // 添加消息
  addMessage: function (message) {
    const messages = [...this.data.messages, message];
    this.setData({
      messages: messages
    });
    
    // 滚动到底部
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  },

  // 滚动到底部
  scrollToBottom: function () {
    wx.createSelectorQuery().select('.message-list').boundingClientRect((rect) => {
      if (rect) {
        wx.pageScrollTo({
          scrollTop: rect.bottom,
          duration: 300
        });
      }
    }).exec();
  },

  // 输入框输入
  onInputChange: function (e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 发送消息
  onSendMessage: async function () {
    const content = this.data.inputValue.trim();
    if (!content) return;

    // 检查AI报告使用限制
    const dailyLimit = await checkLimit('aiReportsPerDay');
    const monthlyLimit = await checkLimit('aiReportsPerMonth');
    
    if (!dailyLimit.canUse) {
      showLimitPrompt('aiReportsPerDay', dailyLimit);
      return;
    }
    
    if (!monthlyLimit.canUse) {
      showLimitPrompt('aiReportsPerMonth', monthlyLimit);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content,
      timestamp: new Date().toLocaleTimeString()
    };

    this.addMessage(userMessage);
    this.setData({
      inputValue: ''
    });

    // 模拟AI回复
    setTimeout(() => {
      const aiMessage = {
        id: Date.now(),
        type: 'ai',
        content: `收到您的问题："${content}"\n\n正在为您分析，请稍候...`,
        timestamp: new Date().toLocaleTimeString()
      };
      this.addMessage(aiMessage);
    }, 500);
  }
});