# Redis 缓存系统文档

## 概述

本项目使用 Redis 作为缓存系统，主要用于优化告警引擎的性能和提供扫描统计功能。Redis 缓存系统包含以下几个主要模块：

- **股价缓存 (StockPriceCache)**: 缓存股票价格数据，减少API调用
- **扫描统计缓存 (ScanStatsCache)**: 存储告警扫描的统计数据
- **热门股票缓存 (HotStocksCache)**: 维护热门股票列表
- **性能指标缓存 (PerformanceCache)**: 记录系统性能指标

## 环境配置

### 环境变量

在 `.env` 文件中配置以下 Redis 相关环境变量：

```bash
# Redis连接URL（推荐使用）
REDIS_URL=redis://localhost:6379

# 或者使用单独的配置项
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 连接配置
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
```

### Redis 安装

#### macOS (使用 Homebrew)

```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

#### Docker

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

## 缓存模块详解

### 1. 股价缓存 (StockPriceCache)

**用途**: 缓存股票价格数据，避免频繁调用外部API

**缓存时间**: 1分钟

**主要方法**:

- `set(symbol, price)`: 设置股票价格
- `get(symbol)`: 获取股票价格
- `setBatch(prices)`: 批量设置股票价格

**使用示例**:

```typescript
import { StockPriceCache } from '@/lib/redis';

// 设置股票价格
await StockPriceCache.set('AAPL', 150.25);

// 获取股票价格
const price = await StockPriceCache.get('AAPL');

// 批量设置
await StockPriceCache.setBatch({
  AAPL: 150.25,
  GOOGL: 2800.5,
  MSFT: 300.75,
});
```

### 2. 扫描统计缓存 (ScanStatsCache)

**用途**: 存储告警扫描的统计数据，包括总体统计、每日统计、每周统计和每月统计

**缓存时间**:

- 总体统计: 1小时
- 每日统计: 1天
- 每周统计: 7天
- 每月统计: 30天

**主要方法**:

- `set(stats)`: 设置总体统计
- `get()`: 获取总体统计
- `setDailyStats(date, stats)`: 设置每日统计
- `getDailyStats(date)`: 获取每日统计
- `setWeeklyStats(week, stats)`: 设置每周统计
- `getWeeklyStats(week)`: 获取每周统计
- `setMonthlyStats(month, stats)`: 设置每月统计
- `getMonthlyStats(month)`: 获取每月统计
- `getRecentDailyStats(days)`: 获取最近N天的统计

### 3. 热门股票缓存 (HotStocksCache)

**用途**: 维护热门股票列表，基于访问频率排序

**缓存时间**: 5分钟

**主要方法**:

- `addStock(symbol)`: 添加股票到热门列表
- `getHotStocks(limit)`: 获取热门股票列表

### 4. 性能指标缓存 (PerformanceCache)

**用途**: 记录系统性能指标，如缓存命中时间、API调用时间等

**缓存时间**: 30分钟

**主要方法**:

- `recordMetric(name, value)`: 记录性能指标
- `getMetric(name)`: 获取性能指标

## API 接口

### 获取扫描统计

```http
GET /api/alerts/stats
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "overall": {
      "totalScans": 150,
      "totalRulesScanned": 1500,
      "totalRulesMatched": 75,
      "totalNotificationsCreated": 45,
      "averageDuration": 2500,
      "successfulScans": 148,
      "failedScans": 2
    },
    "daily": [
      {
        "date": "2024-01-20",
        "totalScans": 12,
        "totalRulesScanned": 120,
        "totalRulesMatched": 6,
        "averageDuration": 2300
      }
    ],
    "weekly": {
      "week": "2024-03",
      "totalScans": 84,
      "totalRulesScanned": 840,
      "totalRulesMatched": 42
    },
    "monthly": {
      "month": "2024-01",
      "totalScans": 350,
      "totalRulesScanned": 3500,
      "totalRulesMatched": 175
    },
    "hotStocks": [
      { "symbol": "AAPL", "count": 25 },
      { "symbol": "GOOGL", "count": 18 }
    ],
    "performance": {
      "averageCacheHitTime": 5.2,
      "averageApiCallTime": 150.8,
      "averageScanDuration": 2500,
      "averageMatchRate": 5.2
    }
  }
}
```

## 缓存键命名规范

```typescript
export const CACHE_KEYS = {
  STOCK_PRICE: 'stock:price',
  SCAN_STATS: 'alert:scan:stats',
  HOT_STOCKS: 'stock:hot',
  PERFORMANCE: 'system:performance',
};
```

## 性能优化建议

1. **合理设置缓存时间**: 根据数据更新频率设置合适的TTL
2. **批量操作**: 使用批量设置方法减少Redis连接次数
3. **连接池管理**: 使用连接池避免频繁创建连接
4. **错误处理**: 实现优雅的错误处理和降级策略
5. **监控指标**: 定期监控缓存命中率和性能指标

## 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务是否启动
   - 验证环境变量配置
   - 检查网络连接

2. **缓存数据不一致**
   - 检查TTL设置
   - 验证缓存更新逻辑
   - 考虑使用版本控制

3. **性能问题**
   - 监控Redis内存使用
   - 检查缓存命中率
   - 优化缓存键设计

### 调试命令

```bash
# 连接Redis CLI
redis-cli

# 查看所有键
KEYS *

# 查看特定键的值
GET stock:price:AAPL

# 查看键的TTL
TTL stock:price:AAPL

# 清空所有缓存
FLUSHALL
```

## 监控和维护

### 监控指标

- 缓存命中率
- 内存使用情况
- 连接数
- 响应时间
- 错误率

### 定期维护

- 清理过期数据
- 监控内存使用
- 备份重要缓存数据
- 更新Redis版本

## 扩展功能

### 集群部署

对于高可用性需求，可以配置Redis集群：

```bash
# Redis集群配置示例
REDIS_CLUSTER_NODES=redis1:6379,redis2:6379,redis3:6379
```

### 数据持久化

配置Redis持久化策略：

```bash
# RDB持久化
save 900 1
save 300 10
save 60 10000

# AOF持久化
appendonly yes
appendfsync everysec
```
