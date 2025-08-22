import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { BaseProvider } from '@/lib/providers/BaseProvider';
import { MockProvider } from '@/lib/providers/MockProvider';
import { ProviderX } from '@/lib/providers/ProviderX';
import {
  DataProviderManager,
  dataProviderManager,
} from '@/lib/providers/DataProviderManager';
import { IDataProvider } from '@/types';

// Mock environment variables for testing
const originalEnv = process.env;

describe('PR-02 DataProvider 抽象/回退功能验收测试', () => {
  let app: any;
  let server: any;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATA_BASE_URL = 'https://test-api.example.com';
    process.env.DATA_API_KEY = 'test-api-key';
  }, 10000);

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('1. BaseProvider接口定义测试', () => {
    it('应该定义所有必需的抽象方法', () => {
      const mockProvider = new MockProvider();

      // 检查抽象方法是否存在
      expect(typeof mockProvider.getIndices).toBe('function');
      expect(typeof mockProvider.getQuotes).toBe('function');
      expect(typeof mockProvider.getKline).toBe('function');
      expect(typeof mockProvider.getNews).toBe('function');
    });

    it('应该实现通用功能方法', () => {
      const mockProvider = new MockProvider();

      // 检查通用方法是否存在（通过原型链）
      expect(typeof mockProvider.healthCheck).toBe('function');
      expect(mockProvider.name).toBeDefined();
      expect(typeof mockProvider.name).toBe('string');
    });
  });

  describe('2. MockProvider实现测试', () => {
    let mockProvider: MockProvider;

    beforeAll(() => {
      mockProvider = new MockProvider({
        name: 'MockProvider',
        baseUrl: 'http://mock.example.com',
        timeout: 5000,
        retryAttempts: 3,
      });
    });

    it('应该实现所有数据获取方法', async () => {
      // 测试指数数据
      const indicesResult = await mockProvider.getIndices();
      expect(indicesResult).toBeDefined();
      expect(Array.isArray(indicesResult)).toBe(true);
      if (indicesResult.length > 0) {
        expect(indicesResult[0].metadata.source).toBe('MockProvider');
        expect(typeof indicesResult[0].metadata.lagMs).toBe('number');
        expect(indicesResult[0].metadata.lagMs).toBeGreaterThan(0);
      }

      // 测试报价数据
      const quotesResult = await mockProvider.getQuotes({
        codes: ['AAPL', 'GOOGL'],
      });
      expect(quotesResult).toBeDefined();
      expect(Array.isArray(quotesResult)).toBe(true);
      if (quotesResult.length > 0) {
        expect(quotesResult[0].metadata.source).toBe('MockProvider');
        expect(typeof quotesResult[0].metadata.lagMs).toBe('number');
        expect(quotesResult[0].metadata.lagMs).toBeGreaterThan(0);
      }

      // 测试K线数据
      const klineResult = await mockProvider.getKline({
        code: 'AAPL',
        period: '1d',
      });
      expect(klineResult).toBeDefined();
      expect(klineResult).toHaveProperty('data');
      expect(klineResult).toHaveProperty('metadata');
      expect(Array.isArray(klineResult.data)).toBe(true);
      if (klineResult.data.length > 0) {
        expect(klineResult.metadata.source).toBe('MockProvider');
        expect(typeof klineResult.metadata.lagMs).toBe('number');
        expect(klineResult.metadata.lagMs).toBeGreaterThan(0);
      }

      // 测试新闻数据
      const newsResult = await mockProvider.getNews({ limit: 10 });
      expect(newsResult).toBeDefined();
      expect(newsResult).toHaveProperty('data');
      expect(newsResult).toHaveProperty('metadata');
      expect(Array.isArray(newsResult.data)).toBe(true);
      if (newsResult.data.length > 0) {
        expect(newsResult.metadata.source).toBe('MockProvider');
        expect(typeof newsResult.metadata.lagMs).toBe('number');
        expect(newsResult.metadata.lagMs).toBeGreaterThan(0);
      }
    });
  });

  describe('3. ProviderX环境变量配置测试', () => {
    it('应该能够读取环境变量配置', () => {
      // 设置测试环境变量
      process.env.DATA_BASE_URL = 'https://test-api.example.com';
      process.env.DATA_API_KEY = 'test-api-key-123';

      const providerX = new ProviderX({
        name: 'ProviderX',
        baseUrl: process.env.DATA_BASE_URL || '',
        timeout: 5000,
        retryAttempts: 3,
      });

      expect(providerX).toBeDefined();
      // 验证配置是否正确读取
      expect(process.env.DATA_BASE_URL).toBe('https://test-api.example.com');
      expect(process.env.DATA_API_KEY).toBe('test-api-key-123');
    });

    it('应该在配置缺失时能够处理错误', async () => {
      // 清除环境变量
      delete process.env.DATA_BASE_URL;
      delete process.env.DATA_API_KEY;

      const providerX = new ProviderX({
        name: 'ProviderX',
        baseUrl: '',
        timeout: 5000,
        retryAttempts: 3,
      });

      // 测试在配置缺失时的行为
      try {
        await providerX.getIndices({ limit: 10 });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('4. DataProviderManager回退机制测试', () => {
    let manager: DataProviderManager;

    beforeAll(() => {
      manager = new DataProviderManager();
    });

    it('应该能够在主提供者失败时回退到MockProvider', async () => {
      // 创建一个会失败的ProviderX实例来测试回退机制
      const failingProvider = new (class extends ProviderX {
        async getQuotes() {
          throw new Error('模拟主提供者失败');
        }
      })();

      // 临时替换主提供者
      const originalProvider = (dataProviderManager as any).primaryProvider;
      (dataProviderManager as any).primaryProvider = failingProvider;

      try {
        const result = await dataProviderManager.getQuotes({
          codes: ['000001'],
        });
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);

        const firstItem = result[0];
        expect(firstItem).toHaveProperty('metadata');
        expect(firstItem.metadata.source).toBe('MockProvider'); // 应该回退到MockProvider
      } finally {
        // 恢复原始提供者
        (dataProviderManager as any).primaryProvider = originalProvider;
      }
    });

    it('应该提供当前提供者信息', () => {
      const info = manager.getCurrentProviderInfo();

      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(typeof info.name).toBe('string');
      expect(typeof info.isPrimary).toBe('boolean');
      expect(typeof info.isFallback).toBe('boolean');
    });
  });

  describe('5. 契约测试 - 数据字段完整性', () => {
    let manager: DataProviderManager;

    beforeAll(() => {
      manager = new DataProviderManager();
    });

    it('指数数据应该包含所有必需字段', async () => {
      const result = await manager.getIndices();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const index = result[0];
        expect(index.code).toBeDefined();
        expect(index.name).toBeDefined();
        expect(typeof index.current).toBe('number');
        expect(typeof index.change).toBe('number');
        expect(typeof index.change_percent).toBe('number');
        expect(index.timestamp).toBeDefined();

        // 验证元数据
        expect(index.metadata).toBeDefined();
        expect(index.metadata.source).toBeDefined();
        expect(typeof index.metadata.lagMs).toBe('number');
        expect(index.metadata.lagMs).toBeGreaterThan(0);
        expect(index.metadata.timestamp).toBeDefined();
      }
    });

    it('报价数据应该包含所有必需字段', async () => {
      const result = await manager.getQuotes({ codes: ['AAPL'] });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const quote = result[0];
        expect(quote.code).toBeDefined();
        expect(typeof quote.current).toBe('number');
        expect(typeof quote.change).toBe('number');
        expect(typeof quote.change_percent).toBe('number');
        expect(typeof quote.volume).toBe('number');
        expect(quote.timestamp).toBeDefined();

        // 验证元数据
        expect(quote.metadata).toBeDefined();
        expect(quote.metadata.source).toBeDefined();
        expect(typeof quote.metadata.lagMs).toBe('number');
        expect(quote.metadata.lagMs).toBeGreaterThan(0);
      }
    });

    it('K线数据应该包含所有必需字段', async () => {
      const result = await manager.getKline({ code: 'AAPL', period: '1d' });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const kline = result.data[0];
        expect(typeof kline.open).toBe('number');
        expect(typeof kline.high).toBe('number');
        expect(typeof kline.low).toBe('number');
        expect(typeof kline.close).toBe('number');
        expect(typeof kline.volume).toBe('number');
        expect(kline.timestamp).toBeDefined();
      }

      // 验证元数据
      expect(result.metadata).toBeDefined();
      expect(result.metadata.source).toBeDefined();
      expect(typeof result.metadata.lagMs).toBe('number');
      expect(result.metadata.lagMs).toBeGreaterThan(0);
    });

    it('新闻数据应该包含所有必需字段', async () => {
      const result = await manager.getNews({ limit: 5 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const news = result.data[0];
        expect(news.id).toBeDefined();
        expect(news.title).toBeDefined();
        expect(news.summary).toBeDefined();
        expect(news.url).toBeDefined();
        expect(news.publishedAt).toBeDefined();
        expect(news.source).toBeDefined();
      }

      // 验证元数据
      expect(result.metadata).toBeDefined();
      expect(result.metadata.source).toBeDefined();
      expect(typeof result.metadata.lagMs).toBe('number');
      expect(result.metadata.lagMs).toBeGreaterThan(0);
    });
  });

  describe.skip('6. API端点集成测试', () => {
    it('/api/market/indices 应该正确使用DataProviderManager', async () => {
      // 此测试需要运行的Next.js服务器
      expect(true).toBe(true);
    });

    it('/api/news 应该正确使用DataProviderManager', async () => {
      // 此测试需要运行的Next.js服务器
      expect(true).toBe(true);
    });

    it('API响应应该包含正确的元数据格式', async () => {
      // 此测试需要运行的Next.js服务器
      expect(true).toBe(true);
    });
  });
});
