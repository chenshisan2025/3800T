# RequestId 串联日志使用指南

## 概述

本文档详细说明如何在古灵通项目中使用 requestId 来串联和追踪日志，实现完整的请求链路追踪。通过 requestId，开发者可以轻松地跟踪单个请求在整个系统中的执行路径，快速定位问题和分析性能。

## RequestId 生成和传递机制

### 1. RequestId 生成

RequestId 在每个 API 请求开始时自动生成，使用 UUID v4 格式确保全局唯一性：

```typescript
// src/lib/logger.ts
import { v4 as uuidv4 } from 'uuid';

export function createRequestLogger(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4();
  // ...
}
```

### 2. RequestId 传递

RequestId 通过以下方式在系统中传递：

- **HTTP 头部**：`x-request-id` 头部字段
- **日志上下文**：自动注入到所有日志记录中
- **响应头部**：返回给客户端用于调试

## 在 API 路由中使用 RequestId

### 基本用法

在每个 API 路由文件中，首先创建 logger 实例：

```typescript
// 示例：src/app/api/stocks/route.ts
import { createRequestLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    logger.info('开始获取股票列表', {
      query: request.nextUrl.searchParams.toString(),
    });

    // 业务逻辑
    const stocks = await getStocks();

    logger.info('股票列表获取成功', {
      count: stocks.length,
      duration: Date.now() - startTime,
    });

    return apiResponse.success(stocks);
  } catch (error) {
    logger.error('获取股票列表失败', { error });
    return handleApiError(error, 'GetStocks');
  }
}
```

### 结构化日志记录

使用结构化日志格式，包含丰富的上下文信息：

```typescript
// 成功日志
logger.info('用户登录成功', {
  userId: user.id,
  email: user.email,
  loginMethod: 'magic_link',
  userAgent: request.headers.get('user-agent'),
  ip: getClientIP(request),
});

// 错误日志
logger.error('数据库查询失败', {
  error: new Error(error.message),
  query: 'SELECT * FROM users WHERE id = ?',
  params: { userId },
  duration: queryDuration,
});

// 警告日志
logger.warn('API 调用频率过高', {
  userId,
  endpoint: '/api/market/quotes',
  requestCount: 150,
  timeWindow: '1分钟',
});
```

## 跨服务调用中的 RequestId 传递

### 外部 API 调用

在调用外部服务时，传递 requestId：

```typescript
// 调用第三方 API
const response = await fetch('https://api.example.com/data', {
  headers: {
    'x-request-id': logger.requestId,
    Authorization: `Bearer ${token}`,
  },
});

logger.info('外部API调用完成', {
  url: 'https://api.example.com/data',
  status: response.status,
  duration: Date.now() - startTime,
});
```

### 内部服务调用

在微服务架构中，确保 requestId 在服务间传递：

```typescript
// 调用内部服务
const internalResponse = await fetch('/api/internal/service', {
  headers: {
    'x-request-id': logger.requestId,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

## 日志查询和分析

### 1. 通过 RequestId 查询日志

使用 requestId 可以快速查找特定请求的所有相关日志：

```bash
# 在日志文件中搜索特定 requestId
grep "12345678-1234-1234-1234-123456789abc" /var/log/app/*.log

# 使用 jq 解析 JSON 日志
cat app.log | jq 'select(.requestId == "12345678-1234-1234-1234-123456789abc")'
```

### 2. 日志分析示例

典型的请求日志链路：

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "requestId": "12345678-1234-1234-1234-123456789abc",
  "msg": "API请求开始",
  "method": "GET",
  "url": "/api/stocks",
  "userAgent": "Mozilla/5.0..."
}

{
  "level": "info",
  "time": "2024-01-15T10:30:00.100Z",
  "requestId": "12345678-1234-1234-1234-123456789abc",
  "msg": "数据库查询开始",
  "query": "SELECT * FROM stocks WHERE active = true"
}

{
  "level": "info",
  "time": "2024-01-15T10:30:00.250Z",
  "requestId": "12345678-1234-1234-1234-123456789abc",
  "msg": "数据库查询完成",
  "duration": 150,
  "rowCount": 1250
}

{
  "level": "info",
  "time": "2024-01-15T10:30:00.300Z",
  "requestId": "12345678-1234-1234-1234-123456789abc",
  "msg": "API请求完成",
  "status": 200,
  "duration": 300
}
```

## 实际使用示例

### 示例 1：用户认证流程

```typescript
// src/app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const { email } = await request.json();

    logger.info('用户登录请求', { email });

    // 验证邮箱格式
    if (!isValidEmail(email)) {
      logger.warn('邮箱格式无效', { email });
      return apiResponse.error('邮箱格式不正确', 400);
    }

    // 发送魔法链接
    const result = await sendMagicLink(email);

    logger.info('魔法链接发送成功', {
      email,
      messageId: result.messageId,
    });

    return apiResponse.success({ email });
  } catch (error) {
    logger.error('用户登录失败', { error });
    return handleApiError(error, 'UserLogin');
  }
}
```

### 示例 2：股票数据获取

```typescript
// src/app/api/stocks/[symbol]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const logger = createRequestLogger(request);
  const { symbol } = params;

  try {
    logger.info('获取股票详情', { symbol });

    // 检查缓存
    const cached = await redis.get(`stock:${symbol}`);
    if (cached) {
      logger.info('返回缓存数据', { symbol, source: 'cache' });
      return apiResponse.success(JSON.parse(cached));
    }

    // 从数据库获取
    const stock = await prisma.stock.findUnique({
      where: { code: symbol },
    });

    if (!stock) {
      logger.warn('股票不存在', { symbol });
      return apiResponse.notFound('股票不存在');
    }

    // 缓存结果
    await redis.setex(`stock:${symbol}`, 300, JSON.stringify(stock));

    logger.info('股票详情获取成功', {
      symbol,
      source: 'database',
      price: stock.current_price,
    });

    return apiResponse.success(stock);
  } catch (error) {
    logger.error('获取股票详情失败', { symbol, error });
    return handleApiError(error, 'GetStockDetail');
  }
}
```

## 最佳实践

### 1. 日志级别使用

- **info**：正常业务流程，重要状态变更
- **warn**：潜在问题，但不影响功能
- **error**：错误和异常情况
- **debug**：详细调试信息（仅开发环境）

### 2. 上下文信息

始终包含相关的上下文信息：

```typescript
// 好的实践
logger.info('订单创建成功', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  currency: 'CNY',
  paymentMethod: 'alipay',
});

// 避免的做法
logger.info('订单创建成功');
```

### 3. 敏感信息处理

避免记录敏感信息：

```typescript
// 安全的做法
logger.info('用户注册', {
  email: maskEmail(user.email),
  userId: user.id,
});

// 危险的做法 - 不要这样做
logger.info('用户注册', {
  email: user.email,
  password: user.password, // 绝对不要记录密码
});
```

### 4. 性能监控

记录关键操作的执行时间：

```typescript
const startTime = Date.now();

// 执行操作
const result = await heavyOperation();

logger.info('重要操作完成', {
  operation: 'data_processing',
  duration: Date.now() - startTime,
  recordCount: result.length,
});
```

## 故障排查流程

### 1. 获取 RequestId

从错误报告、用户反馈或监控告警中获取 requestId。

### 2. 查询完整日志链路

```bash
# 查询特定请求的所有日志
grep "abc123-def456-ghi789" /var/log/app/*.log | sort
```

### 3. 分析执行路径

通过时间戳和日志消息，重建请求的完整执行路径。

### 4. 定位问题根因

结合错误日志和上下文信息，快速定位问题原因。

## 监控和告警

### 错误率监控

```typescript
// 在 Sentry 中关联 requestId
Sentry.configureScope(scope => {
  scope.setTag('requestId', logger.requestId);
});
```

### 性能监控

通过日志分析工具监控 API 响应时间和错误率。

## 总结

RequestId 串联日志系统为古灵通项目提供了强大的可观测性能力。通过正确使用 requestId，开发团队可以：

- 快速定位和解决问题
- 监控系统性能和健康状况
- 提供更好的用户体验
- 支持系统的持续改进

遵循本文档的最佳实践，可以最大化发挥日志系统的价值，提高开发和运维效率。
