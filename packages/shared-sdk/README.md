# 古灵通共享 SDK

[![npm version](https://badge.fury.io/js/@gulingtong%2Fshared-sdk.svg)](https://badge.fury.io/js/@gulingtong%2Fshared-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

古灵通项目的共享 SDK，基于 OpenAPI 规范自动生成，提供类型安全的 API 客户端和完整的类型定义。

## 功能特性

- 🔧 **TypeScript 支持** - 完整的类型定义和类型安全
- 🌐 **统一 API 客户端** - 基于 Fetch API 的现代 HTTP 客户端
- 📝 **OpenAPI 规范** - 基于 OpenAPI 3.0 的 API 文档
- 🔄 **自动代码生成** - 从 OpenAPI 规范自动生成客户端代码
- 🛡️ **错误处理** - 统一的错误处理和类型化错误
- 🔐 **认证支持** - 内置 JWT 认证支持
- 📦 **多环境配置** - 支持开发、测试、生产环境

## 安装

```bash
npm install @gulingtong/shared-sdk
# 或
yarn add @gulingtong/shared-sdk
# 或
pnpm add @gulingtong/shared-sdk
```

## 快速开始

### 基础使用

```typescript
import {
  createGulingtongClient,
  getEnvironmentConfig,
} from '@gulingtong/shared-sdk';

// 创建客户端实例
const client = createGulingtongClient({
  ...getEnvironmentConfig('development'),
  // 可选：添加请求拦截器
  requestInterceptor: config => {
    console.log('发送请求:', config.url);
    return config;
  },
  // 可选：添加错误处理
  errorHandler: error => {
    console.error('API 错误:', error.message);
  },
});

// 使用服务
async function example() {
  try {
    // 健康检查
    const health = await client.system.getHealth();
    console.log('系统状态:', health.data);

    // 获取股票列表
    const stocks = await client.stock.getStocks({
      page: 1,
      limit: 20,
      search: '腾讯',
    });
    console.log('股票列表:', stocks.data);
  } catch (error) {
    console.error('请求失败:', error);
  }
}
```

### 认证使用

```typescript
// 用户登录
async function login(email: string, password: string) {
  try {
    const response = await client.auth.login({ email, password });

    // 设置认证令牌
    client.setAuthToken(response.data.accessToken);

    console.log('登录成功:', response.data.user);
    return response.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}

// 获取用户信息
async function getCurrentUser() {
  try {
    const response = await client.auth.getCurrentUser();
    console.log('当前用户:', response.data);
    return response.data;
  } catch (error) {
    if (error.isAuthError()) {
      console.log('用户未登录');
      // 跳转到登录页面
    }
    throw error;
  }
}

// 用户登出
async function logout() {
  try {
    await client.auth.logout();
    client.clearAuthToken();
    console.log('登出成功');
  } catch (error) {
    console.error('登出失败:', error);
  }
}
```

### 股票数据

```typescript
// 获取股票列表
async function getStocks() {
  const response = await client.stock.getStocks({
    page: 1,
    limit: 50,
    market: 'SH', // 上海证券交易所
    industry: '科技',
    search: '腾讯',
  });

  return response.data;
}

// 获取股票详情
async function getStockDetail(code: string) {
  const response = await client.stock.getStock(code);
  return response.data;
}

// 获取股票历史数据
async function getStockHistory(code: string) {
  const response = await client.stock.getStockData(code, {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    limit: 100,
  });

  return response.data;
}
```

### 用户功能

```typescript
// 自选股管理
async function manageWatchlist() {
  // 获取自选股列表
  const watchlist = await client.user.getWatchlist();
  console.log('自选股:', watchlist.data);

  // 添加自选股
  await client.user.addToWatchlist({
    stockCode: '000001',
    notes: '关注这只股票的业绩表现',
  });

  // 更新自选股备注
  await client.user.updateWatchlistItem('watchlist-id', {
    notes: '更新后的备注',
  });

  // 删除自选股
  await client.user.removeFromWatchlist('watchlist-id');
}

// 投资组合管理
async function managePortfolio() {
  // 创建投资组合
  const portfolio = await client.user.createPortfolio({
    name: '我的投资组合',
    description: '长期价值投资组合',
  });

  // 添加持仓
  await client.user.addPortfolioItem(portfolio.data.id, {
    stockCode: '000001',
    quantity: 1000,
    averageCost: 15.5,
    notes: '分批建仓',
  });

  // 获取投资组合详情（包含统计数据）
  const portfolioDetail = await client.user.getPortfolio(portfolio.data.id);
  console.log('投资组合统计:', portfolioDetail.data.stats);
}
```

### AI 报告

```typescript
// 获取 AI 报告
async function getAIReports() {
  const response = await client.aiReport.getReports({
    page: 1,
    limit: 20,
    stockCode: '000001',
    reportType: 'analysis',
  });

  return response.data;
}

// 获取特定报告详情
async function getReportDetail(reportId: string) {
  const response = await client.aiReport.getReport(reportId);
  return response.data;
}
```

## 错误处理

SDK 提供了统一的错误处理机制：

```typescript
import { ApiError } from '@gulingtong/shared-sdk';

try {
  await client.auth.login({ email: 'invalid', password: 'wrong' });
} catch (error) {
  if (error instanceof ApiError) {
    // 检查错误类型
    if (error.isAuthError()) {
      console.log('认证失败');
    } else if (error.isNetworkError()) {
      console.log('网络连接失败');
    } else if (error.isServerError()) {
      console.log('服务器错误');
    }

    // 获取错误详情
    console.log('错误状态码:', error.status);
    console.log('错误代码:', error.code);
    console.log('错误消息:', error.message);
    console.log('错误详情:', error.details);
  }
}
```

## 类型定义

SDK 提供了完整的 TypeScript 类型定义：

```typescript
import type {
  StockInfo,
  UserDetails,
  Portfolio,
  WatchlistItem,
  AIReport,
  ApiResponse,
  PaginatedResponse,
} from '@gulingtong/shared-sdk';

// 使用类型
const handleStockData = (stock: StockInfo) => {
  console.log(`${stock.name} (${stock.code}): ¥${stock.currentPrice}`);
};

const handleUserData = (user: UserDetails) => {
  console.log(`用户: ${user.email}, 自选股数量: ${user.watchlistCount}`);
};
```

## 环境配置

```typescript
import {
  getEnvironmentConfig,
  createGulingtongClient,
} from '@gulingtong/shared-sdk';

// 开发环境
const devClient = createGulingtongClient(getEnvironmentConfig('development'));

// 生产环境
const prodClient = createGulingtongClient(getEnvironmentConfig('production'));

// 自定义配置
const customClient = createGulingtongClient({
  baseURL: 'https://custom-api.example.com',
  timeout: 20000,
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

## 开发

### 构建

```bash
npm run build
```

### 生成客户端代码

```bash
npm run generate
```

### 生成文档

```bash
npm run docs
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
```

## API 文档

完整的 API 文档基于 OpenAPI 规范生成，可以通过以下方式查看：

1. 查看 `openapi.yaml` 文件
2. 运行 `npm run docs` 生成 HTML 文档
3. 使用 Swagger UI 或 Redoc 查看交互式文档

## 许可证

MIT License
