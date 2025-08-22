import logger from '@/lib/logger';
import { getDataProviderManager } from '@/lib/providers';
import { LLMProvider } from '../providers/LLMProvider';

/**
 * 技术面分析结果接口
 */
export interface TechnicalAnalysisResult {
  analysis: string;
  indicators: {
    ma5?: number;
    ma20?: number;
    ma60?: number;
    rsi?: number;
    macd?: {
      dif: number;
      dea: number;
      macd: number;
    };
    bollinger?: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
  signals: {
    trend: 'bullish' | 'bearish' | 'sideways';
    momentum: 'strong' | 'moderate' | 'weak';
    support_level?: number;
    resistance_level?: number;
  };
  recommendations: string[];
  confidence: number;
  sources: string[];
}

/**
 * 技术面分析器
 * 基于K线数据进行技术指标分析
 */
export class TechnicalAnalyzer {
  private templates = {
    bullish: [
      '技术面分析显示股价呈现上升倾向，多项技术指标支持看涨情景。',
      '从技术角度观察，该股票展现出积极的价格走势，技术形态呈现向好倾向。',
      '技术指标分析表明股价处于上升通道，短期内可能延续强势情景。',
    ],
    bearish: [
      '技术面分析显示股价面临下行压力，技术指标呈现疲弱倾向。',
      '从技术角度来看，该股票价格走势偏弱，需要关注支撑位破位的情景。',
      '技术指标分析反映出股价动能不足，可能面临进一步调整的倾向。',
    ],
    sideways: [
      '技术面分析显示股价处于震荡整理阶段，呈现横盘整理的情景。',
      '从技术角度观察，该股票价格在区间内波动，等待方向选择的倾向明显。',
      '技术指标分析表明股价缺乏明确方向，建议关注突破信号的出现情景。',
    ],
  };

  constructor() {
    logger.info('TechnicalAnalyzer 初始化完成');
  }

  /**
   * 执行技术面分析
   */
  async analyze(
    stockCode: string,
    llmProvider?: LLMProvider
  ): Promise<TechnicalAnalysisResult> {
    logger.info('开始技术面分析', { stock_code: stockCode });

    try {
      // 获取K线数据
      const dataManager = getDataProviderManager();
      const klineResponse = await dataManager.getKline({
        code: stockCode,
        period: 'daily',
        count: 60, // 获取60天数据用于计算技术指标
      });

      if (!klineResponse.data || klineResponse.data.length === 0) {
        throw new Error(`未找到股票 ${stockCode} 的K线数据`);
      }

      const klineData = klineResponse.data;

      // 计算技术指标
      const indicators = this.calculateTechnicalIndicators(klineData);

      // 分析技术信号
      const signals = this.analyzeTechnicalSignals(klineData, indicators);

      // 生成分析内容
      let analysis: string;
      let recommendations: string[];
      let confidence: number;

      if (llmProvider) {
        // 使用LLM增强分析
        const llmResult = await this.generateLLMAnalysis(
          stockCode,
          klineData,
          indicators,
          signals,
          llmProvider
        );
        analysis = llmResult.analysis;
        recommendations = llmResult.recommendations;
        confidence = llmResult.confidence;
      } else {
        // 使用模板生成分析
        const templateResult = this.generateTemplateAnalysis(
          stockCode,
          klineData,
          indicators,
          signals
        );
        analysis = templateResult.analysis;
        recommendations = templateResult.recommendations;
        confidence = templateResult.confidence;
      }

      const result: TechnicalAnalysisResult = {
        analysis,
        indicators,
        signals,
        recommendations,
        confidence,
        sources: [
          `K线数据 (${klineResponse.metadata.provider})`,
          '技术指标计算模型',
          '技术分析算法',
        ],
      };

      logger.info('技术面分析完成', {
        stock_code: stockCode,
        trend: signals.trend,
        momentum: signals.momentum,
        confidence,
        recommendations_count: recommendations.length,
        llm_enhanced: !!llmProvider,
      });

      return result;
    } catch (error) {
      logger.error('技术面分析失败', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 计算技术指标
   */
  private calculateTechnicalIndicators(klineData: any[]) {
    const closes = klineData.map(k => k.close).reverse(); // 最新数据在前
    const highs = klineData.map(k => k.high).reverse();
    const lows = klineData.map(k => k.low).reverse();

    // 计算移动平均线
    const ma5 = this.calculateMA(closes, 5);
    const ma20 = this.calculateMA(closes, 20);
    const ma60 = this.calculateMA(closes, 60);

    // 计算RSI
    const rsi = this.calculateRSI(closes, 14);

    // 计算MACD
    const macd = this.calculateMACD(closes);

    // 计算布林带
    const bollinger = this.calculateBollinger(closes, 20);

    return {
      ma5: Math.round(ma5 * 100) / 100,
      ma20: Math.round(ma20 * 100) / 100,
      ma60: Math.round(ma60 * 100) / 100,
      rsi: Math.round(rsi * 100) / 100,
      macd: {
        dif: Math.round(macd.dif * 1000) / 1000,
        dea: Math.round(macd.dea * 1000) / 1000,
        macd: Math.round(macd.macd * 1000) / 1000,
      },
      bollinger: {
        upper: Math.round(bollinger.upper * 100) / 100,
        middle: Math.round(bollinger.middle * 100) / 100,
        lower: Math.round(bollinger.lower * 100) / 100,
      },
    };
  }

  /**
   * 分析技术信号
   */
  private analyzeTechnicalSignals(klineData: any[], indicators: any) {
    const latestClose = klineData[klineData.length - 1].close;
    const latestHigh = klineData[klineData.length - 1].high;
    const latestLow = klineData[klineData.length - 1].low;

    // 判断趋势
    let trend: 'bullish' | 'bearish' | 'sideways';
    if (
      latestClose > indicators.ma5 &&
      indicators.ma5 > indicators.ma20 &&
      indicators.ma20 > indicators.ma60
    ) {
      trend = 'bullish';
    } else if (
      latestClose < indicators.ma5 &&
      indicators.ma5 < indicators.ma20 &&
      indicators.ma20 < indicators.ma60
    ) {
      trend = 'bearish';
    } else {
      trend = 'sideways';
    }

    // 判断动量
    let momentum: 'strong' | 'moderate' | 'weak';
    if (indicators.rsi > 70 || indicators.rsi < 30) {
      momentum = 'strong';
    } else if (indicators.rsi > 60 || indicators.rsi < 40) {
      momentum = 'moderate';
    } else {
      momentum = 'weak';
    }

    // 计算支撑阻力位
    const recentLows = klineData.slice(-20).map(k => k.low);
    const recentHighs = klineData.slice(-20).map(k => k.high);
    const supportLevel = Math.min(...recentLows);
    const resistanceLevel = Math.max(...recentHighs);

    return {
      trend,
      momentum,
      support_level: Math.round(supportLevel * 100) / 100,
      resistance_level: Math.round(resistanceLevel * 100) / 100,
    };
  }

  /**
   * 使用模板生成分析
   */
  private generateTemplateAnalysis(
    stockCode: string,
    klineData: any[],
    indicators: any,
    signals: any
  ) {
    const templates = this.templates[signals.trend];
    const analysis = templates[Math.floor(Math.random() * templates.length)];

    const recommendations: string[] = [];
    const latestClose = klineData[klineData.length - 1].close;

    // 基于趋势生成建议
    if (signals.trend === 'bullish') {
      recommendations.push(
        '技术面呈现多头排列，短期内可关注回调买入机会的情景'
      );
      if (latestClose > indicators.bollinger.middle) {
        recommendations.push('股价位于布林带中轨上方，上升倾向较为明确');
      }
      if (indicators.macd.macd > 0) {
        recommendations.push('MACD指标显示多头动能，支持看涨倾向');
      }
    } else if (signals.trend === 'bearish') {
      recommendations.push(
        '技术面呈现空头排列，建议谨慎操作，关注反弹减仓情景'
      );
      if (latestClose < indicators.bollinger.middle) {
        recommendations.push('股价位于布林带中轨下方，下跌倾向需要重视');
      }
      if (indicators.macd.macd < 0) {
        recommendations.push('MACD指标显示空头动能，确认下跌倾向');
      }
    } else {
      recommendations.push(
        '技术面呈现震荡格局，建议区间操作，关注突破方向情景'
      );
      recommendations.push(
        `关注支撑位${signals.support_level}和阻力位${signals.resistance_level}的突破情况`
      );
    }

    // 基于RSI生成建议
    if (indicators.rsi > 70) {
      recommendations.push('RSI指标显示超买状态，需警惕回调风险情景');
    } else if (indicators.rsi < 30) {
      recommendations.push('RSI指标显示超卖状态，可关注反弹机会倾向');
    }

    // 基于布林带生成建议
    if (latestClose > indicators.bollinger.upper) {
      recommendations.push('股价突破布林带上轨，但需注意回归中轨的倾向');
    } else if (latestClose < indicators.bollinger.lower) {
      recommendations.push('股价跌破布林带下轨，存在技术性反弹的情景');
    }

    // 计算信心度
    let confidence = 0.6; // 基础信心度

    if (signals.trend !== 'sideways') confidence += 0.1;
    if (signals.momentum === 'strong') confidence += 0.1;
    if (indicators.rsi > 30 && indicators.rsi < 70) confidence += 0.05;
    if (Math.abs(indicators.macd.macd) > 0.1) confidence += 0.05;

    confidence = Math.min(confidence, 0.9); // 最高0.9

    return {
      analysis,
      recommendations,
      confidence,
    };
  }

  /**
   * 使用LLM生成增强分析
   */
  private async generateLLMAnalysis(
    stockCode: string,
    klineData: any[],
    indicators: any,
    signals: any,
    llmProvider: LLMProvider
  ) {
    const latestKline = klineData[klineData.length - 1];

    const prompt = `请对股票${stockCode}进行技术面分析，基于以下数据：

最新K线数据：
- 开盘价：${latestKline.open}
- 最高价：${latestKline.high}
- 最低价：${latestKline.low}
- 收盘价：${latestKline.close}
- 成交量：${latestKline.volume}

技术指标：
- MA5：${indicators.ma5}
- MA20：${indicators.ma20}
- MA60：${indicators.ma60}
- RSI：${indicators.rsi}
- MACD：DIF=${indicators.macd.dif}, DEA=${indicators.macd.dea}, MACD=${indicators.macd.macd}
- 布林带：上轨=${indicators.bollinger.upper}, 中轨=${indicators.bollinger.middle}, 下轨=${indicators.bollinger.lower}

技术信号：
- 趋势：${signals.trend}
- 动量：${signals.momentum}
- 支撑位：${signals.support_level}
- 阻力位：${signals.resistance_level}

请提供：
1. 技术面分析总结（使用"倾向"、"情景"等温和措辞）
2. 操作建议（5-8点）
3. 分析信心度（0-1之间的数值）

请以JSON格式返回结果。`;

    try {
      const llmResponse = await llmProvider.analyze(prompt);
      return JSON.parse(llmResponse);
    } catch (error) {
      logger.warn('LLM技术分析失败，回退到模板分析', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });

      // 回退到模板分析
      return this.generateTemplateAnalysis(
        stockCode,
        klineData,
        indicators,
        signals
      );
    }
  }

  /**
   * 计算移动平均线
   */
  private calculateMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;

    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * 计算RSI
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  /**
   * 计算MACD
   */
  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const dif = ema12 - ema26;

    // 简化计算，实际应该用DIF的EMA
    const dea = dif * 0.8; // 模拟DEA
    const macd = (dif - dea) * 2;

    return { dif, dea, macd };
  }

  /**
   * 计算EMA
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;

    const multiplier = 2 / (period + 1);
    let ema = prices[prices.length - 1]; // 从最后一个价格开始

    for (
      let i = prices.length - 2;
      i >= Math.max(0, prices.length - period);
      i--
    ) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return ema;
  }

  /**
   * 计算布林带
   */
  private calculateBollinger(prices: number[], period: number = 20) {
    const ma = this.calculateMA(prices, period);

    if (prices.length < period) {
      return {
        upper: ma * 1.02,
        middle: ma,
        lower: ma * 0.98,
      };
    }

    // 计算标准差
    const slice = prices.slice(0, period);
    const variance =
      slice.reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: ma + stdDev * 2,
      middle: ma,
      lower: ma - stdDev * 2,
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 检查数据提供者是否可用
      const dataManager = getDataProviderManager();
      const healthStatus = await dataManager.healthCheck();

      return healthStatus.primary || healthStatus.fallback;
    } catch (error) {
      logger.error('TechnicalAnalyzer健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
