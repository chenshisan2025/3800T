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
        open: 12609.10,
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
        open: 2443.90,
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
    logger.info('MockProvider: 获取K线数据', { query });
    
    // 模拟网络延迟
    await this.delay(200 + Math.random() * 300);

    const { code, period, limit } = query;
    const dataCount = Math.min(limit, 100);
    const basePrice = 50 + Math.random() * 50; // 50-100元基础价格
    
    const klineData: KlineData[] = [];
    let currentPrice = basePrice;
    
    // 生成历史K线数据
    for (let i = dataCount - 1; i >= 0; i--) {
      const timestamp = Date.now() - i * this.getPeriodMilliseconds(period);
      
      // 模拟价格波动
      const volatility = 0.02; // 2%波动率
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      klineData.push({
        code,
        period,
        timestamp,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 100000,
        turnover: Math.floor(Math.random() * 100000000) + 10000000,
      });
      
      currentPrice = close;
    }

    const metadata = this.createMetadata(250); // 模拟250ms延迟

    return {
      data: klineData,
      metadata,
    };
  }

  /**
   * 获取模拟新闻数据
   */
  async getNews(query?: NewsQuery): Promise<NewsDataWithMetadata> {
    logger.info('MockProvider: 获取新闻数据', { query });
    
    // 模拟网络延迟
    await this.delay(150 + Math.random() * 250);

    const mockNews: NewsData[] = [
      {
        id: 'news_001',
        title: 'A股三大指数集体收涨，创业板指涨超1%',
        summary: '今日A股市场表现活跃，三大指数均以红盘报收，市场情绪回暖。',
        content: '今日A股市场表现活跃，上证指数收涨0.48%，深证成指微跌0.23%，创业板指大涨0.53%。两市成交额超过8000亿元，北向资金净流入超过50亿元。',
        source: '财经新闻网',
        author: '张记者',
        publish_time: Date.now() - 3600000, // 1小时前
        url: 'https://example.com/news/001',
        tags: ['A股', '指数', '涨跌'],
        related_stocks: ['000001', '399001', '399006'],
        sentiment: 'positive',
      },
      {
        id: 'news_002',
        title: '科技股午后拉升，人工智能概念股领涨',
        summary: '午后科技股集体发力，AI概念股表现亮眼，多只个股涨停。',
        content: '午后科技股集体发力，人工智能、芯片、软件等板块涨幅居前。其中AI概念股表现最为亮眼，多只个股封涨停板。',
        source: '科技财经',
        author: '李分析师',
        publish_time: Date.now() - 7200000, // 2小时前
        url: 'https://example.com/news/002',
        tags: ['科技股', '人工智能', '涨停'],
        related_stocks: ['000001', '300001'],
        sentiment: 'positive',
      },
      {
        id: 'news_003',
        title: '央行维持政策利率不变，市场预期稳定',
        summary: '央行今日公布利率决议，维持主要政策利率不变，符合市场预期。',
        content: '中国人民银行今日公布最新利率决议，维持1年期LPR和5年期LPR不变，市场流动性保持合理充裕。',
        source: '央行观察',
        author: '王编辑',
        publish_time: Date.now() - 10800000, // 3小时前
        url: 'https://example.com/news/003',
        tags: ['央行', '利率', '政策'],
        related_stocks: [],
        sentiment: 'neutral',
      },
    ];

    const metadata = this.createMetadata(180); // 模拟180ms延迟

    return {
      data: mockNews.slice(0, query?.limit || 20),
      metadata,
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