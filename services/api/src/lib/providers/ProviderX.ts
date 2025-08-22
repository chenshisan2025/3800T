import { BaseProvider } from './BaseProvider';
import {
  IndexDataWithMetadata,
  QuoteDataWithMetadata,
  KlineDataWithMetadata,
  NewsDataWithMetadata,
  IndicesQuery,
  QuotesQuery,
  KlineQuery,
  NewsQuery,
} from '@/types';
import logger from '@/lib/logger';

/**
 * ProviderX 数据提供者
 * 支持API KEY配置的专业数据提供商
 */
export class ProviderX extends BaseProvider {
  private apiKey: string;
  private baseUrl: string;
  private rateLimitRemaining: number = 1000;
  private rateLimitReset: number = Date.now() + 3600000; // 1小时后重置

  constructor() {
    const apiKey = process.env.DATA_API_KEY;
    const baseUrl = process.env.DATA_BASE_URL || 'https://api.providerx.com';

    if (!apiKey) {
      logger.warn('ProviderX API KEY未配置，将使用模拟数据');
    }

    super({
      name: 'ProviderX',
      baseUrl,
      apiKey,
      timeout: 8000,
      retryCount: 2,
    });

    this.apiKey = apiKey || '';
    this.baseUrl = baseUrl;

    logger.info('ProviderX初始化完成', {
      hasApiKey: !!apiKey,
      baseUrl: this.baseUrl,
    });
  }

  get name(): string {
    return 'ProviderX';
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        logger.warn('ProviderX健康检查：API KEY未配置');
        return true; // 模拟模式下返回健康
      }

      // 实际API健康检查
      const response = await this.makeRequest('/health');
      return response.status === 'ok';
    } catch (error) {
      logger.error('ProviderX健康检查失败', { error });
      return false;
    }
  }

  /**
   * 发起API请求
   */
  private async makeRequest(endpoint: string, params?: any): Promise<any> {
    if (!this.apiKey) {
      logger.warn('ProviderX API KEY未配置，使用模拟模式');
      // 在没有API KEY时返回模拟响应
      await this.delay(100 + Math.random() * 200);
      return { status: 'ok', data: null };
    }

    // 检查速率限制
    if (this.rateLimitRemaining <= 0 && Date.now() < this.rateLimitReset) {
      throw new Error('ProviderX API速率限制已达上限');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GuLingTong/1.0',
    };

    try {
      // 模拟HTTP请求
      await this.delay(100 + Math.random() * 200);

      // 更新速率限制
      this.rateLimitRemaining = Math.max(0, this.rateLimitRemaining - 1);

      // 模拟成功响应
      return { status: 'ok', data: null };
    } catch (error) {
      logger.error('ProviderX API请求失败', { url, error });
      throw error;
    }
  }

  /**
   * 获取速率限制状态
   */
  getRateLimitStatus() {
    return {
      remaining: this.rateLimitRemaining,
      reset: this.rateLimitReset,
      resetTime: new Date(this.rateLimitReset).toISOString(),
    };
  }

  /**
   * 获取指数数据
   */
  async getIndices(query?: IndicesQuery): Promise<IndexDataWithMetadata[]> {
    await this.delay(200);

    const indices = [
      {
        code: '000001',
        name: 'ProviderX上证指数',
        current: 3150.25,
        change: 15.8,
        change_percent: 0.5,
        open: 3134.45,
        high: 3165.8,
        low: 3128.9,
        volume: 285000000,
        turnover: 320000000000,
        timestamp: Date.now(),
      },
      {
        code: '399001',
        name: 'ProviderX深证成指',
        current: 10850.75,
        change: -25.3,
        change_percent: -0.23,
        open: 10876.05,
        high: 10890.2,
        low: 10835.6,
        volume: 195000000,
        turnover: 280000000000,
        timestamp: Date.now(),
      },
    ];

    return indices.map(index => ({
      ...index,
      metadata: this.createMetadata(200),
    }));
  }

  /**
   * 获取股票报价数据
   */
  async getQuotes(query: QuotesQuery): Promise<QuoteDataWithMetadata[]> {
    await this.delay(150);

    if (!query || !query.codes) {
      return [];
    }

    const quotes = query.codes.map(code => ({
      code,
      name: `ProviderX股票${code}`,
      current: 50.0 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      change_percent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      turnover: Math.floor(Math.random() * 100000000),
      high: 55.0 + Math.random() * 50,
      low: 45.0 + Math.random() * 50,
      open: 48.0 + Math.random() * 50,
      pre_close: 49.0 + Math.random() * 50,
      timestamp: Date.now(),
    }));

    return quotes.map(quote => ({
      ...quote,
      metadata: this.createMetadata(150),
    }));
  }

  /**
   * 获取K线数据
   */
  async getKline(query: KlineQuery): Promise<KlineDataWithMetadata> {
    await this.delay(100);

    const klineData: KlineData[] = [];
    const now = Date.now();
    const periodMs = this.getPeriodMilliseconds(query.period);
    const limit = query.limit || 100;

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - i * periodMs;
      const basePrice = 100 + Math.sin(i * 0.1) * 10;
      const volatility = 0.02;

      const open = basePrice + (Math.random() - 0.5) * volatility * basePrice;
      const close = open + (Math.random() - 0.5) * volatility * basePrice;
      const high =
        Math.max(open, close) + Math.random() * volatility * basePrice;
      const low =
        Math.min(open, close) - Math.random() * volatility * basePrice;

      klineData.push({
        code: query.code,
        period: query.period,
        timestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
        turnover: Math.floor(Math.random() * 10000000),
      });
    }

    return {
      data: klineData,
      metadata: this.createMetadata(100),
    };
  }

  /**
   * 获取新闻数据
   */
  async getNews(query?: NewsQuery): Promise<NewsDataWithMetadata> {
    await this.delay(150);

    const limit = query?.limit || 20;
    const newsData: NewsData[] = [];

    for (let i = 0; i < limit; i++) {
      const publishTime = Date.now() - i * 3600000; // 每小时一条新闻

      newsData.push({
        id: `news_${Date.now()}_${i}`,
        title: `市场动态：股市${i % 2 === 0 ? '上涨' : '下跌'}趋势分析`,
        summary: `这是第${i + 1}条新闻的摘要内容，包含了重要的市场信息。`,
        content: `详细的新闻内容，包含了深入的市场分析和专业见解。新闻编号：${i + 1}`,
        source: 'ProviderX财经',
        author: `分析师${String.fromCharCode(65 + (i % 26))}`,
        publishedAt: publishTime,
        url: `https://example.com/news/${i + 1}`,
        tags: ['股市', '分析', i % 2 === 0 ? '上涨' : '下跌'],
        related_stocks: query?.stock_codes || ['000001', '000002'],
        sentiment:
          i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'negative' : 'neutral',
      });
    }

    return {
      data: newsData,
      pagination: {
        page: 1,
        limit,
        total: limit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      metadata: this.createMetadata(150),
    };
  }
}
