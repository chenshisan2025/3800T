// pages/market/market.js
const app = getApp()
const { request } = require('../../utils/request')

Page({
  data: {
    loading: true,
    refreshing: false,
    currentTab: 0, // 0: 沪深, 1: 港股, 2: 美股
    tabs: ['沪深', '港股', '美股'],
    
    // 市场数据
    marketData: {
      sh: { name: '上证指数', code: '000001', price: 0, change: 0, changePercent: 0 },
      sz: { name: '深证成指', code: '399001', price: 0, change: 0, changePercent: 0 },
      cy: { name: '创业板指', code: '399006', price: 0, change: 0, changePercent: 0 }
    },
    
    // 股票列表
    stockList: [],
    
    // 排序
    sortField: 'changePercent', // price, change, changePercent, volume
    sortOrder: 'desc', // asc, desc
    
    // 分页
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad(options) {
    console.log('Market page loaded')
    this.loadData()
  },

  onShow() {
    console.log('Market page shown')
    // 页面显示时刷新数据
    if (!this.data.loading) {
      this.refreshData()
    }
  },

  onReady() {
    console.log('Market page ready')
  },

  onHide() {
    console.log('Market page hidden')
  },

  onUnload() {
    console.log('Market page unloaded')
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreStocks()
    }
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '古灵通 - 实时行情',
      path: '/pages/market/market'
    }
  },

  onShareTimeline() {
    return {
      title: '古灵通 - 实时行情'
    }
  },

  // 加载数据
  async loadData() {
    try {
      this.setData({ loading: true })
      
      // 并行加载市场数据和股票列表
      await Promise.all([
        this.loadMarketData(),
        this.loadStockList(true)
      ])
      
    } catch (error) {
      console.error('Load data error:', error)
      app.showToast('加载失败，请重试', 'error')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新数据
  async refreshData() {
    try {
      this.setData({ refreshing: true })
      
      await Promise.all([
        this.loadMarketData(),
        this.loadStockList(true)
      ])
      
      app.showToast('刷新成功')
    } catch (error) {
      console.error('Refresh data error:', error)
      app.showToast('刷新失败', 'error')
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }
  },

  // 加载市场数据
  async loadMarketData() {
    try {
      const response = await request.get('/api/market/overview')
      if (response.success) {
        this.setData({
          marketData: response.data
        })
      }
    } catch (error) {
      console.error('Load market data error:', error)
    }
  },

  // 加载股票列表
  async loadStockList(reset = false) {
    try {
      const page = reset ? 1 : this.data.page
      const market = this.getMarketCode()
      
      const response = await request.get('/api/stocks', {
        market,
        page,
        pageSize: this.data.pageSize,
        sortField: this.data.sortField,
        sortOrder: this.data.sortOrder
      })
      
      if (response.success) {
        const newStocks = response.data.list || []
        const stockList = reset ? newStocks : [...this.data.stockList, ...newStocks]
        
        this.setData({
          stockList,
          page: page + 1,
          hasMore: newStocks.length === this.data.pageSize
        })
      }
    } catch (error) {
      console.error('Load stock list error:', error)
    }
  },

  // 加载更多股票
  async loadMoreStocks() {
    await this.loadStockList(false)
  },

  // 切换标签
  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    if (index !== this.data.currentTab) {
      this.setData({
        currentTab: index,
        page: 1,
        stockList: [],
        hasMore: true
      })
      this.loadStockList(true)
    }
  },

  // 排序
  onSort(e) {
    const field = e.currentTarget.dataset.field
    let order = 'desc'
    
    // 如果点击的是当前排序字段，切换排序方向
    if (field === this.data.sortField) {
      order = this.data.sortOrder === 'desc' ? 'asc' : 'desc'
    }
    
    this.setData({
      sortField: field,
      sortOrder: order,
      page: 1,
      stockList: [],
      hasMore: true
    })
    
    this.loadStockList(true)
  },

  // 搜索
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 点击市场指数
  onMarketTap(e) {
    const code = e.currentTarget.dataset.code
    wx.navigateTo({
      url: `/pages/stock-detail/stock-detail?code=${code}`
    })
  },

  // 点击股票
  onStockTap(e) {
    const code = e.currentTarget.dataset.code
    wx.navigateTo({
      url: `/pages/stock-detail/stock-detail?code=${code}`
    })
  },

  // 获取市场代码
  getMarketCode() {
    const marketCodes = ['cn', 'hk', 'us']
    return marketCodes[this.data.currentTab] || 'cn'
  },

  // 格式化价格
  formatPrice(price) {
    if (!price) return '0.00'
    return parseFloat(price).toFixed(2)
  },

  // 格式化涨跌幅
  formatChangePercent(percent) {
    if (!percent) return '0.00%'
    const value = parseFloat(percent)
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  },

  // 格式化涨跌额
  formatChange(change) {
    if (!change) return '0.00'
    const value = parseFloat(change)
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}`
  },

  // 格式化成交量
  formatVolume(volume) {
    if (!volume) return '0'
    const num = parseInt(volume)
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '亿'
    } else if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  },

  // 获取涨跌颜色类名
  getChangeColorClass(change) {
    const value = parseFloat(change)
    if (value > 0) return 'stock-up'
    if (value < 0) return 'stock-down'
    return 'stock-flat'
  },

  // 获取排序图标
  getSortIcon(field) {
    if (field !== this.data.sortField) return ''
    return this.data.sortOrder === 'desc' ? '↓' : '↑'
  }
})