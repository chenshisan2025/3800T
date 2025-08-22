import {
  IndexDataWithMetadata,
  QuoteDataWithMetadata,
  KlineDataWithMetadata,
  NewsDataWithMetadata,
  IndicesQuery,
  QuotesQuery,
  KlineQuery,
  NewsQuery,
  IndexData,
  QuoteData,
  KlineData,
  NewsData,
} from '@/types';
import { BaseProvider } from './BaseProvider';
import logger from '@/lib/logger';

/**
 * 模拟数据提供者
 * 用于开发和测试环境，提供模拟的股票数据
 */
export class MockProvider extends BaseProvider {
  get name(): string {
    return 'MockProvider';
  }

  constructor() {
    super({
      name: 'MockProvider',
      timeout: 1000,
      retryCount: 1,
    });
  }

  /**
   * 获取模拟指数数据
   */
  async getIndices(query?: IndicesQuery): Promise<IndexDataWithMetadata[]> {
    logger.info('MockProvider: 获取指数数据', { query });

    // 模拟网络延迟
    await this.delay(100 + Math.random() * 200);

    const mockIndices: IndexData[] = [
      {
        code: '000001',
        name: '上证指数',
        current: 3200.45,
        change: 15.32,
        change_percent: 0.48,
        open: 3185.13,
        high: 3210.88,
        low: 3180.22,
        volume: 245680000,
        turnover: 312450000000,
        timestamp: Date.now(),
      },
      {
        code: '399001',
        name: '深证成指',
        current: 12580.66,
        change: -28.44,
        change_percent: -0.23,
        open: 12609.1,
        high: 12620.33,
        low: 12565.88,
        volume: 189320000,
        turnover: 198760000000,
        timestamp: Date.now(),
      },
      {
        code: '399006',
        name: '创业板指',
        current: 2456.78,
        change: 12.88,
        change_percent: 0.53,
        open: 2443.9,
        high: 2465.22,
        low: 2440.15,
        volume: 156780000,
        turnover: 145230000000,
        timestamp: Date.now(),
      },
    ];

    const metadata = this.createMetadata(150); // 模拟150ms延迟

    return mockIndices.map(index => ({
      ...index,
      metadata,
    }));
  }

  /**
   * 获取模拟股票报价数据
   */
  async getQuotes(query: QuotesQuery): Promise<QuoteDataWithMetadata[]> {
    logger.info('MockProvider: 获取股票报价', { query });

    // 模拟网络延迟
    await this.delay(80 + Math.random() * 150);

    const metadata = this.createMetadata(120); // 模拟120ms延迟

    return query.codes.map(code => {
      const basePrice = 10 + Math.random() * 90; // 10-100元随机基础价格
      const changePercent = (Math.random() - 0.5) * 0.2; // -10%到+10%随机涨跌幅
      const change = basePrice * changePercent;
      const current = basePrice + change;

      const mockQuote: QuoteData = {
        code,
        name: `股票${code}`,
        current: Number(current.toFixed(2)),
        change: Number(change.toFixed(2)),
        change_percent: Number((changePercent * 100).toFixed(2)),
        open: Number((basePrice * (0.98 + Math.random() * 0.04)).toFixed(2)),
        high: Number((current * (1 + Math.random() * 0.05)).toFixed(2)),
        low: Number((current * (0.95 + Math.random() * 0.05)).toFixed(2)),
        pre_close: Number(basePrice.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        turnover: Math.floor(Math.random() * 1000000000) + 100000000,
        bid1: Number((current * 0.999).toFixed(2)),
        ask1: Number((current * 1.001).toFixed(2)),
        bid1_volume: Math.floor(Math.random() * 10000) + 100,
        ask1_volume: Math.floor(Math.random() * 10000) + 100,
        timestamp: Date.now(),
      };

      return {
        ...mockQuote,
        metadata,
      };
    });
  }

  /**
   * 获取模拟K线数据
   */
  async getKline(query: KlineQuery): Promise<KlineDataWithMetadata> {
    await this.delay(50);

    const klineData: KlineData[] = [];
    const now = Date.now();
    const periodMs = this.getPeriodMilliseconds(query.period);
    const limit = query.limit || 100;

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - i * periodMs;
      const basePrice = 50 + Math.sin(i * 0.1) * 5;
      const volatility = 0.03;

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
        volume: Math.floor(Math.random() * 500000),
        turnover: Math.floor(Math.random() * 5000000),
      });
    }

    return {
      data: klineData,
      metadata: this.createMetadata(50),
    };
  }

  /**
   * 获取模拟新闻数据
   */
  async getNews(query?: NewsQuery): Promise<NewsDataWithMetadata> {
    await this.delay(80);

    const limit = query?.limit || 20;
    const newsData: NewsData[] = [];

    for (let i = 0; i < limit; i++) {
      const publishTime = Date.now() - i * 1800000; // 每30分钟一条新闻

      newsData.push({
        id: `mock_news_${Date.now()}_${i}`,
        title: `模拟新闻标题 ${i + 1}：市场${i % 3 === 0 ? '震荡' : i % 3 === 1 ? '上涨' : '调整'}`,
        summary: `这是第${i + 1}条模拟新闻的摘要，包含重要市场信息。`,
        content: `详细的模拟新闻内容，提供深入的市场分析和投资建议。新闻序号：${i + 1}`,
        source: 'Mock财经',
        author: `模拟作者${String.fromCharCode(65 + (i % 26))}`,
        publishedAt: publishTime,
        url: `https://mock-finance.com/news/${i + 1}`,
        tags: [
          '模拟',
          '财经',
          i % 3 === 0 ? '震荡' : i % 3 === 1 ? '上涨' : '调整',
        ],
        related_stocks: query?.stock_codes || ['000001', '000002', '000300'],
        sentiment:
          i % 3 === 0 ? 'neutral' : i % 3 === 1 ? 'positive' : 'negative',
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
      metadata: this.createMetadata(30),
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    logger.info('MockProvider: 健康检查');

    // 模拟检查延迟
    await this.delay(50);

    return true; // Mock provider 总是健康的
  }

  /**
   * 获取周期对应的毫秒数
   */
  private getPeriodMilliseconds(period: string): number {
    const periodMap: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000,
    };

    return periodMap[period] || periodMap['1d'];
  }
}
