// pages/watchlist/watchlist.js
const app = getApp();
const { request } = require('../../utils/request');
const { auth } = require('../../utils/auth');
const {
  featureGate,
  checkLimit,
  showLimitPrompt,
  getUserSubscription,
} = require('../../utils/featureGate');

Page({
  data: {
    loading: false,
    refreshing: false,
    isLogin: false,

    // 错误状态
    error: false,
    errorType: 'network',
    errorTitle: '网络连接失败',
    errorDescription: '请检查网络连接后重试',

    // 自选股票列表
    watchlist: [],

    // 编辑模式
    editMode: false,
    selectedStocks: [], // 选中的股票代码

    // 排序
    sortField: 'changePercent', // price, change, changePercent, addTime
    sortOrder: 'desc', // asc, desc
  },

  onLoad(options) {
    console.log('Watchlist page loaded');
    this.checkLoginAndLoadData();
    this.loadSubscriptionInfo();
  },

  onShow() {
    console.log('Watchlist page shown');
    // 页面显示时检查登录状态并刷新数据
    this.checkLoginAndLoadData();
    this.loadSubscriptionInfo();
  },

  onReady() {
    console.log('Watchlist page ready');
  },

  onHide() {
    console.log('Watchlist page hidden');
    // 退出编辑模式
    if (this.data.editMode) {
      this.exitEditMode();
    }
  },

  onUnload() {
    console.log('Watchlist page unloaded');
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '古灵通 - 我的自选股',
      path: '/pages/watchlist/watchlist',
    };
  },

  onShareTimeline() {
    return {
      title: '古灵通 - 我的自选股',
    };
  },

  // 检查登录状态并加载数据
  async checkLoginAndLoadData() {
    try {
      const isLogin = await auth.checkLoginStatus();
      this.setData({ isLogin });

      if (isLogin) {
        await this.loadWatchlist();
      } else {
        this.setData({ loading: false });
      }
    } catch (error) {
      console.error('Check login error:', error);
      this.setData({ loading: false, isLogin: false });
    }
  },

  // 加载自选股列表
  async loadWatchlist() {
    try {
      this.setData({ loading: true, error: false });

      const response = await request.get('/api/watchlist', {
        sortField: this.data.sortField,
        sortOrder: this.data.sortOrder,
      });

      if (response.success) {
        this.setData({
          watchlist: response.data || [],
          loading: false,
        });
      } else {
        this.setData({
          loading: false,
          error: true,
          errorType: 'server',
          errorTitle: '服务器错误',
          errorDescription:
            response.message || '服务器暂时无法响应，请稍后重试',
        });
      }
    } catch (error) {
      console.error('Load watchlist error:', error);
      let errorType = 'network';
      let errorTitle = '网络连接失败';
      let errorDescription = '请检查网络连接后重试';

      if (!navigator.onLine) {
        errorType = 'offline';
        errorTitle = '网络已断开';
        errorDescription = '请检查网络连接后重试';
      } else if (error.message && error.message.includes('timeout')) {
        errorType = 'timeout';
        errorTitle = '请求超时';
        errorDescription = '网络响应较慢，请稍后重试';
      }

      this.setData({
        loading: false,
        error: true,
        errorType,
        errorTitle,
        errorDescription,
      });
    }
  },

  // 刷新数据
  async refreshData() {
    try {
      this.setData({ refreshing: true, error: false });

      if (this.data.isLogin) {
        await this.loadWatchlist();
        app.showToast('刷新成功');
      }
    } catch (error) {
      console.error('Refresh data error:', error);
      let errorType = 'network';
      let errorTitle = '刷新失败';
      let errorDescription = '请检查网络连接后重试';

      if (!navigator.onLine) {
        errorType = 'offline';
        errorTitle = '网络已断开';
        errorDescription = '请检查网络连接后重试';
      } else if (error.message && error.message.includes('timeout')) {
        errorType = 'timeout';
        errorTitle = '请求超时';
        errorDescription = '网络响应较慢，请稍后重试';
      }

      this.setData({
        error: true,
        errorType,
        errorTitle,
        errorDescription,
      });
    } finally {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  // 登录
  onLoginTap() {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  // 搜索添加股票
  async onAddStockTap() {
    // 检查自选股数量限制
    const limitCheck = await checkLimit('watchlistLimit');
    if (!limitCheck.canUse) {
      showLimitPrompt('watchlistLimit', limitCheck);
      return;
    }

    wx.navigateTo({
      url: '/pages/search/search?from=watchlist',
    });
  },

  // 进入编辑模式
  enterEditMode() {
    this.setData({
      editMode: true,
      selectedStocks: [],
    });
  },

  // 退出编辑模式
  exitEditMode() {
    this.setData({
      editMode: false,
      selectedStocks: [],
    });
  },

  // 选择/取消选择股票
  onSelectStock(e) {
    const code = e.currentTarget.dataset.code;
    const selectedStocks = [...this.data.selectedStocks];
    const index = selectedStocks.indexOf(code);

    if (index > -1) {
      selectedStocks.splice(index, 1);
    } else {
      selectedStocks.push(code);
    }

    this.setData({ selectedStocks });
  },

  // 全选/取消全选
  onSelectAll() {
    const allCodes = this.data.watchlist.map(item => item.code);
    const isAllSelected = this.data.selectedStocks.length === allCodes.length;

    this.setData({
      selectedStocks: isAllSelected ? [] : allCodes,
    });
  },

  // 删除选中的股票
  async onDeleteSelected() {
    if (this.data.selectedStocks.length === 0) {
      app.showToast('请选择要删除的股票');
      return;
    }

    try {
      const result = await app.showModal(
        '确认删除',
        `确定要删除选中的 ${this.data.selectedStocks.length} 只股票吗？`
      );
      if (!result.confirm) return;

      const response = await request.delete('/api/watchlist/batch', {
        codes: this.data.selectedStocks,
      });

      if (response.success) {
        app.showToast('删除成功');
        this.exitEditMode();
        await this.loadWatchlist();
      } else {
        app.showToast(response.message || '删除失败', 'error');
      }
    } catch (error) {
      console.error('Delete stocks error:', error);
      app.showToast('删除失败，请重试', 'error');
    }
  },

  // 排序
  onSort(e) {
    const field = e.currentTarget.dataset.field;
    let order = 'desc';

    // 如果点击的是当前排序字段，切换排序方向
    if (field === this.data.sortField) {
      order = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }

    this.setData({
      sortField: field,
      sortOrder: order,
    });

    this.loadWatchlist();
  },

  // 点击股票
  onStockTap(e) {
    if (this.data.editMode) {
      this.onSelectStock(e);
    } else {
      const code = e.currentTarget.dataset.code;
      wx.navigateTo({
        url: `/pages/stock-detail/stock-detail?code=${code}`,
      });
    }
  },

  // 删除单个股票
  async onDeleteStock(e) {
    e.stopPropagation();
    const code = e.currentTarget.dataset.code;
    const stock = this.data.watchlist.find(item => item.code === code);

    try {
      const result = await app.showModal(
        '确认删除',
        `确定要删除 ${stock.name}(${stock.code}) 吗？`
      );
      if (!result.confirm) return;

      const response = await request.delete(`/api/watchlist/${code}`);

      if (response.success) {
        app.showToast('删除成功');
        await this.loadWatchlist();
      } else {
        app.showToast(response.message || '删除失败', 'error');
      }
    } catch (error) {
      console.error('Delete stock error:', error);
      app.showToast('删除失败，请重试', 'error');
    }
  },

  // 格式化价格
  formatPrice(price) {
    if (!price) return '0.00';
    return parseFloat(price).toFixed(2);
  },

  // 格式化涨跌幅
  formatChangePercent(percent) {
    if (!percent) return '0.00%';
    const value = parseFloat(percent);
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  },

  // 格式化涨跌额
  formatChange(change) {
    if (!change) return '0.00';
    const value = parseFloat(change);
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}`;
  },

  // 格式化时间
  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) {
      // 1小时内
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      // 1天内
      return Math.floor(diff / 3600000) + '小时前';
    } else {
      return date.toLocaleDateString();
    }
  },

  // 获取涨跌颜色类名
  getChangeColorClass(change) {
    const value = parseFloat(change);
    if (value > 0) return 'stock-up';
    if (value < 0) return 'stock-down';
    return 'stock-flat';
  },

  // 获取排序图标
  getSortIcon(field) {
    if (field !== this.data.sortField) return '';
    return this.data.sortOrder === 'desc' ? '↓' : '↑';
  },

  // 检查股票是否被选中
  isStockSelected(code) {
    return this.data.selectedStocks.includes(code);
  },

  // 加载订阅信息
  async loadSubscriptionInfo() {
    try {
      const subscription = await getUserSubscription();
      this.setData({ subscription });
    } catch (error) {
      console.error('Load subscription info error:', error);
    }
  },

  // 处理重试
  handleRetry: function () {
    console.log('重试加载自选股数据');
    this.checkLoginAndLoadData();
  },

  // 处理刷新
  handleRefresh: function () {
    console.log('刷新自选股数据');
    this.refreshData();
  },
});
