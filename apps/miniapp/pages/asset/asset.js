// pages/asset/asset.js
Page({
  data: {
    stocks: [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        price: '175.43',
        change: '+2.15',
        changePercent: '+1.24%',
        isUp: true
      },
      {
        symbol: 'TSLA',
        name: '特斯拉',
        price: '248.50',
        change: '-3.20',
        changePercent: '-1.27%',
        isUp: false
      },
      {
        symbol: 'NVDA',
        name: '英伟达',
        price: '875.28',
        change: '+15.60',
        changePercent: '+1.81%',
        isUp: true
      }
    ],
    searchValue: ''
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
    wx.showLoading({
      title: '加载中...'
    });

    // 模拟API请求
    setTimeout(() => {
      wx.hideLoading();
      console.log('股票数据加载完成');
    }, 1000);
  },

  // 搜索股票
  onSearchInput: function (e) {
    this.setData({
      searchValue: e.detail.value
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
      url: `/pages/stock-detail/stock-detail?symbol=${symbol}`
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadStockData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});