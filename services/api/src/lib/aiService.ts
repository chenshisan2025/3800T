import { recordError, ErrorType, ErrorSeverity } from './errorMonitor';
import logger from './logger';

// AI分析类型
export enum AIAnalysisType {
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  SENTIMENT = 'sentiment',
  RISK = 'risk',
  RECOMMENDATION = 'recommendation',
}

// AI分析结果接口
export interface AIAnalysisResult {
  id: string;
  stock_code: string;
  analysis_type: AIAnalysisType;
  title: string;
  content: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence_score: number;
  recommendation: 'buy' | 'hold' | 'sell';
  created_at: Date;
  is_simplified?: boolean; // 标记是否为简版结果
  timeout_notice?: string; // 超时提示信息
}

// AI服务配置
interface AIServiceConfig {
  timeout: number; // 超时时间（毫秒）
  retryAttempts: number; // 重试次数
  enableFallback: boolean; // 是否启用降级
}

class AIService {
  private config: AIServiceConfig = {
    timeout: 10000, // 10秒超时
    retryAttempts: 2,
    enableFallback: true,
  };

  // 生成AI分析报告
  async generateAnalysis(
    stockCode: string,
    analysisType: AIAnalysisType,
    stockData?: any
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.config.retryAttempts) {
      try {
        attempt++;

        // 创建超时Promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(`AI analysis timeout after ${this.config.timeout}ms`)
            );
          }, this.config.timeout);
        });

        // 创建AI分析Promise
        const analysisPromise = this.performAIAnalysis(
          stockCode,
          analysisType,
          stockData
        );

        // 竞争执行，哪个先完成就返回哪个
        const result = await Promise.race([analysisPromise, timeoutPromise]);

        const duration = Date.now() - startTime;
        logger.info(`AI analysis completed for ${stockCode}`, {
          type: analysisType,
          duration,
          attempt,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const isTimeout =
          error instanceof Error && error.message.includes('timeout');

        // 记录错误
        recordError(
          error instanceof Error ? error : 'AI analysis failed',
          ErrorType.AI_SERVICE_ERROR,
          isTimeout ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
          'AIService',
          {
            stockCode,
            analysisType,
            attempt,
            duration,
            isTimeout,
          }
        );

        // 如果是最后一次尝试或者启用了降级，返回简版结果
        if (
          attempt >= this.config.retryAttempts ||
          (isTimeout && this.config.enableFallback)
        ) {
          logger.warn(
            `AI analysis failed for ${stockCode}, returning simplified result`,
            {
              type: analysisType,
              attempts: attempt,
              duration,
              reason: isTimeout ? 'timeout' : 'error',
            }
          );

          return this.generateSimplifiedAnalysis(
            stockCode,
            analysisType,
            stockData,
            isTimeout
          );
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // 这里不应该到达，但为了类型安全
    return this.generateSimplifiedAnalysis(
      stockCode,
      analysisType,
      stockData,
      true
    );
  }

  // 执行实际的AI分析（这里模拟AI服务调用）
  private async performAIAnalysis(
    stockCode: string,
    analysisType: AIAnalysisType,
    stockData?: any
  ): Promise<AIAnalysisResult> {
    // 模拟AI服务调用延迟
    const delay = Math.random() * 8000 + 2000; // 2-10秒随机延迟
    await new Promise(resolve => setTimeout(resolve, delay));

    // 模拟偶发性失败
    if (Math.random() < 0.2) {
      // 20%失败率
      throw new Error('AI service temporarily unavailable');
    }

    // 生成完整的AI分析结果
    return this.generateFullAnalysis(stockCode, analysisType, stockData);
  }

  // 生成完整的AI分析结果
  private generateFullAnalysis(
    stockCode: string,
    analysisType: AIAnalysisType,
    stockData?: any
  ): AIAnalysisResult {
    const analysisTemplates = {
      [AIAnalysisType.TECHNICAL]: {
        title: '技术分析报告',
        content: `基于${stockCode}的技术指标分析，该股票当前处于${this.getRandomTrend()}趋势。移动平均线显示${this.getRandomSignal()}信号，成交量分析表明${this.getRandomVolumeAnalysis()}。建议投资者关注关键支撑位和阻力位的突破情况。`,
        summary: `技术面显示${this.getRandomTrend()}信号`,
      },
      [AIAnalysisType.FUNDAMENTAL]: {
        title: '基本面分析报告',
        content: `${stockCode}的基本面分析显示，公司财务状况${this.getRandomFinancialStatus()}，行业地位${this.getRandomIndustryPosition()}。盈利能力和成长性指标表现${this.getRandomPerformance()}，估值水平${this.getRandomValuation()}。`,
        summary: `基本面评估为${this.getRandomRating()}`,
      },
      [AIAnalysisType.SENTIMENT]: {
        title: '市场情绪分析',
        content: `市场对${stockCode}的整体情绪${this.getRandomSentiment()}。社交媒体讨论热度${this.getRandomHeat()}，投资者信心指数${this.getRandomConfidence()}。新闻面和政策面对股价的影响${this.getRandomImpact()}。`,
        summary: `市场情绪${this.getRandomSentiment()}`,
      },
      [AIAnalysisType.RISK]: {
        title: '风险评估报告',
        content: `${stockCode}的风险评估显示，系统性风险${this.getRandomRisk()}，个股特有风险${this.getRandomSpecificRisk()}。流动性风险和波动性风险需要重点关注。建议投资者根据自身风险承受能力进行配置。`,
        summary: `综合风险等级：${this.getRandomRiskLevel()}`,
      },
      [AIAnalysisType.RECOMMENDATION]: {
        title: '投资建议',
        content: `综合技术面、基本面和市场情绪分析，${stockCode}当前投资价值${this.getRandomValue()}。建议投资策略为${this.getRandomStrategy()}，目标价位${this.getRandomTargetPrice()}。投资者应注意风险控制和仓位管理。`,
        summary: `投资建议：${this.getRandomRecommendation()}`,
      },
    };

    const template = analysisTemplates[analysisType];

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stock_code: stockCode,
      analysis_type: analysisType,
      title: template.title,
      content: template.content,
      summary: template.summary,
      sentiment: this.getRandomSentimentValue(),
      confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100
      recommendation: this.getRandomRecommendationValue(),
      created_at: new Date(),
      is_simplified: false,
    };
  }

  // 生成简版分析结果
  private generateSimplifiedAnalysis(
    stockCode: string,
    analysisType: AIAnalysisType,
    stockData?: any,
    isTimeout: boolean = false
  ): AIAnalysisResult {
    const simplifiedTemplates = {
      [AIAnalysisType.TECHNICAL]: {
        title: '技术分析（简版）',
        content: `${stockCode}技术分析简版：当前价格趋势${this.getRandomTrend()}，建议关注关键技术位。`,
        summary: '技术面简要分析',
      },
      [AIAnalysisType.FUNDAMENTAL]: {
        title: '基本面分析（简版）',
        content: `${stockCode}基本面简版：公司基本面${this.getRandomRating()}，建议关注财报数据。`,
        summary: '基本面简要评估',
      },
      [AIAnalysisType.SENTIMENT]: {
        title: '市场情绪（简版）',
        content: `${stockCode}市场情绪简版：整体情绪${this.getRandomSentiment()}，建议关注市场动态。`,
        summary: '市场情绪简要分析',
      },
      [AIAnalysisType.RISK]: {
        title: '风险评估（简版）',
        content: `${stockCode}风险评估简版：综合风险${this.getRandomRiskLevel()}，请注意风险控制。`,
        summary: '风险简要评估',
      },
      [AIAnalysisType.RECOMMENDATION]: {
        title: '投资建议（简版）',
        content: `${stockCode}投资建议简版：建议${this.getRandomRecommendation()}，请谨慎决策。`,
        summary: '投资建议简要版',
      },
    };

    const template = simplifiedTemplates[analysisType];
    const timeoutNotice = isTimeout
      ? 'AI分析服务响应超时，已为您提供简化版分析结果。完整分析报告将在稍后提供。'
      : 'AI分析服务暂时不可用，已为您提供简化版分析结果。';

    return {
      id: `ai_simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stock_code: stockCode,
      analysis_type: analysisType,
      title: template.title,
      content: template.content,
      summary: template.summary,
      sentiment: 'neutral',
      confidence_score: 60, // 简版结果置信度较低
      recommendation: 'hold',
      created_at: new Date(),
      is_simplified: true,
      timeout_notice: timeoutNotice,
    };
  }

  // 批量生成分析报告
  async generateBatchAnalysis(
    stockCode: string,
    analysisTypes: AIAnalysisType[],
    stockData?: any
  ): Promise<AIAnalysisResult[]> {
    const results = await Promise.allSettled(
      analysisTypes.map(type =>
        this.generateAnalysis(stockCode, type, stockData)
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // 如果某个分析失败，返回简版结果
        recordError(
          result.reason,
          ErrorType.AI_SERVICE_ERROR,
          ErrorSeverity.MEDIUM,
          'AIService.batchAnalysis',
          { stockCode, analysisType: analysisTypes[index] }
        );

        return this.generateSimplifiedAnalysis(
          stockCode,
          analysisTypes[index],
          stockData,
          false
        );
      }
    });
  }

  // 随机生成器方法（用于模拟AI分析结果）
  private getRandomTrend(): string {
    const trends = ['上升', '下降', '震荡', '盘整'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private getRandomSignal(): string {
    const signals = ['买入', '卖出', '持有', '观望'];
    return signals[Math.floor(Math.random() * signals.length)];
  }

  private getRandomVolumeAnalysis(): string {
    const analyses = ['放量上涨', '缩量下跌', '量价配合', '量价背离'];
    return analyses[Math.floor(Math.random() * analyses.length)];
  }

  private getRandomFinancialStatus(): string {
    const statuses = ['良好', '稳健', '一般', '需关注'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomIndustryPosition(): string {
    const positions = ['领先', '中等', '落后'];
    return positions[Math.floor(Math.random() * positions.length)];
  }

  private getRandomPerformance(): string {
    const performances = ['优秀', '良好', '一般', '较差'];
    return performances[Math.floor(Math.random() * performances.length)];
  }

  private getRandomValuation(): string {
    const valuations = ['合理', '偏高', '偏低', '高估'];
    return valuations[Math.floor(Math.random() * valuations.length)];
  }

  private getRandomRating(): string {
    const ratings = ['优秀', '良好', '中等', '一般'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }

  private getRandomSentiment(): string {
    const sentiments = ['积极', '中性', '谨慎', '悲观'];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  private getRandomHeat(): string {
    const heats = ['很高', '较高', '一般', '较低'];
    return heats[Math.floor(Math.random() * heats.length)];
  }

  private getRandomConfidence(): string {
    const confidences = ['较高', '中等', '较低'];
    return confidences[Math.floor(Math.random() * confidences.length)];
  }

  private getRandomImpact(): string {
    const impacts = ['积极', '中性', '负面'];
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  private getRandomRisk(): string {
    const risks = ['较低', '中等', '较高'];
    return risks[Math.floor(Math.random() * risks.length)];
  }

  private getRandomSpecificRisk(): string {
    const risks = ['可控', '需关注', '较高'];
    return risks[Math.floor(Math.random() * risks.length)];
  }

  private getRandomRiskLevel(): string {
    const levels = ['低', '中', '高'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private getRandomValue(): string {
    const values = ['较高', '中等', '较低'];
    return values[Math.floor(Math.random() * values.length)];
  }

  private getRandomStrategy(): string {
    const strategies = ['积极配置', '适度配置', '谨慎配置', '暂时观望'];
    return strategies[Math.floor(Math.random() * strategies.length)];
  }

  private getRandomTargetPrice(): string {
    const base = Math.random() * 100 + 10;
    return `${base.toFixed(2)}元`;
  }

  private getRandomRecommendation(): string {
    const recommendations = ['买入', '持有', '卖出'];
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }

  private getRandomSentimentValue(): 'positive' | 'neutral' | 'negative' {
    const sentiments: ('positive' | 'neutral' | 'negative')[] = [
      'positive',
      'neutral',
      'negative',
    ];
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }

  private getRandomRecommendationValue(): 'buy' | 'hold' | 'sell' {
    const recommendations: ('buy' | 'hold' | 'sell')[] = [
      'buy',
      'hold',
      'sell',
    ];
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  }
}

// 创建全局AI服务实例
export const aiService = new AIService();
