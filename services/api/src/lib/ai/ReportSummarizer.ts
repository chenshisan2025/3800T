import logger from '@/lib/logger';
import { LLMProvider } from './providers/LLMProvider';
import { FundamentalAnalysisResult } from './analyzers/FundamentalAnalyzer';
import { TechnicalAnalysisResult } from './analyzers/TechnicalAnalyzer';
import { SentimentAnalysisResult } from './analyzers/SentimentAnalyzer';
import { RiskAnalysisResult } from './analyzers/RiskAnalyzer';

/**
 * 投资建议类型
 */
export type InvestmentRecommendation = 'BUY' | 'HOLD' | 'SELL' | 'NEUTRAL';

/**
 * 分析报告汇总结果接口
 */
export interface AnalysisReportSummary {
  recommendation: InvestmentRecommendation;
  recommendation_reason: string;
  confidence: number;
  target_price?: {
    high: number;
    medium: number;
    low: number;
  };
  time_horizon: '短期' | '中期' | '长期';
  risk_warnings: string[];
  key_considerations: string[];
  summary: {
    fundamental: {
      score: number;
      strength: 'strong' | 'moderate' | 'weak';
      key_points: string[];
    };
    technical: {
      score: number;
      trend: 'bullish' | 'bearish' | 'sideways';
      key_points: string[];
    };
    sentiment: {
      score: number;
      mood: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
      key_points: string[];
    };
    risk: {
      score: number;
      level: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
      key_points: string[];
    };
  };
  sources: string[];
  analysis_metadata: {
    analysis_time: string;
    data_freshness: string;
    model_version: string;
    llm_enhanced: boolean;
  };
}

/**
 * 分析报告汇总器
 * 综合各个分析模块的结果，生成最终的投资建议
 */
export class ReportSummarizer {
  private recommendationTemplates = {
    BUY: [
      '综合分析显示该股票具备较好的投资价值，基本面、技术面和情绪面均呈现积极倾向，建议适度配置。',
      '多维度分析表明该股票投资前景良好，各项指标支持看多情景，建议逢低买入。',
      '从投资价值角度观察，该股票展现出较强的上涨潜力，适合风险承受能力适中的投资者参与。',
    ],
    HOLD: [
      '综合分析显示该股票当前处于相对均衡状态，建议现有持仓者继续持有，观察后续发展倾向。',
      '多维度评估表明该股票短期内可能维持震荡格局，建议保持现有仓位，等待更明确的方向信号。',
      '从风险收益角度来看，该股票适合采取持有策略，密切关注基本面和技术面的变化情景。',
    ],
    SELL: [
      '综合分析显示该股票面临较大下行压力，多项指标呈现负面倾向，建议谨慎减仓或退出。',
      '风险评估表明该股票存在明显的调整风险，建议及时止损，避免更大损失的情景。',
      '从风险控制角度观察，该股票不适合当前市场环境，建议转向更安全的投资标的。',
    ],
    NEUTRAL: [
      '综合分析显示该股票各项指标表现平平，缺乏明确的投资方向，建议保持观望态度。',
      '多维度评估表明该股票处于中性区间，投资者可根据个人风险偏好决定参与情景。',
      '从投资策略角度来看，该股票适合作为配置标的，但不建议重仓参与的倾向。',
    ],
  };

  constructor() {
    logger.info('ReportSummarizer 初始化完成');
  }

  /**
   * 生成分析报告汇总
   */
  async generateSummary(
    stockCode: string,
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult,
    llmProvider?: LLMProvider
  ): Promise<AnalysisReportSummary> {
    logger.info('开始生成分析报告汇总', { stock_code: stockCode });

    try {
      // 计算各维度得分
      const scores = this.calculateDimensionScores(
        fundamentalResult,
        technicalResult,
        sentimentResult,
        riskResult
      );

      // 生成投资建议
      const recommendation = this.generateRecommendation(scores, riskResult);
      
      // 生成目标价格（模拟）
      const targetPrice = this.generateTargetPrice(fundamentalResult, technicalResult);
      
      // 确定投资时间范围
      const timeHorizon = this.determineTimeHorizon(recommendation, scores);
      
      // 生成风险警示
      const riskWarnings = this.generateRiskWarnings(riskResult, recommendation);
      
      // 生成关键考虑因素
      const keyConsiderations = this.generateKeyConsiderations(
        fundamentalResult,
        technicalResult,
        sentimentResult,
        riskResult
      );
      
      // 生成各维度汇总
      const summary = this.generateDimensionSummary(
        fundamentalResult,
        technicalResult,
        sentimentResult,
        riskResult,
        scores
      );
      
      // 收集数据来源
      const sources = this.collectSources(
        fundamentalResult,
        technicalResult,
        sentimentResult,
        riskResult
      );

      // 生成建议理由
      let recommendationReason: string;
      let confidence: number;

      if (llmProvider) {
        // 使用LLM生成增强分析
        const llmResult = await this.generateLLMSummary(
          stockCode,
          recommendation,
          scores,
          fundamentalResult,
          technicalResult,
          sentimentResult,
          riskResult,
          llmProvider
        );
        recommendationReason = llmResult.reason;
        confidence = llmResult.confidence;
      } else {
        // 使用模板生成分析
        const templateResult = this.generateTemplateSummary(
          recommendation,
          scores,
          fundamentalResult,
          technicalResult,
          sentimentResult,
          riskResult
        );
        recommendationReason = templateResult.reason;
        confidence = templateResult.confidence;
      }

      const result: AnalysisReportSummary = {
        recommendation,
        recommendation_reason: recommendationReason,
        confidence,
        target_price: targetPrice,
        time_horizon: timeHorizon,
        risk_warnings: riskWarnings,
        key_considerations: keyConsiderations,
        summary,
        sources,
        analysis_metadata: {
          analysis_time: new Date().toISOString(),
          data_freshness: '实时数据',
          model_version: 'v1.0.0',
          llm_enhanced: !!llmProvider,
        },
      };

      logger.info('分析报告汇总生成完成', {
        stock_code: stockCode,
        recommendation,
        confidence,
        time_horizon: timeHorizon,
        risk_warnings_count: riskWarnings.length,
        key_considerations_count: keyConsiderations.length,
        llm_enhanced: !!llmProvider,
      });

      return result;

    } catch (error) {
      logger.error('分析报告汇总生成失败', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 计算各维度得分
   */
  private calculateDimensionScores(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult
  ) {
    // 基本面得分（0-100）
    let fundamentalScore = 50; // 默认中性
    if (fundamentalResult) {
      const strength = fundamentalResult.fundamental_strength;
      fundamentalScore = strength === 'strong' ? 80 : strength === 'moderate' ? 60 : 40;
    }

    // 技术面得分（0-100）
    let technicalScore = 50; // 默认中性
    if (technicalResult) {
      const trend = technicalResult.signals.trend;
      const momentum = technicalResult.signals.momentum;
      
      let baseScore = trend === 'bullish' ? 70 : trend === 'bearish' ? 30 : 50;
      let momentumBonus = momentum === 'strong' ? 15 : momentum === 'moderate' ? 5 : -10;
      
      technicalScore = Math.max(0, Math.min(100, baseScore + momentumBonus));
    }

    // 情绪面得分（0-100）
    let sentimentScore = 50; // 默认中性
    if (sentimentResult) {
      const sentimentValue = sentimentResult.sentiment_score;
      sentimentScore = Math.max(0, Math.min(100, 50 + sentimentValue * 50));
    }

    // 风险得分（0-100，数值越低风险越小）
    let riskScore = 50; // 默认中等风险
    if (riskResult) {
      riskScore = riskResult.risk_score;
    }

    return {
      fundamental: fundamentalScore,
      technical: technicalScore,
      sentiment: sentimentScore,
      risk: riskScore,
    };
  }

  /**
   * 生成投资建议
   */
  private generateRecommendation(
    scores: { fundamental: number; technical: number; sentiment: number; risk: number },
    riskResult?: RiskAnalysisResult
  ): InvestmentRecommendation {
    // 计算综合得分（风险得分需要反向计算）
    const weights = {
      fundamental: 0.35,
      technical: 0.30,
      sentiment: 0.20,
      risk: 0.15, // 风险权重
    };

    const riskAdjustedScore = 100 - scores.risk; // 风险得分反向
    const compositeScore = 
      scores.fundamental * weights.fundamental +
      scores.technical * weights.technical +
      scores.sentiment * weights.sentiment +
      riskAdjustedScore * weights.risk;

    // 风险调整
    let recommendation: InvestmentRecommendation;
    
    if (riskResult && riskResult.overall_risk_level === 'very_high') {
      // 极高风险情况下，即使得分高也不建议买入
      recommendation = compositeScore > 70 ? 'NEUTRAL' : 'SELL';
    } else if (riskResult && riskResult.overall_risk_level === 'high') {
      // 高风险情况下，降低建议等级
      if (compositeScore > 75) recommendation = 'HOLD';
      else if (compositeScore > 60) recommendation = 'NEUTRAL';
      else recommendation = 'SELL';
    } else {
      // 正常风险情况下的建议
      if (compositeScore > 70) recommendation = 'BUY';
      else if (compositeScore > 55) recommendation = 'HOLD';
      else if (compositeScore > 40) recommendation = 'NEUTRAL';
      else recommendation = 'SELL';
    }

    return recommendation;
  }

  /**
   * 生成目标价格（模拟）
   */
  private generateTargetPrice(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult
  ) {
    // 模拟当前价格
    const currentPrice = 50 + Math.random() * 100; // 50-150元
    
    // 基于基本面调整
    let fundamentalMultiplier = 1.0;
    if (fundamentalResult) {
      const strength = fundamentalResult.fundamental_strength;
      fundamentalMultiplier = strength === 'strong' ? 1.15 : strength === 'moderate' ? 1.05 : 0.95;
    }
    
    // 基于技术面调整
    let technicalMultiplier = 1.0;
    if (technicalResult) {
      const trend = technicalResult.signals.trend;
      technicalMultiplier = trend === 'bullish' ? 1.10 : trend === 'bearish' ? 0.90 : 1.0;
    }
    
    const baseTarget = currentPrice * fundamentalMultiplier * technicalMultiplier;
    
    return {
      high: Math.round(baseTarget * 1.15 * 100) / 100,
      medium: Math.round(baseTarget * 100) / 100,
      low: Math.round(baseTarget * 0.85 * 100) / 100,
    };
  }

  /**
   * 确定投资时间范围
   */
  private determineTimeHorizon(
    recommendation: InvestmentRecommendation,
    scores: { fundamental: number; technical: number; sentiment: number; risk: number }
  ): '短期' | '中期' | '长期' {
    // 基本面得分高适合长期投资
    if (scores.fundamental > 70 && recommendation === 'BUY') {
      return '长期';
    }
    
    // 技术面得分高适合短期投资
    if (scores.technical > 70 && scores.fundamental < 60) {
      return '短期';
    }
    
    // 其他情况适合中期投资
    return '中期';
  }

  /**
   * 生成风险警示
   */
  private generateRiskWarnings(
    riskResult?: RiskAnalysisResult,
    recommendation?: InvestmentRecommendation
  ): string[] {
    const warnings: string[] = [];
    
    if (riskResult) {
      // 添加风险分析中的警示
      warnings.push(...riskResult.risk_warnings);
      
      // 基于风险等级添加通用警示
      if (riskResult.overall_risk_level === 'very_high' || riskResult.overall_risk_level === 'high') {
        warnings.push('该股票风险水平较高，请严格控制仓位规模，建议单一持仓不超过总资产的5%');
      }
    }
    
    // 基于建议类型添加警示
    if (recommendation === 'BUY') {
      warnings.push('投资有风险，买入需谨慎，建议分批建仓以降低时点风险的影响倾向');
    } else if (recommendation === 'SELL') {
      warnings.push('市场变化迅速，建议及时关注相关因素变化，适时调整投资策略');
    }
    
    // 通用风险提示
    warnings.push('本分析仅供参考，不构成投资建议，投资者应根据自身情况谨慎决策');
    warnings.push('股市有风险，入市需谨慎，过往业绩不代表未来表现的情景');
    
    return [...new Set(warnings)]; // 去重
  }

  /**
   * 生成关键考虑因素
   */
  private generateKeyConsiderations(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult
  ): string[] {
    const considerations: string[] = [];
    
    // 基本面考虑因素
    if (fundamentalResult) {
      if (fundamentalResult.fundamental_strength === 'strong') {
        considerations.push('公司基本面表现优秀，具备长期投资价值的倾向');
      } else if (fundamentalResult.fundamental_strength === 'weak') {
        considerations.push('公司基本面存在问题，需关注财务状况改善情景');
      }
    }
    
    // 技术面考虑因素
    if (technicalResult) {
      if (technicalResult.signals.trend === 'bullish') {
        considerations.push('技术面呈现上涨趋势，短期内可能继续走强的倾向');
      } else if (technicalResult.signals.trend === 'bearish') {
        considerations.push('技术面显示下跌趋势，需等待技术修复信号的出现情景');
      }
    }
    
    // 情绪面考虑因素
    if (sentimentResult) {
      if (sentimentResult.sentiment_label === 'very_positive' || sentimentResult.sentiment_label === 'positive') {
        considerations.push('市场情绪相对乐观，有利于股价表现的积极倾向');
      } else if (sentimentResult.sentiment_label === 'very_negative' || sentimentResult.sentiment_label === 'negative') {
        considerations.push('市场情绪偏悲观，可能对股价形成压制的不利情景');
      }
    }
    
    // 风险考虑因素
    if (riskResult) {
      if (riskResult.overall_risk_level === 'low' || riskResult.overall_risk_level === 'very_low') {
        considerations.push('整体风险水平较低，适合稳健型投资者配置的安全倾向');
      } else if (riskResult.overall_risk_level === 'high' || riskResult.overall_risk_level === 'very_high') {
        considerations.push('风险水平较高，仅适合风险承受能力强的投资者参与情景');
      }
    }
    
    // 通用考虑因素
    considerations.push('建议结合个人风险承受能力和投资目标制定合适的投资策略');
    considerations.push('密切关注相关政策变化和行业发展动态对投资标的的影响倾向');
    
    return considerations;
  }

  /**
   * 生成各维度汇总
   */
  private generateDimensionSummary(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult,
    scores?: { fundamental: number; technical: number; sentiment: number; risk: number }
  ) {
    return {
      fundamental: {
        score: scores?.fundamental || 50,
        strength: (fundamentalResult?.fundamental_strength || 'moderate') as 'strong' | 'moderate' | 'weak',
        key_points: fundamentalResult ? [
          `PE比率: ${fundamentalResult.key_metrics.pe_ratio?.toFixed(2) || 'N/A'}`,
          `ROE: ${fundamentalResult.key_metrics.roe?.toFixed(2) || 'N/A'}%`,
          `负债率: ${fundamentalResult.key_metrics.debt_ratio?.toFixed(2) || 'N/A'}%`,
        ] : ['基本面数据不足'],
      },
      technical: {
        score: scores?.technical || 50,
        trend: (technicalResult?.signals.trend || 'sideways') as 'bullish' | 'bearish' | 'sideways',
        key_points: technicalResult ? [
          `趋势: ${technicalResult.signals.trend}`,
          `动量: ${technicalResult.signals.momentum}`,
          `RSI: ${technicalResult.indicators.rsi?.toFixed(2) || 'N/A'}`,
        ] : ['技术面数据不足'],
      },
      sentiment: {
        score: scores?.sentiment || 50,
        mood: (sentimentResult?.sentiment_label || 'neutral') as 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative',
        key_points: sentimentResult ? [
          `情绪得分: ${sentimentResult.sentiment_score.toFixed(2)}`,
          `正面新闻: ${sentimentResult.news_summary.positive_count}条`,
          `负面新闻: ${sentimentResult.news_summary.negative_count}条`,
        ] : ['情绪面数据不足'],
      },
      risk: {
        score: scores?.risk || 50,
        level: (riskResult?.overall_risk_level || 'medium') as 'very_high' | 'high' | 'medium' | 'low' | 'very_low',
        key_points: riskResult ? [
          `综合风险得分: ${riskResult.risk_score}/100`,
          `市场风险: ${riskResult.risk_factors.market_risk.level}`,
          `基本面风险: ${riskResult.risk_factors.fundamental_risk.level}`,
        ] : ['风险评估数据不足'],
      },
    };
  }

  /**
   * 收集数据来源
   */
  private collectSources(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult
  ): string[] {
    const sources = ['AI分析报告汇总系统', '综合投资建议算法'];
    
    if (fundamentalResult) sources.push(...fundamentalResult.sources);
    if (technicalResult) sources.push(...technicalResult.sources);
    if (sentimentResult) sources.push(...sentimentResult.sources);
    if (riskResult) sources.push(...riskResult.sources);
    
    return [...new Set(sources)]; // 去重
  }

  /**
   * 使用模板生成汇总
   */
  private generateTemplateSummary(
    recommendation: InvestmentRecommendation,
    scores: { fundamental: number; technical: number; sentiment: number; risk: number },
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult
  ) {
    const templates = this.recommendationTemplates[recommendation];
    const reason = templates[Math.floor(Math.random() * templates.length)];
    
    // 计算信心度
    let confidence = 0.7; // 基础信心度
    
    // 基于各维度得分的一致性调整信心度
    const scoreVariance = this.calculateScoreVariance(scores);
    if (scoreVariance < 200) { // 得分较为一致
      confidence += 0.1;
    } else if (scoreVariance > 500) { // 得分差异较大
      confidence -= 0.1;
    }
    
    // 基于风险水平调整信心度
    if (riskResult) {
      if (riskResult.overall_risk_level === 'very_high') {
        confidence -= 0.15;
      } else if (riskResult.overall_risk_level === 'very_low') {
        confidence += 0.1;
      }
    }
    
    // 基于数据完整性调整信心度
    const dataCompleteness = [fundamentalResult, technicalResult, sentimentResult, riskResult]
      .filter(result => result !== undefined).length / 4;
    confidence *= dataCompleteness;
    
    confidence = Math.max(0.4, Math.min(0.9, confidence));
    
    return {
      reason,
      confidence,
    };
  }

  /**
   * 计算得分方差
   */
  private calculateScoreVariance(scores: { fundamental: number; technical: number; sentiment: number; risk: number }): number {
    const values = [scores.fundamental, scores.technical, scores.sentiment, 100 - scores.risk];
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * 使用LLM生成增强汇总
   */
  private async generateLLMSummary(
    stockCode: string,
    recommendation: InvestmentRecommendation,
    scores: { fundamental: number; technical: number; sentiment: number; risk: number },
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    riskResult?: RiskAnalysisResult,
    llmProvider?: LLMProvider
  ) {
    const prompt = `请为股票${stockCode}生成投资建议汇总，基于以下分析结果：

投资建议：${recommendation}

各维度得分：
- 基本面得分：${scores.fundamental}/100
- 技术面得分：${scores.technical}/100
- 情绪面得分：${scores.sentiment}/100
- 风险得分：${scores.risk}/100（数值越高风险越大）

基本面分析：
- 强度：${fundamentalResult?.fundamental_strength || 'N/A'}
- 信心度：${fundamentalResult?.confidence || 'N/A'}

技术面分析：
- 趋势：${technicalResult?.signals.trend || 'N/A'}
- 动量：${technicalResult?.signals.momentum || 'N/A'}
- 信心度：${technicalResult?.confidence || 'N/A'}

情绪面分析：
- 情绪标签：${sentimentResult?.sentiment_label || 'N/A'}
- 情绪得分：${sentimentResult?.sentiment_score || 'N/A'}
- 信心度：${sentimentResult?.confidence || 'N/A'}

风险分析：
- 风险等级：${riskResult?.overall_risk_level || 'N/A'}
- 风险得分：${riskResult?.risk_score || 'N/A'}/100
- 信心度：${riskResult?.confidence || 'N/A'}

请提供：
1. 投资建议的详细理由（使用"倾向"、"情景"等温和措辞）
2. 分析信心度（0-1之间的数值）

请以JSON格式返回结果。`;

    try {
      if (!llmProvider) {
        throw new Error('LLM provider not available');
      }
      
      const llmResponse = await llmProvider.analyze(prompt);
      return JSON.parse(llmResponse);
    } catch (error) {
      logger.warn('LLM汇总分析失败，回退到模板分析', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // 回退到模板分析
      return this.generateTemplateSummary(
        recommendation,
        scores,
        fundamentalResult,
        technicalResult,
        sentimentResult,
        riskResult
      );
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 报告汇总器主要依赖其他分析器的结果，本身不需要外部数据源
      return true;
    } catch (error) {
      logger.error('ReportSummarizer健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}