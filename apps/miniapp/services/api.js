// services/api.js
const { get, post, put, delete: del } = require('../utils/request');

// API 服务封装
const api = {
  // 认证相关 API
  auth: {
    // 微信登录
    wxLogin(data) {
      return post('/api/auth/wx-login', data);
    },

    // 手机号登录
    phoneLogin(data) {
      return post('/api/auth/phone-login', data);
    },

    // 发送验证码
    sendVerifyCode(phoneNumber) {
      return post('/api/auth/send-verify-code', { phoneNumber });
    },

    // 退出登录
    logout() {
      return post('/api/auth/logout');
    },

    // 验证 token
    validateToken() {
      return get('/api/auth/validate-token');
    },

    // 刷新 token
    refreshToken(refreshToken) {
      return post('/api/auth/refresh-token', { refreshToken });
    },
  },

  // 用户相关 API
  user: {
    // 获取用户信息
    getProfile() {
      return get('/api/user/profile');
    },

    // 更新用户信息
    updateProfile(data) {
      return put('/api/user/profile', data);
    },

    // 绑定手机号
    bindPhone(data) {
      return post('/api/user/bind-phone', data);
    },

    // 获取用户设置
    getSettings() {
      return get('/api/user/settings');
    },

    // 更新用户设置
    updateSettings(data) {
      return put('/api/user/settings', data);
    },
  },

  // 股票相关 API
  stock: {
    // 获取股票列表
    getList(params = {}) {
      return get('/api/stocks', params);
    },

    // 搜索股票
    search(keyword) {
      return get('/api/stocks/search', { keyword });
    },

    // 获取股票详情
    getDetail(symbol) {
      return get(`/api/stocks/${symbol}`);
    },

    // 获取股票价格
    getPrice(symbol) {
      return get(`/api/stocks/${symbol}/price`);
    },

    // 获取股票K线数据
    getKline(symbol, period = '1d', limit = 100) {
      return get(`/api/stocks/${symbol}/kline`, { period, limit });
    },

    // 获取股票新闻
    getNews(symbol, page = 1, limit = 20) {
      return get(`/api/stocks/${symbol}/news`, { page, limit });
    },

    // 获取热门股票
    getHotStocks() {
      return get('/api/stocks/hot');
    },

    // 获取涨跌幅排行
    getRanking(type = 'gainers') {
      return get('/api/stocks/ranking', { type });
    },
  },

  // 市场相关 API
  market: {
    // 获取市场概览
    getOverview() {
      return get('/api/market/overview');
    },

    // 获取市场指数
    getIndices() {
      return get('/api/market/indices');
    },

    // 获取板块数据
    getSectors() {
      return get('/api/market/sectors');
    },

    // 获取市场新闻
    getNews(page = 1, limit = 20) {
      return get('/api/market/news', { page, limit });
    },
  },

  // 自选股相关 API
  watchlist: {
    // 获取自选股列表
    getList() {
      return get('/api/watchlist');
    },

    // 添加自选股
    add(symbol) {
      return post('/api/watchlist', { symbol });
    },

    // 删除自选股
    remove(symbol) {
      return del(`/api/watchlist/${symbol}`);
    },

    // 检查是否已添加
    check(symbol) {
      return get(`/api/watchlist/check/${symbol}`);
    },
  },

  // AI 分析相关 API
  ai: {
    // 技术分析
    technicalAnalysis(symbol) {
      return post('/api/ai/technical-analysis', { symbol });
    },

    // 基本面分析
    fundamentalAnalysis(symbol) {
      return post('/api/ai/fundamental-analysis', { symbol });
    },

    // 情绪分析
    sentimentAnalysis(symbol) {
      return post('/api/ai/sentiment-analysis', { symbol });
    },

    // 风险评估
    riskAssessment(symbol) {
      return post('/api/ai/risk-assessment', { symbol });
    },

    // 获取分析历史
    getHistory(page = 1, limit = 20) {
      return get('/api/ai/history', { page, limit });
    },
  },

  // 订阅消息相关 API
  subscription: {
    // 获取订阅列表
    getList() {
      return get('/api/subscriptions');
    },

    // 创建价格提醒订阅
    createPriceAlert(data) {
      return post('/api/subscriptions/price-alert', data);
    },

    // 创建AI报告订阅
    createAiReport(data) {
      return post('/api/subscriptions/ai-report', data);
    },

    // 更新订阅状态
    updateStatus(id, status) {
      return put(`/api/subscriptions/${id}`, { status });
    },

    // 删除订阅
    delete(id) {
      return del(`/api/subscriptions/${id}`);
    },

    // 获取订阅模板
    getTemplates() {
      return get('/api/subscriptions/templates');
    },
  },

  // 通用 API
  common: {
    // 上传文件
    upload(filePath, options = {}) {
      const { upload } = require('../utils/request');
      return upload('/api/upload', filePath, options);
    },

    // 获取配置信息
    getConfig() {
      return get('/api/config');
    },

    // 反馈建议
    feedback(data) {
      return post('/api/feedback', data);
    },

    // 检查更新
    checkUpdate() {
      return get('/api/version/check');
    },
  },
};

module.exports = {
  api,
};
