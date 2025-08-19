// pages/index/index.js
const { request } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    // 轮播图数据
    banners: [],
    
    // 市场概览数据
    marketOverview: {
      sh: { name: '上证指数', code: '000001', price: 0, change: 0, changePercent: 0 },
      sz: { name: '深证成指', code: '399001', price: 0, change: 0, changePercent: 0 },
      cy: { name: '创业板指', code: '399006', price: 0, change: 0, changePercent: 0 }
    },
    
    // 热门股票
    hotStocks: [],
    
    // 最新资讯
    news: [],
    
    // 加载状态
    loading: true,
    refreshing: false,
    
    // 轮播图当前索引
    currentBannerIndex: 0
  },

  onLoad(options) {
    console.log('首页加载', options)
    this.loadData()
  },

  onShow() {
    console.log('首页显示')
    // 如果数据为空，重新加载
    if (this.data.hotStocks.length === 0) {
      this.loadData()
    }
  },

  onReady() {
    console.log('首页渲染完成')
  },

  onHide() {
    console.log('首页隐藏')
  },

  onUnload() {
    console.log('首页卸载')
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新')
    this.refreshData()
  },

  // 上拉加载更多
  onReachBottom() {
    console.log('上拉加载更多')
    this.loadMoreNews()
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '古灵通 - 专业的股票投资平台',
      path: '/pages/index/index',
      imageUrl: '/images/share-logo.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '古灵通 - 专业的股票投资平台',
      imageUrl: '/images/share-logo.png'
    }
  },

  // 加载数据
  async loadData() {
    try {
      this.setData({ loading: true })
      
      // 并行加载所有数据
      const [banners, marketData, hotStocks, news] = await Promise.all([
        this.loadBanners(),
        this.loadMarketOverview(),
        this.loadHotStocks(),
        this.loadNews()
      ])
      
      this.setData({
        banners,
        marketOverview: marketData,
        hotStocks,
        news,
        loading: false
      })
    } catch (error) {
      console.error('加载数据失败', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 刷新数据
  async refreshData() {
    try {
      this.setData({ refreshing: true })
      
      await this.loadData()
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('刷新数据失败', error)
      
      wx.showToast({
        title: '刷新失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }
  },

  // 加载轮播图
  async loadBanners() {
    try {
      const banners = await request({
        url: '/api/banners',
        method: 'GET',
        loading: false
      })
      
      return banners || []
    } catch (error) {
      console.error('加载轮播图失败', error)
      return []
    }
  },

  // 加载市场概览
  async loadMarketOverview() {
    try {
      const data = await request({
        url: '/api/market/overview',
        method: 'GET',
        loading: false
      })
      
      return data || this.data.marketOverview
    } catch (error) {
      console.error('加载市场概览失败', error)
      return this.data.marketOverview
    }
  },

  // 加载热门股票
  async loadHotStocks() {
    try {
      const stocks = await request({
        url: '/api/stocks/hot',
        method: 'GET',
        loading: false
      })
      
      return stocks || []
    } catch (error) {
      console.error('加载热门股票失败', error)
      return []
    }
  },

  // 加载资讯
  async loadNews() {
    try {
      const news = await request({
        url: '/api/news',
        method: 'GET',
        data: {
          page: 1,
          limit: 10
        },
        loading: false
      })
      
      return news || []
    } catch (error) {
      console.error('加载资讯失败', error)
      return []
    }
  },

  // 加载更多资讯
  async loadMoreNews() {
    try {
      const currentNews = this.data.news
      const page = Math.floor(currentNews.length / 10) + 1
      
      const moreNews = await request({
        url: '/api/news',
        method: 'GET',
        data: {
          page,
          limit: 10
        },
        loading: false
      })
      
      if (moreNews && moreNews.length > 0) {
        this.setData({
          news: [...currentNews, ...moreNews]
        })
      } else {
        wx.showToast({
          title: '没有更多数据了',
          icon: 'none',
          duration: 1500
        })
      }
    } catch (error) {
      console.error('加载更多资讯失败', error)
      
      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 轮播图切换
  onBannerChange(e) {
    this.setData({
      currentBannerIndex: e.detail.current
    })
  },

  // 点击轮播图
  onBannerTap(e) {
    const { index } = e.currentTarget.dataset
    const banner = this.data.banners[index]
    
    if (banner && banner.url) {
      if (banner.type === 'page') {
        // 跳转到小程序页面
        wx.navigateTo({
          url: banner.url
        })
      } else if (banner.type === 'webview') {
        // 跳转到 webview 页面
        wx.navigateTo({
          url: `/pages/webview/webview?url=${encodeURIComponent(banner.url)}`
        })
      }
    }
  },

  // 点击市场指数
  onMarketTap(e) {
    const { code } = e.currentTarget.dataset
    
    wx.navigateTo({
      url: `/pages/stock-detail/stock-detail?code=${code}`
    })
  },

  // 点击热门股票
  onStockTap(e) {
    const { code } = e.currentTarget.dataset
    
    wx.navigateTo({
      url: `/pages/stock-detail/stock-detail?code=${code}`
    })
  },

  // 点击资讯
  onNewsTap(e) {
    const { id } = e.currentTarget.dataset
    
    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${id}`
    })
  },

  // 搜索股票
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 查看更多热门股票
  onMoreHotStocks() {
    wx.switchTab({
      url: '/pages/market/market'
    })
  },

  // 查看更多资讯
  onMoreNews() {
    wx.navigateTo({
      url: '/pages/news/news'
    })
  },

  // 格式化价格
  formatPrice(price) {
    if (typeof price !== 'number') return '0.00'
    return price.toFixed(2)
  },

  // 格式化涨跌幅
  formatChangePercent(percent) {
    if (typeof percent !== 'number') return '0.00%'
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  },

  // 获取涨跌颜色类名
  getChangeColorClass(change) {
    if (change > 0) return 'error-color' // 红涨
    if (change < 0) return 'success-color' // 绿跌
    return 'text-muted'
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return `${date.getMonth() + 1}-${date.getDate()}`
    }
  }
})