import {
  IndexDataWithMetadata,
  QuoteDataWithMetadata,
  KlineDataWithMetadata,
  NewsDataWithMetadata,
  IndicesQuery,
  QuotesQuery,
  KlineQuery,
  NewsQuery,
  IDataProvider,
} from '@/types';
import { MockProvider } from './MockProvider';
import { ProviderX } from './ProviderX';
import logger from '@/lib/logger';

/**
 * 数据提供者管理器
 * 负责管理多个数据提供者，支持主备切换和失败回退
 */
export class DataProviderManager {
  private primaryProvider: IDataProvider;
  private fallbackProvider: IDataProvider;
  private currentProvider: IDataProvider;

  constructor() {
    // 初始化默认的Mock提供者作为回退
    this.fallbackProvider = new MockProvider();
    
    // 根据环境变量选择主要提供者
    this.primaryProvider = this.createPrimaryProvider();
    this.currentProvider = this.primaryProvider;

    logger.info('DataProviderManager 初始化完成', {
      primary: this.primaryProvider.name,
      fallback: this.fallbackProvider.name,
    });
  }

  /**
   * 获取指数数据
   */
  async getIndices(query?: IndicesQuery): Promise<IndexDataWithMetadata[]> {
    return this.executeWithFallback(
      'getIndices',
      async (provider) => provider.getIndices(query),
      query
    );
  }

  /**
   * 获取股票报价数据
   */
  async getQuotes(query: QuotesQuery): Promise<QuoteDataWithMetadata[]> {
    return this.executeWithFallback(
      'getQuotes',
      async (provider) => provider.getQuotes(query),
      query
    );
  }

  /**
   * 获取K线数据
   */
  async getKline(query: KlineQuery): Promise<KlineDataWithMetadata> {
    return this.executeWithFallback(
      'getKline',
      async (provider) => provider.getKline(query),
      query
    );
  }

  /**
   * 获取新闻数据
   */
  async getNews(query?: NewsQuery): Promise<NewsDataWithMetadata> {
    return this.executeWithFallback(
      'getNews',
      async (provider) => provider.getNews(query),
      query
    );
  }

  /**
   * 获取当前使用的提供者信息
   */
  getCurrentProviderInfo() {
    return {
      name: this.currentProvider.name,
      isPrimary: this.currentProvider === this.primaryProvider,
      isFallback: this.currentProvider === this.fallbackProvider,
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    primary: { name: string; healthy: boolean; error?: string };
    fallback: { name: string; healthy: boolean; error?: string };
  }> {
    const results = {
      primary: { name: this.primaryProvider.name, healthy: false, error: undefined as string | undefined },
      fallback: { name: this.fallbackProvider.name, healthy: false, error: undefined as string | undefined },
    };

    // 检查主要提供者
    try {
      results.primary.healthy = await this.primaryProvider.healthCheck();
    } catch (error) {
      results.primary.error = error instanceof Error ? error.message : String(error);
      logger.warn('主要数据提供者健康检查失败', {
        provider: this.primaryProvider.name,
        error: results.primary.error,
      });
    }

    // 检查回退提供者
    try {
      results.fallback.healthy = await this.fallbackProvider.healthCheck();
    } catch (error) {
      results.fallback.error = error instanceof Error ? error.message : String(error);
      logger.warn('回退数据提供者健康检查失败', {
        provider: this.fallbackProvider.name,
        error: results.fallback.error,
      });
    }

    return results;
  }

  /**
   * 执行带回退机制的操作
   */
  private async executeWithFallback<T>(
    operation: string,
    executor: (provider: IDataProvider) => Promise<T>,
    query?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // 首先尝试使用主要提供者
      const result = await executor(this.primaryProvider);
      this.currentProvider = this.primaryProvider;
      
      logger.info(`${operation} 成功`, {
        provider: this.primaryProvider.name,
        duration: Date.now() - startTime,
        query,
      });
      
      return result;
    } catch (primaryError) {
      logger.warn(`主要提供者 ${operation} 失败，尝试回退`, {
        provider: this.primaryProvider.name,
        error: primaryError instanceof Error ? primaryError.message : String(primaryError),
        query,
      });

      try {
        // 回退到Mock提供者
        const result = await executor(this.fallbackProvider);
        this.currentProvider = this.fallbackProvider;
        
        logger.info(`${operation} 回退成功`, {
          provider: this.fallbackProvider.name,
          duration: Date.now() - startTime,
          query,
        });
        
        return result;
      } catch (fallbackError) {
        logger.error(`所有提供者 ${operation} 都失败`, {
          primaryError: primaryError instanceof Error ? primaryError.message : String(primaryError),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          query,
        });
        
        // 如果所有提供者都失败，抛出原始错误
        throw primaryError;
      }
    }
  }

  /**
   * 根据环境变量创建主要数据提供者
   */
  private createPrimaryProvider(): IDataProvider {
    const providerType = (typeof process !== 'undefined' && process.env && process.env.DATA_PROVIDER_TYPE) || 'mock';
    
    logger.info('创建主要数据提供者', { providerType });
    
    switch (providerType.toLowerCase()) {
      case 'providerx':
        return new ProviderX();
      
      case 'mock':
      default:
        return new MockProvider();
      
      // 未来可以添加其他提供者
      // case 'tushare':
      //   return new TushareProvider({
      //     apiKey: process.env.TUSHARE_API_KEY!,
      //     baseUrl: process.env.TUSHARE_BASE_URL,
      //   });
      // 
      // case 'akshare':
      //   return new AkshareProvider({
      //     baseUrl: process.env.AKSHARE_BASE_URL,
      //   });
    }
  }

  /**
   * 重新初始化提供者（用于配置更新后）
   */
  async reinitialize(): Promise<void> {
    logger.info('重新初始化数据提供者管理器');
    
    this.primaryProvider = this.createPrimaryProvider();
    this.currentProvider = this.primaryProvider;
    
    // 执行健康检查
    const healthStatus = await this.healthCheck();
    
    logger.info('数据提供者管理器重新初始化完成', {
      primary: this.primaryProvider.name,
      fallback: this.fallbackProvider.name,
      healthStatus,
    });
  }
}

// 导出单例实例
export const dataProviderManager = new DataProviderManager();

/**
 * 获取数据提供者管理器单例实例
 */
export function getDataProviderManager(): DataProviderManager {
  return dataProviderManager;
}