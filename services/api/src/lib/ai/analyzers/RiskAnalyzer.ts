import logger from '@/lib/logger';
import { LLMProvider } from '../providers/LLMProvider';
import { FundamentalAnalysisResult } from './FundamentalAnalyzer';
import { TechnicalAnalysisResult } from './TechnicalAnalyzer';
import { SentimentAnalysisResult } from './SentimentAnalyzer';

/**
 * 风险分析结果接口
 */
export interface RiskAnalysisResult {
  analysis: string;
  overall_risk_level: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  risk_score: number; // 0-100，数值越高风险越大
  risk_factors: {
    market_risk: {
      level: 'high' | 'medium' | 'low';
      description: string;
      score: number;
    };
    fundamental_risk: {
      level: 'high' | 'medium' | 'low';
      description: string;
      score: number;
    };
    technical_risk: {
      level: 'high' | 'medium' | 'low';
      description: string;
      score: number;
    };
    sentiment_risk: {
      level: 'high' | 'medium' | 'low';
      description: string;
      score: number;
    };
    liquidity_risk: {
      level: 'high' | 'medium' | 'low';
      description: string;
      score: number;
    };
  };
  risk_warnings: string[];
  risk_mitigation: string[];
  confidence: number;
  sources: string[];
}

/**
 * 风险面分析器
 * 综合基本面、技术面、情绪面数据进行风险评估
 */
export class RiskAnalyzer {
  private templates = {
    very_high: [
      '综合风险评估显示该股票面临极高风险，多项指标呈现严重警示倾向，投资需极度谨慎。',
      '风险分析表明该股票处于高危情景，基本面、技术面和情绪面均显示重大风险信号。',
      '从风险管理角度观察，该股票风险敞口巨大，不适合风险承受能力有限的投资者参与。',
    ],
    high: [
      '综合风险评估显示该股票存在较高风险，需要密切关注各项风险因素的变化倾向。',
      '风险分析表明该股票面临多重挑战，投资者应谨慎评估风险承受能力和投资情景。',
      '从风险控制角度来看，该股票风险水平偏高，建议采取适当的风险管理措施。',
    ],
    medium: [
      '综合风险评估显示该股票风险水平适中，存在一定的投资风险但整体可控。',
      '风险分析表明该股票处于中等风险区间，投资者需要平衡收益预期和风险承受情景。',
      '从风险管理角度观察，该股票风险相对均衡，适合有一定风险承受能力的投资者。',
    ],
    low: [
      '综合风险评估显示该股票风险水平较低，各项指标呈现相对稳健的倾向。',
      '风险分析表明该股票具备较好的安全边际，投资风险处于可接受的情景范围内。',
      '从风险控制角度来看，该股票风险相对可控，适合稳健型投资者配置。',
    ],
    very_low: [
      '综合风险评估显示该股票风险极低，各项指标均呈现稳健安全的倾向。',
      '风险分析表明该股票具备优秀的安全特征，投资风险处于极低水平的理想情景。',
      '从风险管理角度观察，该股票风险敞口最小，非常适合保守型投资者长期持有。',
    ],
  };

  constructor() {
    logger.info('RiskAnalyzer 初始化完成');
  }

  /**
   * 执行风险分析
   */
  async analyze(
    stockCode: string,
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    llmProvider?: LLMProvider
  ): Promise<RiskAnalysisResult> {
    logger.info('开始风险分析', { stock_code: stockCode });

    try {
      // 分析各类风险因素
      const riskFactors = this.analyzeRiskFactors(
        fundamentalResult,
        technicalResult,
        sentimentResult
      );

      // 计算综合风险得分
      const riskScore = this.calculateOverallRiskScore(riskFactors);
      const riskLevel = this.getRiskLevel(riskScore);

      // 生成风险警示和缓解建议
      const riskWarnings = this.generateRiskWarnings(riskFactors, riskScore);
      const riskMitigation = this.generateRiskMitigation(
        riskFactors,
        riskLevel
      );

      // 生成分析内容
      let analysis: string;
      let confidence: number;

      if (llmProvider) {
        // 使用LLM增强分析
        const llmResult = await this.generateLLMAnalysis(
          stockCode,
          riskFactors,
          riskScore,
          riskLevel,
          riskWarnings,
          riskMitigation,
          fundamentalResult,
          technicalResult,
          sentimentResult,
          llmProvider
        );
        analysis = llmResult.analysis;
        confidence = llmResult.confidence;
      } else {
        // 使用模板生成分析
        const templateResult = this.generateTemplateAnalysis(
          stockCode,
          riskLevel,
          riskFactors,
          riskScore
        );
        analysis = templateResult.analysis;
        confidence = templateResult.confidence;
      }

      const result: RiskAnalysisResult = {
        analysis,
        overall_risk_level: riskLevel,
        risk_score: riskScore,
        risk_factors: riskFactors,
        risk_warnings: riskWarnings,
        risk_mitigation: riskMitigation,
        confidence,
        sources: this.generateSources(
          fundamentalResult,
          technicalResult,
          sentimentResult
        ),
      };

      logger.info('风险分析完成', {
        stock_code: stockCode,
        risk_level: riskLevel,
        risk_score: riskScore,
        warnings_count: riskWarnings.length,
        mitigation_count: riskMitigation.length,
        confidence,
        llm_enhanced: !!llmProvider,
      });

      return result;
    } catch (error) {
      logger.error('风险分析失败', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 分析各类风险因素
   */
  private analyzeRiskFactors(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult
  ) {
    // 市场风险分析
    const marketRisk = this.analyzeMarketRisk();

    // 基本面风险分析
    const fundamentalRisk = this.analyzeFundamentalRisk(fundamentalResult);

    // 技术面风险分析
    const technicalRisk = this.analyzeTechnicalRisk(technicalResult);

    // 情绪面风险分析
    const sentimentRisk = this.analyzeSentimentRisk(sentimentResult);

    // 流动性风险分析
    const liquidityRisk = this.analyzeLiquidityRisk(technicalResult);

    return {
      market_risk: marketRisk,
      fundamental_risk: fundamentalRisk,
      technical_risk: technicalRisk,
      sentiment_risk: sentimentRisk,
      liquidity_risk: liquidityRisk,
    };
  }

  /**
   * 分析市场风险
   */
  private analyzeMarketRisk() {
    // 模拟市场风险评估（实际应用中应基于市场指数、波动率等数据）
    const marketVolatility = 15 + Math.random() * 20; // 模拟市场波动率 15-35%

    let level: 'high' | 'medium' | 'low';
    let description: string;
    let score: number;

    if (marketVolatility > 28) {
      level = 'high';
      description = '当前市场波动剧烈，系统性风险较高，存在大幅调整的情景可能';
      score = 75 + Math.random() * 20;
    } else if (marketVolatility > 20) {
      level = 'medium';
      description = '市场波动适中，存在一定系统性风险，需关注宏观环境变化倾向';
      score = 45 + Math.random() * 25;
    } else {
      level = 'low';
      description = '市场环境相对稳定，系统性风险较低，整体呈现平稳运行倾向';
      score = 15 + Math.random() * 25;
    }

    return {
      level,
      description,
      score: Math.round(score),
    };
  }

  /**
   * 分析基本面风险
   */
  private analyzeFundamentalRisk(
    fundamentalResult?: FundamentalAnalysisResult
  ) {
    if (!fundamentalResult) {
      return {
        level: 'medium' as const,
        description:
          '缺乏基本面数据，无法准确评估财务风险，建议谨慎对待投资情景',
        score: 50,
      };
    }

    const metrics = fundamentalResult.key_metrics;
    let riskScore = 0;
    let riskFactors: string[] = [];

    // 估值风险
    if (metrics.pe_ratio && metrics.pe_ratio > 30) {
      riskScore += 20;
      riskFactors.push('估值偏高');
    }

    if (metrics.pb_ratio && metrics.pb_ratio > 4) {
      riskScore += 15;
      riskFactors.push('市净率过高');
    }

    // 盈利能力风险
    if (metrics.roe && metrics.roe < 8) {
      riskScore += 20;
      riskFactors.push('盈利能力偏弱');
    }

    // 财务结构风险
    if (metrics.debt_ratio && metrics.debt_ratio > 60) {
      riskScore += 25;
      riskFactors.push('负债率过高');
    }

    // 成长性风险
    if (metrics.revenue_growth && metrics.revenue_growth < -5) {
      riskScore += 20;
      riskFactors.push('营收负增长');
    }

    let level: 'high' | 'medium' | 'low';
    let description: string;

    if (riskScore > 60) {
      level = 'high';
      description = `基本面存在较高风险，主要体现在${riskFactors.join('、')}等方面，需要谨慎评估投资情景`;
    } else if (riskScore > 30) {
      level = 'medium';
      description = `基本面风险适中，${riskFactors.length > 0 ? `需关注${riskFactors.join('、')}等因素` : '整体财务状况相对稳健'}的发展倾向`;
    } else {
      level = 'low';
      description = '基本面风险较低，财务指标表现良好，呈现稳健经营的倾向';
    }

    return {
      level,
      description,
      score: Math.min(100, riskScore),
    };
  }

  /**
   * 分析技术面风险
   */
  private analyzeTechnicalRisk(technicalResult?: TechnicalAnalysisResult) {
    if (!technicalResult) {
      return {
        level: 'medium' as const,
        description:
          '缺乏技术面数据，无法准确评估技术风险，建议关注价格走势情景',
        score: 50,
      };
    }

    let riskScore = 0;
    let riskFactors: string[] = [];

    // 趋势风险
    if (technicalResult.signals.trend === 'bearish') {
      riskScore += 30;
      riskFactors.push('下跌趋势');
    } else if (technicalResult.signals.trend === 'sideways') {
      riskScore += 15;
      riskFactors.push('方向不明');
    }

    // 动量风险
    if (technicalResult.signals.momentum === 'weak') {
      riskScore += 20;
      riskFactors.push('动能不足');
    }

    // RSI风险
    if (technicalResult.indicators.rsi) {
      if (technicalResult.indicators.rsi > 80) {
        riskScore += 25;
        riskFactors.push('严重超买');
      } else if (technicalResult.indicators.rsi > 70) {
        riskScore += 15;
        riskFactors.push('超买状态');
      }
    }

    // MACD风险
    if (
      technicalResult.indicators.macd &&
      technicalResult.indicators.macd.macd < -0.5
    ) {
      riskScore += 20;
      riskFactors.push('MACD背离');
    }

    let level: 'high' | 'medium' | 'low';
    let description: string;

    if (riskScore > 60) {
      level = 'high';
      description = `技术面风险较高，${riskFactors.join('、')}等信号显示价格面临调整压力的情景`;
    } else if (riskScore > 30) {
      level = 'medium';
      description = `技术面风险适中，${riskFactors.length > 0 ? `需关注${riskFactors.join('、')}等技术信号` : '技术指标表现相对平衡'}的变化倾向`;
    } else {
      level = 'low';
      description =
        '技术面风险较低，技术指标支持当前价格走势，呈现相对稳定的倾向';
    }

    return {
      level,
      description,
      score: Math.min(100, riskScore),
    };
  }

  /**
   * 分析情绪面风险
   */
  private analyzeSentimentRisk(sentimentResult?: SentimentAnalysisResult) {
    if (!sentimentResult) {
      return {
        level: 'medium' as const,
        description:
          '缺乏情绪面数据，无法准确评估市场情绪风险，建议关注舆论变化情景',
        score: 50,
      };
    }

    let riskScore = 0;
    let riskFactors: string[] = [];

    // 情绪极端化风险
    if (sentimentResult.sentiment_label === 'very_negative') {
      riskScore += 40;
      riskFactors.push('市场情绪极度悲观');
    } else if (sentimentResult.sentiment_label === 'very_positive') {
      riskScore += 25;
      riskFactors.push('市场情绪过度乐观');
    } else if (sentimentResult.sentiment_label === 'negative') {
      riskScore += 20;
      riskFactors.push('市场情绪偏悲观');
    }

    // 媒体关注度风险
    if (
      sentimentResult.market_mood.media_attention === 'high' &&
      sentimentResult.sentiment_score < -0.3
    ) {
      riskScore += 20;
      riskFactors.push('负面关注度过高');
    }

    // 新闻质量风险
    if (sentimentResult.news_summary.total_count < 5) {
      riskScore += 15;
      riskFactors.push('信息透明度不足');
    }

    // 情绪波动风险
    const negativeRatio =
      sentimentResult.news_summary.negative_count /
      Math.max(1, sentimentResult.news_summary.total_count);
    if (negativeRatio > 0.6) {
      riskScore += 25;
      riskFactors.push('负面消息占主导');
    }

    let level: 'high' | 'medium' | 'low';
    let description: string;

    if (riskScore > 60) {
      level = 'high';
      description = `情绪面风险较高，${riskFactors.join('、')}可能引发市场恐慌情景`;
    } else if (riskScore > 30) {
      level = 'medium';
      description = `情绪面风险适中，${riskFactors.length > 0 ? `需关注${riskFactors.join('、')}等情绪因素` : '市场情绪相对稳定'}的发展倾向`;
    } else {
      level = 'low';
      description = '情绪面风险较低，市场情绪相对理性，呈现平稳发展的倾向';
    }

    return {
      level,
      description,
      score: Math.min(100, riskScore),
    };
  }

  /**
   * 分析流动性风险
   */
  private analyzeLiquidityRisk(technicalResult?: TechnicalAnalysisResult) {
    // 模拟流动性风险评估（实际应用中应基于成交量、换手率等数据）
    const volumeRatio = 0.5 + Math.random() * 1.5; // 模拟成交量比率

    let riskScore = 0;
    let riskFactors: string[] = [];

    if (volumeRatio < 0.8) {
      riskScore += 30;
      riskFactors.push('成交量萎缩');
    }

    // 如果有技术分析结果，考虑价格波动
    if (technicalResult) {
      if (technicalResult.signals.momentum === 'weak') {
        riskScore += 20;
        riskFactors.push('交易活跃度低');
      }
    }

    // 模拟市值因素
    const marketCapFactor = Math.random();
    if (marketCapFactor < 0.3) {
      riskScore += 25;
      riskFactors.push('市值偏小');
    }

    let level: 'high' | 'medium' | 'low';
    let description: string;

    if (riskScore > 50) {
      level = 'high';
      description = `流动性风险较高，${riskFactors.join('、')}可能影响交易执行情景`;
    } else if (riskScore > 25) {
      level = 'medium';
      description = `流动性风险适中，${riskFactors.length > 0 ? `需关注${riskFactors.join('、')}等流动性因素` : '交易流动性相对正常'}的变化倾向`;
    } else {
      level = 'low';
      description = '流动性风险较低，交易活跃度良好，呈现充足流动性的倾向';
    }

    return {
      level,
      description,
      score: Math.min(100, riskScore),
    };
  }

  /**
   * 计算综合风险得分
   */
  private calculateOverallRiskScore(riskFactors: any): number {
    const weights = {
      market_risk: 0.25,
      fundamental_risk: 0.25,
      technical_risk: 0.2,
      sentiment_risk: 0.15,
      liquidity_risk: 0.15,
    };

    let weightedScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      const factor = riskFactors[key];
      if (factor && factor.score !== undefined) {
        weightedScore += factor.score * weight;
      }
    });

    return Math.round(weightedScore);
  }

  /**
   * 获取风险等级
   */
  private getRiskLevel(
    score: number
  ): 'very_high' | 'high' | 'medium' | 'low' | 'very_low' {
    if (score >= 80) return 'very_high';
    if (score >= 65) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  /**
   * 生成风险警示
   */
  private generateRiskWarnings(riskFactors: any, riskScore: number): string[] {
    const warnings: string[] = [];

    if (riskScore >= 70) {
      warnings.push(
        '综合风险评估显示高风险情景，不建议风险承受能力有限的投资者参与'
      );
    }

    Object.entries(riskFactors).forEach(([key, factor]: [string, any]) => {
      if (factor.level === 'high') {
        switch (key) {
          case 'market_risk':
            warnings.push('市场系统性风险较高，需警惕大盘调整对个股的冲击情景');
            break;
          case 'fundamental_risk':
            warnings.push('基本面存在重大风险，公司财务状况需要密切关注');
            break;
          case 'technical_risk':
            warnings.push('技术面显示下跌风险，价格可能面临进一步调整的倾向');
            break;
          case 'sentiment_risk':
            warnings.push('市场情绪极度悲观，可能引发恐慌性抛售情景');
            break;
          case 'liquidity_risk':
            warnings.push(
              '流动性不足可能导致交易困难，存在无法及时止损的风险倾向'
            );
            break;
        }
      }
    });

    if (warnings.length === 0) {
      warnings.push('当前风险水平相对可控，但仍需保持谨慎投资的倾向');
    }

    return warnings;
  }

  /**
   * 生成风险缓解建议
   */
  private generateRiskMitigation(
    riskFactors: any,
    riskLevel: string
  ): string[] {
    const mitigation: string[] = [];

    // 通用风险管理建议
    if (riskLevel === 'very_high' || riskLevel === 'high') {
      mitigation.push('建议严格控制仓位，单一股票配置不超过总资产的5%');
      mitigation.push('设置严格的止损位，及时控制损失扩大的情景');
    } else if (riskLevel === 'medium') {
      mitigation.push('建议适度控制仓位，保持合理的风险敞口');
      mitigation.push('密切关注相关风险因素的变化倾向');
    }

    // 针对性风险缓解建议
    Object.entries(riskFactors).forEach(([key, factor]: [string, any]) => {
      if (factor.level === 'high' || factor.level === 'medium') {
        switch (key) {
          case 'market_risk':
            mitigation.push('关注宏观经济政策变化，适时调整投资策略');
            break;
          case 'fundamental_risk':
            mitigation.push('定期跟踪公司财报，关注基本面改善情景');
            break;
          case 'technical_risk':
            mitigation.push('等待技术面修复信号，避免盲目抄底的倾向');
            break;
          case 'sentiment_risk':
            mitigation.push('保持理性投资心态，避免受市场情绪影响');
            break;
          case 'liquidity_risk':
            mitigation.push('选择交易活跃时段操作，避免流动性不足的情景');
            break;
        }
      }
    });

    // 通用建议
    mitigation.push('建议分散投资，不要将资金集中在单一股票或行业');
    mitigation.push('保持长期投资视角，避免短期市场波动的干扰倾向');

    return mitigation;
  }

  /**
   * 生成数据来源
   */
  private generateSources(
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult
  ): string[] {
    const sources = ['风险评估模型', '综合风险分析算法'];

    if (fundamentalResult) {
      sources.push(...fundamentalResult.sources);
    }

    if (technicalResult) {
      sources.push(...technicalResult.sources);
    }

    if (sentimentResult) {
      sources.push(...sentimentResult.sources);
    }

    // 去重
    return [...new Set(sources)];
  }

  /**
   * 使用模板生成分析
   */
  private generateTemplateAnalysis(
    stockCode: string,
    riskLevel: string,
    riskFactors: any,
    riskScore: number
  ) {
    const templates = this.templates[riskLevel as keyof typeof this.templates];
    const analysis = templates[Math.floor(Math.random() * templates.length)];

    // 计算信心度
    let confidence = 0.7; // 基础信心度

    // 基于风险因素数量调整信心度
    const highRiskCount = Object.values(riskFactors).filter(
      (factor: any) => factor.level === 'high'
    ).length;
    const mediumRiskCount = Object.values(riskFactors).filter(
      (factor: any) => factor.level === 'medium'
    ).length;

    if (highRiskCount === 0 && mediumRiskCount <= 2) {
      confidence += 0.1;
    } else if (highRiskCount >= 3) {
      confidence -= 0.1;
    }

    // 基于风险得分调整信心度
    if (riskScore < 30 || riskScore > 70) {
      confidence += 0.05; // 极端值更容易判断
    }

    confidence = Math.max(0.5, Math.min(0.9, confidence));

    return {
      analysis,
      confidence,
    };
  }

  /**
   * 使用LLM生成增强分析
   */
  private async generateLLMAnalysis(
    stockCode: string,
    riskFactors: any,
    riskScore: number,
    riskLevel: string,
    riskWarnings: string[],
    riskMitigation: string[],
    fundamentalResult?: FundamentalAnalysisResult,
    technicalResult?: TechnicalAnalysisResult,
    sentimentResult?: SentimentAnalysisResult,
    llmProvider?: LLMProvider
  ) {
    const prompt = `请对股票${stockCode}进行综合风险分析，基于以下数据：

风险评估结果：
- 综合风险得分：${riskScore}/100
- 风险等级：${riskLevel}

各类风险因素：
- 市场风险：${riskFactors.market_risk.level} (${riskFactors.market_risk.score}分)
- 基本面风险：${riskFactors.fundamental_risk.level} (${riskFactors.fundamental_risk.score}分)
- 技术面风险：${riskFactors.technical_risk.level} (${riskFactors.technical_risk.score}分)
- 情绪面风险：${riskFactors.sentiment_risk.level} (${riskFactors.sentiment_risk.score}分)
- 流动性风险：${riskFactors.liquidity_risk.level} (${riskFactors.liquidity_risk.score}分)

风险警示：
${riskWarnings.map(warning => `- ${warning}`).join('\n')}

风险缓解建议：
${riskMitigation.map(mitigation => `- ${mitigation}`).join('\n')}

基本面分析信心度：${fundamentalResult?.confidence || 'N/A'}
技术面分析信心度：${technicalResult?.confidence || 'N/A'}
情绪面分析信心度：${sentimentResult?.confidence || 'N/A'}

请提供：
1. 综合风险分析总结（使用"倾向"、"情景"等温和措辞）
2. 分析信心度（0-1之间的数值）

请以JSON格式返回结果。`;

    try {
      if (!llmProvider) {
        throw new Error('LLM provider not available');
      }

      const llmResponse = await llmProvider.analyze(prompt);
      return JSON.parse(llmResponse);
    } catch (error) {
      logger.warn('LLM风险分析失败，回退到模板分析', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });

      // 回退到模板分析
      return this.generateTemplateAnalysis(
        stockCode,
        riskLevel,
        riskFactors,
        riskScore
      );
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 风险分析器主要依赖其他分析器的结果，本身不需要外部数据源
      return true;
    } catch (error) {
      logger.error('RiskAnalyzer健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
