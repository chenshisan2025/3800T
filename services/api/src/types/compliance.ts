/**
 * 合规配置相关类型定义
 * 用于API服务的类型检查和验证
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 支持的语言 */
export type SupportedLanguage = 'zh' | 'en';

/** 国际化文本 */
export interface I18nText {
  zh: string;
  en: string;
}

/** 免责声明类型 */
export type DisclaimerType = 'investment' | 'ai' | 'data' | 'general';

/** 数据源类型 */
export type DataSourceType =
  | 'realtime'
  | 'delayed'
  | 'historical'
  | 'estimated';

/** 组件位置 */
export type ComponentPosition = 'top' | 'bottom' | 'inline';

/** 组件主题 */
export type ComponentTheme =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

// ============================================================================
// 配置相关类型
// ============================================================================

/** 全局合规配置 */
export interface ComplianceGlobalConfig {
  /** 是否启用免责声明 */
  disclaimerEnabled: boolean;
  /** 是否启用数据源提示 */
  dataSourceHintEnabled: boolean;
  /** 配置版本 */
  version: string;
  /** 最后更新时间 */
  lastUpdated: string;
}

/** 免责声明配置 */
export interface DisclaimerConfig {
  /** 免责声明类型 */
  type: DisclaimerType;
  /** 标题 */
  title: I18nText;
  /** 内容 */
  content: I18nText;
  /** 图标 */
  icon: string;
  /** 位置 */
  position: ComponentPosition;
  /** 主题 */
  theme: ComponentTheme;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越大优先级越高） */
  priority: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 数据提供商信息 */
export interface DataProvider {
  /** 提供商名称 */
  name: I18nText;
  /** 提供商代码 */
  code: string;
  /** 官网链接 */
  website?: string;
  /** 数据延迟（分钟） */
  delay: number;
}

/** 数据源配置 */
export interface DataSourceConfig {
  /** 数据源类型 */
  type: DataSourceType;
  /** 标题 */
  title: I18nText;
  /** 描述 */
  description: I18nText;
  /** 数据提供商列表 */
  providers: DataProvider[];
  /** 是否显示延迟信息 */
  showDelay: boolean;
  /** 位置 */
  position: ComponentPosition;
  /** 主题 */
  theme: ComponentTheme;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越大优先级越高） */
  priority: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/** 页面合规配置 */
export interface PageComplianceConfig {
  /** 页面ID */
  pageId: string;
  /** 页面名称 */
  pageName: I18nText;
  /** 启用的 Disclaimer 类型列表 */
  enabledDisclaimers: DisclaimerType[];
  /** 启用的 DataSource 类型列表 */
  enabledDataSources: DataSourceType[];
  /** 是否覆盖全局配置 */
  overrideGlobal: boolean;
}

// ============================================================================
// API 相关类型
// ============================================================================

/** 获取合规配置请求 */
export interface GetComplianceConfigRequest {
  /** 页面ID（可选） */
  pageId?: string;
  /** 语言（可选，默认中文） */
  language?: SupportedLanguage;
}

/** 更新合规配置请求 */
export interface UpdateComplianceConfigRequest {
  /** 全局配置（可选） */
  globalConfig?: Partial<ComplianceGlobalConfig>;
  /** 免责声明配置列表（可选） */
  disclaimerConfigs?: DisclaimerConfig[];
  /** 数据源配置列表（可选） */
  dataSourceConfigs?: DataSourceConfig[];
  /** 页面配置列表（可选） */
  pageConfigs?: PageComplianceConfig[];
}

/** 合规配置数据 */
export interface ComplianceConfigData {
  /** 全局配置 */
  globalConfig: ComplianceGlobalConfig;
  /** 免责声明配置列表 */
  disclaimerConfigs: DisclaimerConfig[];
  /** 数据源配置列表 */
  dataSourceConfigs: DataSourceConfig[];
  /** 页面配置列表 */
  pageConfigs: PageComplianceConfig[];
}

/** 合规配置响应 */
export interface ComplianceConfigResponse {
  success: boolean;
  data: ComplianceConfigData;
  message?: string;
  timestamp: string;
}

// ============================================================================
// 组件上下文类型
// ============================================================================

/** 合规组件上下文 */
export interface ComplianceContext {
  /** 当前页面ID */
  pageId?: string;
  /** 当前语言 */
  language: SupportedLanguage;
  /** 全局配置 */
  globalConfig: ComplianceGlobalConfig;
  /** 页面配置 */
  pageConfig?: PageComplianceConfig;
}
