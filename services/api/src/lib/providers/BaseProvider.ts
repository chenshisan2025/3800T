import { 
  IDataProvider, 
  DataProviderConfig, 
  IndexDataWithMetadata, 
  QuoteDataWithMetadata, 
  KlineDataWithMetadata, 
  NewsDataWithMetadata,
  IndicesQuery,
  QuotesQuery,
  KlineQuery,
  NewsQuery,
  DataProviderMetadata
} from '@/types';
import logger from '@/lib/logger';

/**
 * 数据提供者基类
 * 提供通用的错误处理、重试机制和配置管理
 */
export abstract class BaseProvider implements IDataProvider {
  protected config: DataProviderConfig;
  protected timeout: number;
  protected retryCount: number;

  constructor(config: DataProviderConfig) {
    this.config = config;
    this.timeout = config.timeout || 10000; // 默认10秒超时
    this.retryCount = config.retryCount || 3; // 默认重试3次
  }

  abstract get name(): string;

  /**
   * 获取指数数据
   */
  abstract getIndices(query?: IndicesQuery): Promise<IndexDataWithMetadata[]>;

  /**
   * 获取股票报价数据
   */
  abstract getQuotes(query: QuotesQuery): Promise<QuoteDataWithMetadata[]>;

  /**
   * 获取K线数据
   */
  abstract getKline(query: KlineQuery): Promise<KlineDataWithMetadata>;

  /**
   * 获取新闻数据
   */
  abstract getNews(query?: NewsQuery): Promise<NewsDataWithMetadata>;

  /**
   * 健康检查
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 创建元数据
   */
  protected createMetadata(delay: number = 0): DataProviderMetadata {
    return {
      source: this.name,
      delay,
      timestamp: Date.now(),
    };
  }

  /**
   * 带重试的HTTP请求
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryCount: number = this.retryCount
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (retryCount > 0 && this.shouldRetry(error)) {
        logger.warn(`请求失败，正在重试 (剩余 ${retryCount} 次)`, {
          url,
          error: error instanceof Error ? error.message : String(error),
          provider: this.name,
        });
        
        // 指数退避延迟
        await this.delay(Math.pow(2, this.retryCount - retryCount) * 1000);
        return this.fetchWithRetry(url, options, retryCount - 1);
      }

      throw error;
    }
  }

  /**
   * 判断是否应该重试
   */
  protected shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      // 网络错误或超时错误可以重试
      return error.name === 'AbortError' || 
             error.message.includes('fetch') ||
             error.message.includes('timeout') ||
             error.message.includes('ECONNRESET') ||
             error.message.includes('ENOTFOUND');
    }
    return false;
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录错误日志
   */
  protected logError(method: string, error: unknown, context?: any): void {
    logger.error(`${this.name} ${method} 失败`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      provider: this.name,
      context,
    });
  }

  /**
   * 验证配置
   */
  protected validateConfig(): void {
    if (!this.config.name) {
      throw new Error('数据提供者名称不能为空');
    }
  }

  /**
   * 构建请求头
   */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'GuLingTong-API/1.0',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * 构建完整的API URL
   */
  protected buildUrl(endpoint: string, params?: Record<string, any>): string {
    const baseUrl = this.config.baseUrl?.replace(/\/$/, '') || '';
    const url = new URL(endpoint, baseUrl || 'https://api.example.com');
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }
}