// pages/asset/asset.js
Page({
  data: {
    loading: false,
    refreshing: false,
    error: false,
    errorType: 'network',
    errorTitle: '',
    errorDescription: '',
    stocks: [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        price: '175.43',
        change: '+2.15',
        changePercent: '+1.24%',
        isUp: true,
      },
      {
        symbol: 'TSLA',
        name: '特斯拉',
        price: '248.50',
        change: '-3.20',
        changePercent: '-1.27%',
        isUp: false,
      },
      {
        symbol: 'NVDA',
        name: '英伟达',
        price: '875.28',
        change: '+15.60',
        changePercent: '+1.81%',
        isUp: true,
      },
    ],
    searchValue: '',
  },

  onLoad: function (options) {
    console.log('个股页面加载');
    this.loadStockData();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.loadStockData();
  },

  // 加载股票数据
  loadStockData: function () {
    this.setData({
      loading: true,
      error: false,
    });

    // 模拟API请求
    setTimeout(() => {
      try {
        // 模拟成功加载
        console.log('股票数据加载完成');
        this.setData({ loading: false });
      } catch (error) {
        console.error('加载股票数据失败:', error);
        this.setData({
          loading: false,
          error: true,
          errorType: 'network',
          errorTitle: '加载失败',
          errorDescription: '请检查网络连接后重试',
        });
      }
    }, 1000);
  },

  // 搜索股票
  onSearchInput: function (e) {
    this.setData({
      searchValue: e.detail.value,
    });
  },

  // 搜索确认
  onSearchConfirm: function (e) {
    const keyword = e.detail.value;
    if (keyword.trim()) {
      console.log('搜索股票:', keyword);
      // TODO: 实现搜索功能
    }
  },

  // 点击股票项
  onStockTap: function (e) {
    const symbol = e.currentTarget.dataset.symbol;
    wx.navigateTo({
      url: `/pages/stock-detail/stock-detail?symbol=${symbol}`,
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({ refreshing: true });
    this.loadStockData();
    setTimeout(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 处理重试
  handleRetry: function () {
    console.log('重试加载股票数据');
    this.loadStockData();
  },

  // 处理刷新
  handleRefresh: function () {
    console.log('刷新股票数据');
    this.setData({ refreshing: true });
    this.loadStockData();
    setTimeout(() => {
      this.setData({ refreshing: false });
    }, 1000);
  },
});
