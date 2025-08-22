/**
 * 古灵通 Shared SDK
 * 提供 API 类型定义、客户端和工具函数
 */

// 导出客户端和生成的类型
export * from './client';

// 导出便捷创建函数
export { createGulingtongClient, type GulingtongClient } from './client';

// 导出合规组件相关
export * from './types/compliance';
export {
  ComplianceConfigManager,
  getComplianceConfig,
  getDisclaimerConfig,
  getDataSourceConfig,
  isComplianceEnabled,
  getPageComplianceConfig,
} from './client/compliance-config';

// 导出国际化工具函数
export {
  LanguageManager,
  getSystemLanguage,
  getText,
  createI18nText,
  isValidI18nText,
  getLanguageManager,
  getCurrentLanguage,
  setCurrentLanguage,
  toggleLanguage,
  onLanguageChange,
  offLanguageChange,
  CommonTexts,
} from './utils/i18n';

// 版本信息
export const SDK_VERSION = '1.0.0';

// 默认配置
export const DEFAULT_CONFIG = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:3001',
    timeout: 10000,
  },
  // 生产环境
  production: {
    baseURL: 'https://api.gulingtong.com',
    timeout: 15000,
  },
  // 测试环境
  staging: {
    baseURL: 'https://api-staging.gulingtong.com',
    timeout: 12000,
  },
} as const;

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(
  env: keyof typeof DEFAULT_CONFIG = 'development'
) {
  return DEFAULT_CONFIG[env];
}
