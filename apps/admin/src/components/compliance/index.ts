// 合规组件统一导出
export { default as Disclaimer } from './Disclaimer';
export {
  InvestmentDisclaimer,
  DataDisclaimer,
  AIDisclaimer,
  GeneralDisclaimer,
} from './Disclaimer';

export { default as DataSourceHint } from './DataSourceHint';
export {
  RealtimeDataHint,
  DelayedDataHint,
  HistoricalDataHint,
  EstimatedDataHint,
} from './DataSourceHint';

// 导出类型
export type {
  DisclaimerProps,
  DataSourceHintProps,
  DisclaimerConfig,
  DataSourceConfig,
  SupportedLanguage,
  ComponentPosition,
  ComponentTheme,
} from '@gulingtong/shared-sdk';
