// services/cache.js
const { storage } = require('../utils/storage');

// 缓存管理服务
class CacheManager {
  constructor() {
    this.cachePrefix = 'cache_';
    this.defaultExpire = 5 * 60 * 1000; // 默认5分钟过期
  }

  // 生成缓存键
  generateKey(key) {
    return `${this.cachePrefix}${key}`;
  }

  // 设置缓存
  set(key, data, expire = this.defaultExpire) {
    const cacheKey = this.generateKey(key);
    const cacheData = {
      data,
      timestamp: Date.now(),
      expire,
    };

    storage.set(cacheKey, cacheData);
  }

  // 获取缓存
  get(key) {
    const cacheKey = this.generateKey(key);
    const cacheData = storage.get(cacheKey);

    if (!cacheData) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - cacheData.timestamp > cacheData.expire) {
      // 缓存已过期，删除并返回null
      this.remove(key);
      return null;
    }

    return cacheData.data;
  }

  // 删除缓存
  remove(key) {
    const cacheKey = this.generateKey(key);
    storage.remove(cacheKey);
  }

  // 清除所有缓存
  clear() {
    const keys = storage.getKeys();
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        storage.remove(key);
      }
    });
  }

  // 清除过期缓存
  clearExpired() {
    const keys = storage.getKeys();
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        const cacheData = storage.get(key);
        if (cacheData && now - cacheData.timestamp > cacheData.expire) {
          storage.remove(key);
        }
      }
    });
  }

  // 获取缓存大小
  getSize() {
    const keys = storage.getKeys();
    return keys.filter(key => key.startsWith(this.cachePrefix)).length;
  }

  // 检查缓存是否存在且未过期
  has(key) {
    return this.get(key) !== null;
  }
}

// 创建缓存管理实例
const cache = new CacheManager();

// 缓存装饰器函数
function withCache(cacheKey, expire) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      // 生成动态缓存键
      const dynamicKey =
        typeof cacheKey === 'function'
          ? cacheKey(...args)
          : `${cacheKey}_${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cachedResult = cache.get(dynamicKey);
      if (cachedResult !== null) {
        console.log(`缓存命中: ${dynamicKey}`);
        return cachedResult;
      }

      // 缓存未命中，执行原方法
      try {
        const result = await originalMethod.apply(this, args);

        // 将结果存入缓存
        cache.set(dynamicKey, result, expire);
        console.log(`缓存存储: ${dynamicKey}`);

        return result;
      } catch (error) {
        console.error(`方法执行失败: ${propertyKey}`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

// 预定义的缓存策略
const CacheStrategies = {
  // 短期缓存 (1分钟)
  SHORT: 1 * 60 * 1000,

  // 中期缓存 (5分钟)
  MEDIUM: 5 * 60 * 1000,

  // 长期缓存 (30分钟)
  LONG: 30 * 60 * 1000,

  // 股票价格缓存 (30秒)
  STOCK_PRICE: 30 * 1000,

  // 股票详情缓存 (2分钟)
  STOCK_DETAIL: 2 * 60 * 1000,

  // 市场数据缓存 (1分钟)
  MARKET_DATA: 1 * 60 * 1000,

  // 用户信息缓存 (10分钟)
  USER_INFO: 10 * 60 * 1000,

  // AI分析结果缓存 (5分钟)
  AI_ANALYSIS: 5 * 60 * 1000,
};

// 缓存键生成器
const CacheKeys = {
  // 股票相关
  stockList: params => `stock_list_${JSON.stringify(params)}`,
  stockDetail: symbol => `stock_detail_${symbol}`,
  stockPrice: symbol => `stock_price_${symbol}`,
  stockKline: (symbol, period, limit) =>
    `stock_kline_${symbol}_${period}_${limit}`,
  stockNews: (symbol, page) => `stock_news_${symbol}_${page}`,

  // 市场相关
  marketOverview: () => 'market_overview',
  marketIndices: () => 'market_indices',
  marketSectors: () => 'market_sectors',
  marketNews: page => `market_news_${page}`,

  // 自选股相关
  watchlist: () => 'watchlist',

  // AI分析相关
  aiAnalysis: (type, symbol) => `ai_${type}_${symbol}`,
  aiHistory: page => `ai_history_${page}`,

  // 用户相关
  userProfile: () => 'user_profile',
  userSettings: () => 'user_settings',
};

// 自动清理过期缓存
setInterval(
  () => {
    cache.clearExpired();
  },
  10 * 60 * 1000
); // 每10分钟清理一次

module.exports = {
  cache,
  withCache,
  CacheStrategies,
  CacheKeys,
};
