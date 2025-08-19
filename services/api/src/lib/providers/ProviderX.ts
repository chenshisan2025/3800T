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
    const apiKey = process.env.PROVIDERX_API_KEY;
    const baseUrl = process.env.PROVIDERX_BASE_URL || 'https://api.providerx.com';
    
    if (!apiKey) {
      logger.warn('ProviderX API KEY未配置，将使用模拟数据');
    }
    
    super({
      name: 'ProviderX',
      timeout: 8000,
      retryCount: 2,
    });
    
    this.apiKey = apiKey || '';
    this.baseUrl = baseUrl;
    
    logger.info('ProviderX初始化完成', {
      hasApiKey: !!apiKey,
      baseUrl: this.baseUrl
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
      throw new Error('ProviderX API KEY未配置');
    }
    
    // 检查速率限制
    if (this.rateLimitRemaining <= 0 && Date.now() < this.rateLimitReset) {
      throw new Error('ProviderX API速率限制已达上限');
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GuLingTong/1.0'
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
      resetTime: new Date(this.rateLimitReset).toISOString()
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
        change: 15.80,
        change_percent: 0.50,
        open: 3134.45,
        high: 3165.80,
        low: 3128.90,
        volume: 285000000,
        turnover: 320000000000,
        timestamp: Date.now(),
      },
      {
        code: '399001', 
        name: 'ProviderX深证成指',
        current: 10850.75,
        change: -25.30,
        change_percent: -0.23,
        open: 10876.05,
        high: 10890.20,
        low: 10835.60,
        volume: 195000000,
        turnover: 280000000000,
        timestamp: Date.now(),
      },
    ];

    return indices.map(index => ({
      ...index,
      metadata: {
        source: 'ProviderX',
        timestamp: Date.now(),
        delay: 200,
      },
    }));
  }

  /**
   * 获取股票报价数据
   */
  async getQuotes(query: QuotesQuery): Promise<QuoteDataWithMetadata[]> {
    await this.delay(150);
    
    const quotes = query.codes.map(code => ({
      code,
      name: `ProviderX股票${code}`,
      current: 50.00 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      change_percent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      turnover: Math.floor(Math.random() * 100000000),
      high: 55.00 + Math.random() * 50,
      low: 45.00 + Math.random() * 50,
      open: 48.00 + Math.random() * 50,
      pre_close: 49.00 + Math.random() * 50,
      timestamp: Date.now(),
    }));

    return quotes.map(quote => ({
      ...quote,
      metadata: {
        source: 'ProviderX',
        timestamp: Date.now(),
        delay: 150,
      },
    }));
  }

  /**
   * 获取K线数据
   */
  async getKline(query: KlineQuery): Promise<KlineDataWithMetadata> {
    await this.delay(300);
    
    const limit = query.limit || 100;
    const klineData = [];
    
    for (let i = 0; i < limit; i++) {
      const timestamp = Date.now() - (limit - i - 1) * 24 * 60 * 60 * 1000;
      const basePrice = 75.00;
      const open = basePrice + (Math.random() - 0.5) * 10;
      const close = open + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;
      
      klineData.push({
        code: query.code,
        period: query.period,
        timestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
        turnover: Math.floor(Math.random() * 100000000),
      });
    }

    return {
      data: klineData,
      metadata: {
        source: 'ProviderX',
        timestamp: Date.now(),
        delay: 300,
      },
    };
  }

  /**
   * 获取新闻数据
   */
  async getNews(query?: NewsQuery): Promise<NewsDataWithMetadata> {
    await this.delay(180);
    
    const limit = query?.limit || 10;
    const newsData = [];
    
    for (let i = 0; i < limit; i++) {
      newsData.push({
        id: `providerx_news_${String(i + 1).padStart(3, '0')}`,
        title: `ProviderX财经新闻标题 ${i + 1}`,
        summary: `这是来自ProviderX的第${i + 1}条财经新闻摘要`,
        content: `这是来自ProviderX的详细新闻内容，包含了重要的市场信息和分析。`,
        source: 'ProviderX财经',
        author: 'ProviderX编辑',
        publish_time: Date.now() - i * 3600000,
        url: `https://providerx.com/news/${i + 1}`,
        tags: ['ProviderX', '财经', '市场'],
        related_stocks: i % 2 === 0 ? ['000001'] : [],
        sentiment: (i % 3 === 0 ? 'positive' : i % 3 === 1 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      });
    }

    return {
      data: newsData,
      pagination: {
        page: 1,
        limit,
        total: newsData.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      metadata: {
        source: 'ProviderX',
        timestamp: Date.now(),
        delay: 180,
      },
    };
  }
}