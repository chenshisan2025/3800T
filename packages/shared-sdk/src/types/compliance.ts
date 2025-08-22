/**
 * 合规声明组件类型定义
 * 支持跨端的 Disclaimer 和 DataSourceHint 组件
 */

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 支持的语言类型
 */
export type SupportedLanguage = 'zh' | 'en';

/**
 * 国际化文本类型
 */
export interface I18nText {
  /** 中文文本 */
  zh: string;
  /** 英文文本 */
  en: string;
}

/**
 * 组件显示位置
 */
export type ComponentPosition = 'bottom' | 'top' | 'inline';

/**
 * 组件主题样式
 */
export type ComponentTheme = 'light' | 'dark' | 'auto';

// ============================================================================
// Disclaimer 组件类型
// ============================================================================

/**
 * 免责声明类型
 */
export type DisclaimerType = 'investment' | 'ai' | 'data' | 'general';

/**
 * 免责声明配置
 */
export interface DisclaimerConfig {
  /** 声明类型 */
  type: DisclaimerType;
  /** 声明标题 */
  title: I18nText;
  /** 声明内容 */
  content: I18nText;
  /** 是否显示图标 */
  showIcon: boolean;
  /** 图标名称 */
  iconName?: string;
  /** 是否可关闭 */
  closable: boolean;
  /** 显示位置 */
  position: ComponentPosition;
  /** 主题样式 */
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

/**
 * Disclaimer 组件属性
 */
export interface DisclaimerProps {
  /** 声明类型 */
  type: DisclaimerType;
  /** 当前语言 */
  language?: SupportedLanguage;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否可关闭 */
  closable?: boolean;
  /** 显示位置 */
  position?: ComponentPosition;
  /** 主题样式 */
  theme?: ComponentTheme;
  /** 关闭回调 */
  onClose?: () => void;
}

// ============================================================================
// DataSourceHint 组件类型
// ============================================================================

/**
 * 数据源类型
 */
export type DataSourceType =
  | 'realtime'
  | 'delayed'
  | 'historical'
  | 'estimated';

/**
 * 数据源提供商
 */
export interface DataProvider {
  /** 提供商名称 */
  name: I18nText;
  /** 提供商官网 */
  website?: string;
  /** 数据延迟时间（分钟） */
  delay?: number;
}

/**
 * 数据源配置
 */
export interface DataSourceConfig {
  /** 数据源类型 */
  type: DataSourceType;
  /** 数据提供商 */
  provider: DataProvider;
  /** 提示文本 */
  hint: I18nText;
  /** 详细说明 */
  description: I18nText;
  /** 是否显示延迟信息 */
  showDelay: boolean;
  /** 显示位置 */
  position: ComponentPosition;
  /** 主题样式 */
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

/**
 * DataSourceHint 组件属性
 */
export interface DataSourceHintProps {
  /** 数据源类型 */
  type: DataSourceType;
  /** 当前语言 */
  language?: SupportedLanguage;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示延迟信息 */
  showDelay?: boolean;
  /** 显示位置 */
  position?: ComponentPosition;
  /** 主题样式 */
  theme?: ComponentTheme;
}

// ============================================================================
// 全局配置类型
// ============================================================================

/**
 * 合规组件全局配置
 */
export interface ComplianceGlobalConfig {
  /** 是否全局启用 Disclaimer 组件 */
  disclaimerEnabled: boolean;
  /** 是否全局启用 DataSourceHint 组件 */
  dataSourceHintEnabled: boolean;
  /** 默认语言 */
  defaultLanguage: SupportedLanguage;
  /** 默认主题 */
  defaultTheme: ComponentTheme;
  /** 是否在移动端显示 */
  showOnMobile: boolean;
  /** 是否在桌面端显示 */
  showOnDesktop: boolean;
  /** 是否在小程序显示 */
  showOnMiniapp: boolean;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 页面级配置
 */
export interface PageComplianceConfig {
  /** 页面标识 */
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

/**
 * 获取配置请求参数
 */
export interface GetComplianceConfigRequest {
  /** 页面标识（可选） */
  pageId?: string;
  /** 语言（可选） */
  language?: SupportedLanguage;
}

/**
 * 更新配置请求参数
 */
export interface UpdateComplianceConfigRequest {
  /** 全局配置（可选） */
  globalConfig?: Partial<ComplianceGlobalConfig>;
  /** Disclaimer 配置列表（可选） */
  disclaimerConfigs?: Partial<DisclaimerConfig>[];
  /** DataSource 配置列表（可选） */
  dataSourceConfigs?: Partial<DataSourceConfig>[];
  /** 页面配置列表（可选） */
  pageConfigs?: Partial<PageComplianceConfig>[];
}

/**
 * 配置响应数据
 */
export interface ComplianceConfigData {
  /** 全局配置 */
  globalConfig: ComplianceGlobalConfig;
  /** Disclaimer 配置列表 */
  disclaimerConfigs: DisclaimerConfig[];
  /** DataSource 配置列表 */
  dataSourceConfigs: DataSourceConfig[];
  /** 页面配置列表 */
  pageConfigs: PageComplianceConfig[];
}

/**
 * 配置响应类型
 */
export interface ComplianceConfigResponse {
  success: boolean;
  data: ComplianceConfigData;
  message?: string;
  timestamp: string;
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 组件渲染上下文
 */
export interface ComplianceContext {
  /** 当前语言 */
  language: SupportedLanguage;
  /** 当前主题 */
  theme: ComponentTheme;
  /** 当前页面ID */
  pageId?: string;
  /** 是否为移动端 */
  isMobile: boolean;
  /** 是否为小程序 */
  isMiniapp: boolean;
}

/**
 * 组件事件类型
 */
export interface ComplianceEvents {
  /** 组件显示事件 */
  onShow?: (type: DisclaimerType | DataSourceType) => void;
  /** 组件隐藏事件 */
  onHide?: (type: DisclaimerType | DataSourceType) => void;
  /** 组件点击事件 */
  onClick?: (type: DisclaimerType | DataSourceType) => void;
  /** 组件关闭事件 */
  onClose?: (type: DisclaimerType | DataSourceType) => void;
}
