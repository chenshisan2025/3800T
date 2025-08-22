// Export all provider classes
export { BaseProvider } from './BaseProvider';
export { MockProvider } from './MockProvider';
export { ProviderX } from './ProviderX';
export {
  DataProviderManager,
  getDataProviderManager,
} from './DataProviderManager';

// Re-export types for convenience
export type {
  IDataProvider,
  DataProviderConfig,
  DataProviderMetadata,
  // Index data types
  IndexData,
  IndexDataWithMetadata,
  IndicesQuery,
  // Quote data types
  QuoteData,
  QuoteDataWithMetadata,
  QuotesQuery,
  // Kline data types
  KlineData,
  KlineDataWithMetadata,
  KlineQuery,
  // News data types
  NewsData,
  NewsDataWithMetadata,
  NewsQuery,
} from '../../types';
