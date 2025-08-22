// utils/cache.js
const { storage } = require('./storage');

// 缓存策略常量
const CacheStrategies = {
  SHORT: 5 * 60 * 1000, // 5分钟
  MEDIUM: 30 * 60 * 1000, // 30分钟
  LONG: 2 * 60 * 60 * 1000, // 2小时
  DAILY: 24 * 60 * 60 * 1000, // 24小时
};

// 缓存管理类
class CacheManager {
  constructor() {
    this.prefix = 'cache_';
    this.maxSize = 50; // 最大缓存条目数
  }

  // 生成缓存键
  _getCacheKey(key) {
    return this.prefix + key;
  }

  // 设置缓存
  set(key, data, expire = CacheStrategies.MEDIUM) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expire: Date.now() + expire,
        accessCount: 0,
        lastAccess: Date.now(),
      };

      storage.set(this._getCacheKey(key), cacheItem);

      // 检查缓存大小，如果超过限制则清理
      this._checkCacheSize();

      return true;
    } catch (error) {
      console.error('设置缓存失败:', key, error);
      return false;
    }
  }

  // 获取缓存
  get(key) {
    try {
      const cacheKey = this._getCacheKey(key);
      const cacheItem = storage.get(cacheKey);

      if (!cacheItem) {
        return null;
      }

      // 检查是否过期
      if (Date.now() > cacheItem.expire) {
        storage.remove(cacheKey);
        return null;
      }

      // 更新访问信息
      cacheItem.accessCount++;
      cacheItem.lastAccess = Date.now();
      storage.set(cacheKey, cacheItem);

      return cacheItem.data;
    } catch (error) {
      console.error('获取缓存失败:', key, error);
      return null;
    }
  }

  // 删除缓存
  remove(key) {
    try {
      storage.remove(this._getCacheKey(key));
      return true;
    } catch (error) {
      console.error('删除缓存失败:', key, error);
      return false;
    }
  }

  // 检查缓存是否存在且未过期
  has(key) {
    const cacheItem = storage.get(this._getCacheKey(key));
    if (!cacheItem) {
      return false;
    }

    if (Date.now() > cacheItem.expire) {
      storage.remove(this._getCacheKey(key));
      return false;
    }

    return true;
  }

  // 清理过期缓存
  clearExpired() {
    try {
      const keys = storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      let clearedCount = 0;

      cacheKeys.forEach(key => {
        const cacheItem = storage.get(key);
        if (cacheItem && Date.now() > cacheItem.expire) {
          storage.remove(key);
          clearedCount++;
        }
      });

      console.log(`清理了${clearedCount}个过期缓存`);
      return clearedCount;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }

  // 清空所有缓存
  clear() {
    try {
      const keys = storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

      cacheKeys.forEach(key => {
        storage.remove(key);
      });

      console.log(`清空了${cacheKeys.length}个缓存`);
      return true;
    } catch (error) {
      console.error('清空缓存失败:', error);
      return false;
    }
  }

  // 检查缓存大小并清理
  _checkCacheSize() {
    try {
      const keys = storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

      if (cacheKeys.length <= this.maxSize) {
        return;
      }

      // 获取所有缓存项并按最后访问时间排序
      const cacheItems = cacheKeys
        .map(key => {
          const item = storage.get(key);
          return {
            key,
            lastAccess: item ? item.lastAccess : 0,
            accessCount: item ? item.accessCount : 0,
          };
        })
        .sort((a, b) => {
          // 优先删除访问次数少且最近未访问的
          if (a.accessCount !== b.accessCount) {
            return a.accessCount - b.accessCount;
          }
          return a.lastAccess - b.lastAccess;
        });

      // 删除最少使用的缓存项
      const toDelete = cacheItems.slice(0, cacheKeys.length - this.maxSize);
      toDelete.forEach(item => {
        storage.remove(item.key);
      });

      console.log(`清理了${toDelete.length}个最少使用的缓存`);
    } catch (error) {
      console.error('检查缓存大小失败:', error);
    }
  }

  // 获取缓存统计信息
  getStats() {
    try {
      const keys = storage.keys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

      let totalSize = 0;
      let expiredCount = 0;
      let totalAccess = 0;

      cacheKeys.forEach(key => {
        const item = storage.get(key);
        if (item) {
          totalSize += JSON.stringify(item).length;
          totalAccess += item.accessCount || 0;

          if (Date.now() > item.expire) {
            expiredCount++;
          }
        }
      });

      return {
        totalItems: cacheKeys.length,
        totalSize,
        expiredCount,
        totalAccess,
        hitRate:
          totalAccess > 0 ? totalAccess / (totalAccess + expiredCount) : 0,
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        expiredCount: 0,
        totalAccess: 0,
        hitRate: 0,
      };
    }
  }

  // 预热缓存（批量设置）
  warmup(cacheData, expire = CacheStrategies.MEDIUM) {
    try {
      let successCount = 0;

      Object.entries(cacheData).forEach(([key, data]) => {
        if (this.set(key, data, expire)) {
          successCount++;
        }
      });

      console.log(
        `预热缓存完成，成功${successCount}个，失败${Object.keys(cacheData).length - successCount}个`
      );
      return successCount;
    } catch (error) {
      console.error('预热缓存失败:', error);
      return 0;
    }
  }
}

// 创建全局缓存实例
const cache = new CacheManager();

// 定期清理过期缓存（每10分钟）
setInterval(
  () => {
    cache.clearExpired();
  },
  10 * 60 * 1000
);

module.exports = {
  cache,
  CacheManager,
  CacheStrategies,
};
