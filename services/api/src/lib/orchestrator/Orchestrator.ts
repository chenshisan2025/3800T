import logger from '@/lib/logger';
import {
  LLMProvider,
  LLMProviderFactory,
  LLMProviderType,
  LLMAnalysisConfig,
  LLMAnalysisResponse,
} from '../ai/providers/LLMProvider';
import { getDataProviderManager } from '../providers';

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // 基础延迟（毫秒）
  maxDelay: number; // 最大延迟（毫秒）
  backoffMultiplier: number; // 退避倍数
}

/**
 * 费用控制配置
 */
export interface CostControlConfig {
  maxDailyCost: number; // 每日最大费用（美元）
  maxMonthlyCost: number; // 每月最大费用（美元）
  tokenPricing: {
    [key in LLMProviderType]?: {
      inputTokenPrice: number; // 每千个输入token的价格
      outputTokenPrice: number; // 每千个输出token的价格
    };
  };
}

/**
 * 费用统计
 */
export interface CostStats {
  dailyCost: number;
  monthlyCost: number;
  totalTokens: number;
  requestCount: number;
  lastResetDate: string;
}

/**
 * Orchestrator请求配置
 */
export interface OrchestratorConfig {
  llmProvider: LLMProviderType;
  llmConfig?: LLMAnalysisConfig;
  retryConfig?: RetryConfig;
  enableCostControl?: boolean;
  enableSafetyWording?: boolean;
  enableReferences?: boolean;
}

/**
 * Orchestrator响应
 */
export interface OrchestratorResponse {
  content: string;
  references?: string[];
  safetyNotice?: string;
  metadata: {
    provider: LLMProviderType;
    model: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    cost?: number;
    retryCount: number;
    processingTime: number;
  };
}

/**
 * AI分析协调器
 * 负责协调LLM提供商、重试机制、费用控制等
 */
export class Orchestrator {
  private llmProvider: LLMProvider | null = null;
  private costStats: CostStats;
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };
  private readonly defaultCostControl: CostControlConfig = {
    maxDailyCost: 50, // $50/day
    maxMonthlyCost: 1000, // $1000/month
    tokenPricing: {
      openai: {
        inputTokenPrice: 0.03, // GPT-4 pricing per 1K tokens
        outputTokenPrice: 0.06,
      },
      claude: {
        inputTokenPrice: 0.015, // Claude-3 Sonnet pricing per 1K tokens
        outputTokenPrice: 0.075,
      },
      gemini: {
        inputTokenPrice: 0.00125, // Gemini Pro pricing per 1K tokens
        outputTokenPrice: 0.00375,
      },
    },
  };

  constructor() {
    this.costStats = this.loadCostStats();
    this.resetStatsIfNeeded();
  }

  /**
   * 初始化LLM提供商
   */
  async initializeLLMProvider(
    providerType: LLMProviderType,
    config?: LLMAnalysisConfig
  ): Promise<void> {
    try {
      const apiKeys = {
        openai: process.env.OPENAI_API_KEY,
        claude: process.env.ANTHROPIC_API_KEY,
        gemini: process.env.GOOGLE_API_KEY,
        mock: undefined,
      };

      const apiKey = apiKeys[providerType];
      if (providerType !== 'mock' && !apiKey) {
        throw new Error(`API key not configured for ${providerType}`);
      }

      this.llmProvider = LLMProviderFactory.createProvider(
        providerType,
        apiKey,
        config
      );

      // 健康检查
      const isHealthy = await this.llmProvider.healthCheck();
      if (!isHealthy) {
        throw new Error(`LLM provider ${providerType} health check failed`);
      }

      logger.info('LLM提供商初始化成功', {
        provider: providerType,
        model: config?.model || 'default',
      });
    } catch (error) {
      logger.error('LLM提供商初始化失败', {
        provider: providerType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 执行AI分析（带重试和费用控制）
   */
  async analyze(
    prompt: string,
    config: OrchestratorConfig
  ): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    let retryCount = 0;
    const retryConfig = { ...this.defaultRetryConfig, ...config.retryConfig };

    if (!this.llmProvider) {
      await this.initializeLLMProvider(config.llmProvider, config.llmConfig);
    }

    // 费用控制检查
    if (config.enableCostControl !== false) {
      this.checkCostLimits();
    }

    while (retryCount <= retryConfig.maxRetries) {
      try {
        const response = await this.llmProvider!.analyzeWithMetadata(
          prompt,
          config.llmConfig
        );

        // 计算费用
        const cost = this.calculateCost(response);
        this.updateCostStats(cost, response.usage?.total_tokens || 0);

        // 处理响应内容
        let processedContent = response.content;
        let references: string[] | undefined;
        let safetyNotice: string | undefined;

        if (config.enableReferences) {
          const { content, refs } = this.extractReferences(processedContent);
          processedContent = content;
          references = refs;
        }

        if (config.enableSafetyWording) {
          const { content, notice } = this.applySafetyWording(processedContent);
          processedContent = content;
          safetyNotice = notice;
        }

        const processingTime = Date.now() - startTime;

        logger.info('Orchestrator分析完成', {
          provider: response.provider,
          model: response.model,
          retryCount,
          processingTime,
          cost,
          tokenUsage: response.usage,
        });

        return {
          content: processedContent,
          references,
          safetyNotice,
          metadata: {
            provider: response.provider,
            model: response.model,
            usage: response.usage,
            cost,
            retryCount,
            processingTime,
          },
        };
      } catch (error) {
        retryCount++;

        if (retryCount > retryConfig.maxRetries) {
          logger.error('Orchestrator分析最终失败', {
            provider: config.llmProvider,
            retryCount: retryCount - 1,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }

        // 计算延迟时间（指数退避）
        const delay = Math.min(
          retryConfig.baseDelay *
            Math.pow(retryConfig.backoffMultiplier, retryCount - 1),
          retryConfig.maxDelay
        );

        logger.warn('Orchestrator分析重试', {
          provider: config.llmProvider,
          retryCount,
          delay,
          error: error instanceof Error ? error.message : String(error),
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unexpected error in retry loop');
  }

  /**
   * 检查费用限制
   */
  private checkCostLimits(): void {
    if (this.costStats.dailyCost >= this.defaultCostControl.maxDailyCost) {
      throw new Error(
        `Daily cost limit exceeded: $${this.costStats.dailyCost.toFixed(2)}`
      );
    }

    if (this.costStats.monthlyCost >= this.defaultCostControl.maxMonthlyCost) {
      throw new Error(
        `Monthly cost limit exceeded: $${this.costStats.monthlyCost.toFixed(2)}`
      );
    }
  }

  /**
   * 计算API调用费用
   */
  private calculateCost(response: LLMAnalysisResponse): number {
    if (!response.usage) {
      return 0;
    }

    const pricing = this.defaultCostControl.tokenPricing[response.provider];
    if (!pricing) {
      return 0;
    }

    const inputCost =
      (response.usage.prompt_tokens / 1000) * pricing.inputTokenPrice;
    const outputCost =
      (response.usage.completion_tokens / 1000) * pricing.outputTokenPrice;

    return inputCost + outputCost;
  }

  /**
   * 更新费用统计
   */
  private updateCostStats(cost: number, tokens: number): void {
    this.costStats.dailyCost += cost;
    this.costStats.monthlyCost += cost;
    this.costStats.totalTokens += tokens;
    this.costStats.requestCount += 1;

    this.saveCostStats();
  }

  /**
   * 提取引用信息
   */
  private extractReferences(content: string): {
    content: string;
    refs: string[];
  } {
    const references: string[] = [];
    const referencePattern = /\[参考：([^\]]+)\]/g;
    let match;

    while ((match = referencePattern.exec(content)) !== null) {
      references.push(match[1]);
    }

    // 移除引用标记，保留干净的内容
    const cleanContent = content.replace(referencePattern, '').trim();

    return { content: cleanContent, refs: references };
  }

  /**
   * 应用安全措辞
   */
  private applySafetyWording(content: string): {
    content: string;
    notice: string;
  } {
    // 替换强烈的措辞为温和的表达
    const safetyReplacements = {
      必须: '建议',
      一定会: '倾向于',
      肯定: '可能',
      绝对: '相对',
      确定: '预期',
      保证: '预计',
      断定: '判断',
    };

    let processedContent = content;
    for (const [original, replacement] of Object.entries(safetyReplacements)) {
      processedContent = processedContent.replace(
        new RegExp(original, 'g'),
        replacement
      );
    }

    const safetyNotice =
      '本分析仅供参考，投资有风险，决策需谨慎。市场情况瞬息万变，请结合实际情况做出投资决策。';

    return { content: processedContent, notice: safetyNotice };
  }

  /**
   * 获取费用统计
   */
  getCostStats(): CostStats {
    return { ...this.costStats };
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus() {
    const dataManager = getDataProviderManager();
    const dataProviderStatus = await dataManager.healthCheck();
    const dataProviderInfo = dataManager.getCurrentProviderInfo();

    let llmStatus = false;
    let llmProvider = 'none';

    if (this.llmProvider) {
      llmStatus = await this.llmProvider.healthCheck();
      llmProvider = this.llmProvider.getProviderType();
    }

    return {
      dataProvider: {
        status: dataProviderStatus,
        provider: dataProviderInfo.name,
        isPrimary: dataProviderInfo.isPrimary,
        isFallback: dataProviderInfo.isFallback,
      },
      llmProvider: {
        status: llmStatus,
        provider: llmProvider,
        config: this.llmProvider?.getConfig(),
      },
      costStats: this.costStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 重置费用统计（如果需要）
   */
  private resetStatsIfNeeded(): void {
    const now = new Date();
    const lastReset = new Date(this.costStats.lastResetDate);

    // 如果是新的一天，重置日费用
    if (now.toDateString() !== lastReset.toDateString()) {
      this.costStats.dailyCost = 0;
      this.costStats.lastResetDate = now.toISOString();
    }

    // 如果是新的一月，重置月费用
    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      this.costStats.monthlyCost = 0;
    }

    this.saveCostStats();
  }

  /**
   * 加载费用统计
   */
  private loadCostStats(): CostStats {
    // 在实际应用中，这里应该从数据库或文件系统加载
    // 这里使用内存存储作为示例
    return {
      dailyCost: 0,
      monthlyCost: 0,
      totalTokens: 0,
      requestCount: 0,
      lastResetDate: new Date().toISOString(),
    };
  }

  /**
   * 保存费用统计
   */
  private saveCostStats(): void {
    // 在实际应用中，这里应该保存到数据库或文件系统
    // 这里使用内存存储作为示例
    logger.debug('费用统计已更新', this.costStats);
  }
}

// 单例实例
let orchestratorInstance: Orchestrator | null = null;

/**
 * 获取Orchestrator单例实例
 */
export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}

/**
 * 重置Orchestrator实例（用于测试或配置更新）
 */
export function resetOrchestrator(): void {
  orchestratorInstance = null;
}
