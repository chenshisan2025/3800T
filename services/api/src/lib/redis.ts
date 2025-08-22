import { createClient, RedisClientType } from 'redis';

// Redis客户端实例
let redisClient: RedisClientType | null = null;

// Redis配置
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 60000,
    lazyConnect: true,
  },
  // 连接池配置
  isolationPoolOptions: {
    min: 2,
    max: 10,
  },
};

// 缓存键前缀
export const CACHE_KEYS = {
  STOCK_PRICE: 'stock:price',
  SCAN_STATS: 'scan:stats',
  DAILY_STATS: 'stats:daily',
  WEEKLY_STATS: 'stats:weekly',
  MONTHLY_STATS: 'stats:monthly',
  HOT_STOCKS: 'stocks:hot',
  PERFORMANCE: 'perf',
  RATE_LIMIT: 'rate_limit',
  RATE_LIMIT_CONFIG: 'rate_limit:config',
  SENTRY_CONFIG: 'sentry:config',
} as const;

// 缓存过期时间（秒）
export const CACHE_TTL = {
  STOCK_PRICE: 60, // 1分钟
  SCAN_STATS: 3600, // 1小时
  DAILY_STATS: 86400, // 1天
  WEEKLY_STATS: 604800, // 7天
  MONTHLY_STATS: 2592000, // 30天
  HOT_STOCKS: 300, // 5分钟
  PERFORMANCE: 1800, // 30分钟
  RATE_LIMIT: 60, // 1分钟（限流窗口）
  DEFAULT: 300, // 5分钟
};

/**
 * 获取Redis客户端实例
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient(REDIS_CONFIG);

    // 错误处理
    redisClient.on('error', err => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    redisClient.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * 关闭Redis连接
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * 股价缓存操作
 */
export class StockPriceCache {
  /**
   * 设置股价缓存
   */
  static async set(symbol: string, price: number): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = `${CACHE_KEYS.STOCK_PRICE}:${symbol}`;
      const data = JSON.stringify({
        price,
        timestamp: Date.now(),
      });
      await client.setEx(key, CACHE_TTL.STOCK_PRICE, data);
    } catch (error) {
      console.error('Failed to set stock price cache:', error);
    }
  }

  /**
   * 获取股价缓存
   */
  static async get(
    symbol: string
  ): Promise<{ price: number; timestamp: number } | null> {
    try {
      const client = await getRedisClient();
      const key = `${CACHE_KEYS.STOCK_PRICE}:${symbol}`;
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get stock price cache:', error);
      return null;
    }
  }

  /**
   * 批量设置股价缓存
   */
  static async setMultiple(prices: Record<string, number>): Promise<void> {
    try {
      const client = await getRedisClient();
      const pipeline = client.multi();
      const timestamp = Date.now();

      Object.entries(prices).forEach(([symbol, price]) => {
        const key = `${CACHE_KEYS.STOCK_PRICE}:${symbol}`;
        const data = JSON.stringify({ price, timestamp });
        pipeline.setEx(key, CACHE_TTL.STOCK_PRICE, data);
      });

      await pipeline.exec();
    } catch (error) {
      console.error('Failed to set multiple stock price cache:', error);
    }
  }
}

/**
 * 扫描统计缓存类
 */
export class ScanStatsCache {
  private static readonly key = CACHE_KEYS.SCAN_STATS;

  static async set(stats: any): Promise<void> {
    const client = await getRedisClient();
    await client.setEx(this.key, CACHE_TTL.SCAN_STATS, JSON.stringify(stats));
  }

  static async get(): Promise<any | null> {
    const client = await getRedisClient();
    const data = await client.get(this.key);
    return data ? JSON.parse(data) : null;
  }

  static async increment(field: string, value: number = 1): Promise<void> {
    const client = await getRedisClient();
    await client.hIncrBy(this.key, field, value);
  }

  // 每日统计
  static async setDailyStats(date: string, stats: any): Promise<void> {
    const client = await getRedisClient();
    const key = `${CACHE_KEYS.SCAN_STATS}:daily:${date}`;
    await client.setEx(key, CACHE_TTL.DAILY_STATS, JSON.stringify(stats));
  }

  static async getDailyStats(date: string): Promise<any | null> {
    const client = await getRedisClient();
    const key = `${CACHE_KEYS.SCAN_STATS}:daily:${date}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 每周统计
  static async setWeeklyStats(week: string, stats: any): Promise<void> {
    const client = await getRedisClient();
    const key = `${CACHE_KEYS.SCAN_STATS}:weekly:${week}`;
    await client.setEx(key, CACHE_TTL.WEEKLY_STATS, JSON.stringify(stats));
  }

  static async getWeeklyStats(week: string): Promise<any | null> {
    const client = await getRedisClient();
    const key = `${CACHE_KEYS.SCAN_STATS}:weekly:${week}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 每月统计
  static async setMonthlyStats(month: string, stats: any): Promise<void> {
    const client = await getRedisClient();
    const key = `${CACHE_KEYS.SCAN_STATS}:monthly:${month}`;
    await client.setEx(key, CACHE_TTL.MONTHLY_STATS, JSON.stringify(stats));
  }

  static async getMonthlyStats(month: string): Promise<any | null> {
    const client = await getRedisClient();
    const key = `${CACHE_KEYS.SCAN_STATS}:monthly:${month}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 获取最近N天的统计数据
  static async getRecentDailyStats(days: number = 7): Promise<any[]> {
    const client = await getRedisClient();
    const results = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = await this.getDailyStats(dateStr);
      if (stats) {
        results.push({ date: dateStr, ...stats });
      }
    }

    return results.reverse();
  }
}

/**
 * 热门股票缓存操作
 */
export class HotStocksCache {
  /**
   * 添加热门股票
   */
  static async addHotStock(symbol: string, score: number = 1): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = CACHE_KEYS.HOT_STOCKS;
      await client.zIncrBy(key, score, symbol);
      await client.expire(key, CACHE_TTL.HOT_STOCKS);
    } catch (error) {
      console.error('Failed to add hot stock:', error);
    }
  }

  /**
   * 获取热门股票列表
   */
  static async getHotStocks(limit: number = 10): Promise<string[]> {
    try {
      const client = await getRedisClient();
      const key = CACHE_KEYS.HOT_STOCKS;
      return await client.zRange(key, 0, limit - 1, { REV: true });
    } catch (error) {
      console.error('Failed to get hot stocks:', error);
      return [];
    }
  }
}

/**
 * 性能监控缓存操作
 */
export class PerformanceCache {
  /**
   * 记录性能指标
   */
  static async recordMetric(
    metric: string,
    value: number,
    timestamp?: number
  ): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = `${CACHE_KEYS.PERFORMANCE}:${metric}`;
      const data = {
        value,
        timestamp: timestamp || Date.now(),
      };
      await client.setEx(key, CACHE_TTL.PERFORMANCE, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  /**
   * 获取性能指标
   */
  static async getMetric(
    metric: string
  ): Promise<{ value: number; timestamp: number } | null> {
    try {
      const client = await getRedisClient();
      const key = `${CACHE_KEYS.PERFORMANCE}:${metric}`;
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get performance metric:', error);
      return null;
    }
  }
}

/**
 * 通用缓存操作
 */
export class RedisCache {
  /**
   * 设置缓存
   */
  static async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const client = await getRedisClient();
      const data = JSON.stringify(value);
      if (ttl) {
        await client.setEx(key, ttl, data);
      } else {
        await client.set(key, data);
      }
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  /**
   * 获取缓存
   */
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  static async del(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(key);
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  }

  /**
   * 检查缓存是否存在
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Failed to check cache existence:', error);
      return false;
    }
  }
}

/**
 * 限流存储适配器
 */
export class RateLimitStore {
  /**
   * 增加计数器
   */
  static async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; ttl: number }> {
    try {
      const client = await getRedisClient();
      const fullKey = `${CACHE_KEYS.RATE_LIMIT}:${key}`;

      // 使用 MULTI 事务确保原子性
      const multi = client.multi();
      multi.incr(fullKey);
      multi.expire(fullKey, Math.ceil(windowMs / 1000));
      multi.ttl(fullKey);

      const results = await multi.exec();
      const count = results[0] as number;
      const ttl = results[2] as number;

      return { count, ttl };
    } catch (error) {
      console.error('Failed to increment rate limit counter:', error);
      throw error;
    }
  }

  /**
   * 获取当前计数
   */
  static async getCount(key: string): Promise<{ count: number; ttl: number }> {
    try {
      const client = await getRedisClient();
      const fullKey = `${CACHE_KEYS.RATE_LIMIT}:${key}`;

      const multi = client.multi();
      multi.get(fullKey);
      multi.ttl(fullKey);

      const results = await multi.exec();
      const count = parseInt((results[0] as string) || '0');
      const ttl = results[1] as number;

      return { count, ttl };
    } catch (error) {
      console.error('Failed to get rate limit count:', error);
      return { count: 0, ttl: 0 };
    }
  }

  /**
   * 重置计数器
   */
  static async reset(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const fullKey = `${CACHE_KEYS.RATE_LIMIT}:${key}`;
      await client.del(fullKey);
    } catch (error) {
      console.error('Failed to reset rate limit counter:', error);
    }
  }
}

/**
 * 限流配置管理
 */
export class RateLimitConfig {
  /**
   * 设置限流配置
   */
  static async setConfig(config: {
    userLimit: number;
    ipLimit: number;
    windowMs: number;
    enabled: boolean;
  }): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = CACHE_KEYS.RATE_LIMIT_CONFIG;
      await client.hSet(key, {
        userLimit: config.userLimit.toString(),
        ipLimit: config.ipLimit.toString(),
        windowMs: config.windowMs.toString(),
        enabled: config.enabled.toString(),
        updatedAt: Date.now().toString(),
      });
    } catch (error) {
      console.error('Failed to set rate limit config:', error);
      throw error;
    }
  }

  /**
   * 获取限流配置
   */
  static async getConfig(): Promise<{
    userLimit: number;
    ipLimit: number;
    windowMs: number;
    enabled: boolean;
  } | null> {
    try {
      const client = await getRedisClient();
      const key = CACHE_KEYS.RATE_LIMIT_CONFIG;
      const config = await client.hGetAll(key);

      if (!config || Object.keys(config).length === 0) {
        // 返回默认配置
        return {
          userLimit: parseInt(process.env.RATE_LIMIT_USER_LIMIT || '100'),
          ipLimit: parseInt(process.env.RATE_LIMIT_IP_LIMIT || '50'),
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
          enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        };
      }

      return {
        userLimit: parseInt(config.userLimit),
        ipLimit: parseInt(config.ipLimit),
        windowMs: parseInt(config.windowMs),
        enabled: config.enabled === 'true',
      };
    } catch (error) {
      console.error('Failed to get rate limit config:', error);
      return null;
    }
  }
}

/**
 * Sentry配置管理
 */
export class SentryConfig {
  /**
   * 设置Sentry配置
   */
  static async setConfig(config: {
    dsn?: string;
    environment: string;
    sampleRate: number;
    enabled: boolean;
  }): Promise<void> {
    try {
      const client = await getRedisClient();
      const key = CACHE_KEYS.SENTRY_CONFIG;
      await client.hSet(key, {
        dsn: config.dsn || '',
        environment: config.environment,
        sampleRate: config.sampleRate.toString(),
        enabled: config.enabled.toString(),
        updatedAt: Date.now().toString(),
      });
    } catch (error) {
      console.error('Failed to set Sentry config:', error);
      throw error;
    }
  }

  /**
   * 获取Sentry配置
   */
  static async getConfig(): Promise<{
    dsn?: string;
    environment: string;
    sampleRate: number;
    enabled: boolean;
  } | null> {
    try {
      const client = await getRedisClient();
      const key = CACHE_KEYS.SENTRY_CONFIG;
      const config = await client.hGetAll(key);

      if (!config || Object.keys(config).length === 0) {
        // 返回默认配置
        const dsn = process.env.SENTRY_DSN;
        return {
          dsn: dsn || undefined,
          environment: process.env.SENTRY_ENVIRONMENT || 'production',
          sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0'),
          enabled: !!dsn, // DSN存在时启用
        };
      }

      return {
        dsn: config.dsn || undefined,
        environment: config.environment,
        sampleRate: parseFloat(config.sampleRate),
        enabled: config.enabled === 'true',
      };
    } catch (error) {
      console.error('Failed to get Sentry config:', error);
      return null;
    }
  }
}

// 导出默认实例
export default {
  getClient: getRedisClient,
  close: closeRedisConnection,
  StockPriceCache,
  ScanStatsCache,
  HotStocksCache,
  PerformanceCache,
  RedisCache,
  RateLimitStore,
  RateLimitConfig,
  SentryConfig,
};
