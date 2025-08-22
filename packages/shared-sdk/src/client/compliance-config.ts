/**
 * 合规组件配置管理模块
 * 提供跨端的配置获取、缓存和更新功能
 */

import {
  ComplianceConfigData,
  ComplianceConfigResponse,
  GetComplianceConfigRequest,
  UpdateComplianceConfigRequest,
  ComplianceGlobalConfig,
  DisclaimerConfig,
  DataSourceConfig,
  PageComplianceConfig,
  SupportedLanguage,
  ComponentTheme,
  DisclaimerType,
  DataSourceType,
} from '../types/compliance';

// ============================================================================
// 配置管理类
// ============================================================================

/**
 * 合规组件配置管理器
 */
export class ComplianceConfigManager {
  private static instance: ComplianceConfigManager;
  private configCache: ComplianceConfigData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
  private readonly API_BASE_URL =
    process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3003';

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ComplianceConfigManager {
    if (!ComplianceConfigManager.instance) {
      ComplianceConfigManager.instance = new ComplianceConfigManager();
    }
    return ComplianceConfigManager.instance;
  }

  /**
   * 获取配置数据
   */
  public async getConfig(
    request?: GetComplianceConfigRequest
  ): Promise<ComplianceConfigData> {
    // 检查缓存
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      const queryParams = new URLSearchParams();
      if (request?.pageId) {
        queryParams.append('pageId', request.pageId);
      }
      if (request?.language) {
        queryParams.append('language', request.language);
      }

      const url = `${this.API_BASE_URL}/api/compliance/config${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ComplianceConfigResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch compliance config');
      }

      // 更新缓存
      this.configCache = result.data;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return result.data;
    } catch (error) {
      console.error('Failed to fetch compliance config:', error);
      // 返回默认配置
      return this.getDefaultConfig();
    }
  }

  /**
   * 更新配置数据
   */
  public async updateConfig(
    request: UpdateComplianceConfigRequest
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/compliance/config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ComplianceConfigResponse = await response.json();

      if (result.success) {
        // 清除缓存，强制下次重新获取
        this.clearCache();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to update compliance config:', error);
      return false;
    }
  }

  /**
   * 获取特定类型的 Disclaimer 配置
   */
  public async getDisclaimerConfig(
    type: DisclaimerType,
    language?: SupportedLanguage
  ): Promise<DisclaimerConfig | null> {
    const config = await this.getConfig({ language });
    return (
      config.disclaimerConfigs.find(
        item => item.type === type && item.enabled
      ) || null
    );
  }

  /**
   * 获取特定类型的 DataSource 配置
   */
  public async getDataSourceConfig(
    type: DataSourceType,
    language?: SupportedLanguage
  ): Promise<DataSourceConfig | null> {
    const config = await this.getConfig({ language });
    return (
      config.dataSourceConfigs.find(
        item => item.type === type && item.enabled
      ) || null
    );
  }

  /**
   * 获取页面配置
   */
  public async getPageConfig(
    pageId: string,
    language?: SupportedLanguage
  ): Promise<PageComplianceConfig | null> {
    const config = await this.getConfig({ pageId, language });
    return config.pageConfigs.find(item => item.pageId === pageId) || null;
  }

  /**
   * 检查全局开关状态
   */
  public async isGloballyEnabled(
    component: 'disclaimer' | 'dataSourceHint'
  ): Promise<boolean> {
    const config = await this.getConfig();
    return component === 'disclaimer'
      ? config.globalConfig.disclaimerEnabled
      : config.globalConfig.dataSourceHintEnabled;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.configCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): ComplianceConfigData {
    const now = new Date().toISOString();

    return {
      globalConfig: {
        disclaimerEnabled: true,
        dataSourceHintEnabled: true,
        defaultLanguage: 'zh',
        defaultTheme: 'light',
        showOnMobile: true,
        showOnDesktop: true,
        showOnMiniapp: true,
        updatedAt: now,
      },
      disclaimerConfigs: [
        {
          type: 'investment',
          title: {
            zh: '投资风险提示',
            en: 'Investment Risk Warning',
          },
          content: {
            zh: '投资有风险，入市需谨慎。本平台提供的信息仅供参考，不构成投资建议。请根据自身风险承受能力谨慎投资。',
            en: 'Investment involves risks. Please invest cautiously. Information provided is for reference only and does not constitute investment advice. Please invest prudently based on your risk tolerance.',
          },
          showIcon: true,
          iconName: 'alert-triangle',
          closable: false,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 100,
          createdAt: now,
          updatedAt: now,
        },
        {
          type: 'ai',
          title: {
            zh: 'AI 分析声明',
            en: 'AI Analysis Disclaimer',
          },
          content: {
            zh: 'AI 分析结果基于历史数据和算法模型生成，仅供参考，不保证准确性。请结合市场实际情况和其他专业分析做出投资决策。',
            en: 'AI analysis results are generated based on historical data and algorithmic models, for reference only, and accuracy is not guaranteed. Please make investment decisions based on actual market conditions and other professional analysis.',
          },
          showIcon: true,
          iconName: 'bot',
          closable: true,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 90,
          createdAt: now,
          updatedAt: now,
        },
        {
          type: 'data',
          title: {
            zh: '数据声明',
            en: 'Data Disclaimer',
          },
          content: {
            zh: '本平台展示的股票数据来源于第三方数据提供商，可能存在延迟或错误。请以官方交易所数据为准。',
            en: 'Stock data displayed on this platform is sourced from third-party data providers and may be delayed or contain errors. Please refer to official exchange data.',
          },
          showIcon: true,
          iconName: 'database',
          closable: true,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 80,
          createdAt: now,
          updatedAt: now,
        },
        {
          type: 'general',
          title: {
            zh: '免责声明',
            en: 'General Disclaimer',
          },
          content: {
            zh: '本平台提供的所有信息仅供参考，不构成任何投资、法律或税务建议。使用前请仔细阅读相关条款。',
            en: 'All information provided on this platform is for reference only and does not constitute any investment, legal or tax advice. Please read the relevant terms carefully before use.',
          },
          showIcon: true,
          iconName: 'info',
          closable: true,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 70,
          createdAt: now,
          updatedAt: now,
        },
      ],
      dataSourceConfigs: [
        {
          type: 'realtime',
          provider: {
            name: {
              zh: '实时数据源',
              en: 'Real-time Data',
            },
            website: 'https://example.com',
            delay: 0,
          },
          hint: {
            zh: '实时数据',
            en: 'Real-time data',
          },
          description: {
            zh: '提供实时股票行情数据，数据更新频率为秒级',
            en: 'Provides real-time stock market data with second-level update frequency',
          },
          showDelay: false,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 100,
          createdAt: now,
          updatedAt: now,
        },
        {
          type: 'delayed',
          provider: {
            name: {
              zh: '新浪财经',
              en: 'Sina Finance',
            },
            website: 'https://finance.sina.com.cn',
            delay: 15,
          },
          hint: {
            zh: '数据延迟15分钟',
            en: 'Data delayed by 15 minutes',
          },
          description: {
            zh: '股票行情数据由新浪财经提供，延迟15分钟更新，免费用户可使用',
            en: 'Stock market data provided by Sina Finance, updated with 15-minute delay, available for free users',
          },
          showDelay: true,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 90,
          createdAt: now,
          updatedAt: now,
        },
        {
          type: 'historical',
          provider: {
            name: {
              zh: '历史数据库',
              en: 'Historical Database',
            },
            website: 'https://example.com',
            delay: 0,
          },
          hint: {
            zh: '历史数据',
            en: 'Historical data',
          },
          description: {
            zh: '提供股票历史行情数据，用于技术分析和回测',
            en: 'Provides historical stock market data for technical analysis and backtesting',
          },
          showDelay: false,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 80,
          createdAt: now,
          updatedAt: now,
        },
        {
          type: 'estimated',
          provider: {
            name: {
              zh: '估算数据',
              en: 'Estimated Data',
            },
            website: 'https://example.com',
            delay: 0,
          },
          hint: {
            zh: '估算数据',
            en: 'Estimated data',
          },
          description: {
            zh: '基于算法模型估算的数据，仅供参考，可能与实际情况存在差异',
            en: 'Data estimated based on algorithmic models, for reference only, may differ from actual conditions',
          },
          showDelay: false,
          position: 'bottom',
          theme: 'light',
          enabled: true,
          priority: 70,
          createdAt: now,
          updatedAt: now,
        },
      ],
      pageConfigs: [
        {
          pageId: 'stock-detail',
          pageName: {
            zh: '个股详情',
            en: 'Stock Detail',
          },
          enabledDisclaimers: ['investment', 'data'],
          enabledDataSources: ['delayed'],
          overrideGlobal: false,
        },
        {
          pageId: 'ai-panel',
          pageName: {
            zh: 'AI 面板',
            en: 'AI Panel',
          },
          enabledDisclaimers: ['ai'],
          enabledDataSources: ['delayed'],
          overrideGlobal: false,
        },
      ],
    };
  }
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 获取配置管理器实例
 */
export const getComplianceConfig = () => ComplianceConfigManager.getInstance();

/**
 * 快捷方法：获取 Disclaimer 配置
 */
export const getDisclaimerConfig = async (
  type: DisclaimerType,
  language?: SupportedLanguage
) => {
  return getComplianceConfig().getDisclaimerConfig(type, language);
};

/**
 * 快捷方法：获取 DataSource 配置
 */
export const getDataSourceConfig = async (
  type: DataSourceType,
  language?: SupportedLanguage
) => {
  return getComplianceConfig().getDataSourceConfig(type, language);
};

/**
 * 快捷方法：检查全局开关
 */
export const isComplianceEnabled = async (
  component: 'disclaimer' | 'dataSourceHint'
) => {
  return getComplianceConfig().isGloballyEnabled(component);
};

/**
 * 快捷方法：获取页面配置
 */
export const getPageComplianceConfig = async (
  pageId: string,
  language?: SupportedLanguage
) => {
  return getComplianceConfig().getPageConfig(pageId, language);
};
