import logger from '@/lib/logger';
import { getDataProviderManager } from '@/lib/providers';
import { LLMProvider } from '../providers/LLMProvider';

/**
 * 基本面分析结果接口
 */
export interface FundamentalAnalysisResult {
  analysis: string;
  key_metrics: {
    pe_ratio?: number;
    pb_ratio?: number;
    roe?: number;
    debt_ratio?: number;
    revenue_growth?: number;
  };
  strengths: string[];
  weaknesses: string[];
  outlook: string;
  confidence: number;
  sources: string[];
}

/**
 * 基本面分析器
 * 基于股票行情数据进行基本面分析
 */
export class FundamentalAnalyzer {
  private templates = {
    strong: [
      '该股票基本面表现较为稳健，财务指标显示出良好的盈利能力倾向。',
      '从基本面角度分析，公司展现出稳定的经营情景，核心指标表现积极。',
      '基本面数据反映出公司具备较强的竞争优势，在行业中呈现领先倾向。',
    ],
    moderate: [
      '基本面分析显示公司处于稳定发展阶段，各项指标表现中等偏上。',
      '从财务数据来看，公司基本面呈现稳健发展的情景，具备一定投资价值。',
      '基本面指标反映出公司经营状况良好，但仍存在进一步提升的空间。',
    ],
    weak: [
      '基本面分析显示公司面临一定挑战，部分财务指标存在改善倾向的需求。',
      '从基本面角度观察，公司正处于调整期情景，需要关注后续经营改善。',
      '基本面数据反映出公司存在一些经营压力，投资需谨慎评估风险情景。',
    ],
  };

  constructor() {
    logger.info('FundamentalAnalyzer 初始化完成');
  }

  /**
   * 执行基本面分析
   */
  async analyze(
    stockCode: string,
    llmProvider?: LLMProvider
  ): Promise<FundamentalAnalysisResult> {
    logger.info('开始基本面分析', { stock_code: stockCode });

    try {
      // 获取股票行情数据
      const dataManager = getDataProviderManager();
      const quotesResponse = await dataManager.getQuotes({
        codes: [stockCode],
        fields: ['price', 'change', 'change_percent', 'volume', 'market_cap'],
      });

      const stockData = quotesResponse.find(quote => quote.data.code === stockCode);
      if (!stockData) {
        throw new Error(`未找到股票 ${stockCode} 的行情数据`);
      }

      const quote = stockData.data;

      // 模拟基本面指标计算（基于行情数据）
      const keyMetrics = this.calculateKeyMetrics(quote);
      
      // 评估基本面强度
      const fundamentalStrength = this.assessFundamentalStrength(keyMetrics, stockData);
      
      // 生成分析内容
      let analysis: string;
      let strengths: string[];
      let weaknesses: string[];
      let outlook: string;
      let confidence: number;

      if (llmProvider) {
        // 使用LLM增强分析
        const llmResult = await this.generateLLMAnalysis(
          stockCode,
          stockData,
          keyMetrics,
          llmProvider
        );
        analysis = llmResult.analysis;
        strengths = llmResult.strengths;
        weaknesses = llmResult.weaknesses;
        outlook = llmResult.outlook;
        confidence = llmResult.confidence;
      } else {
        // 使用模板生成分析
        const templateResult = this.generateTemplateAnalysis(
          stockCode,
          stockData,
          keyMetrics,
          fundamentalStrength
        );
        analysis = templateResult.analysis;
        strengths = templateResult.strengths;
        weaknesses = templateResult.weaknesses;
        outlook = templateResult.outlook;
        confidence = templateResult.confidence;
      }

      const result: FundamentalAnalysisResult = {
        analysis,
        key_metrics: keyMetrics,
        strengths,
        weaknesses,
        outlook,
        confidence,
        sources: [
          `股票行情数据 (${stockData.metadata?.source || 'Unknown'})`,
          '基本面分析模型',
        ],
      };

      logger.info('基本面分析完成', {
        stock_code: stockCode,
        confidence,
        strengths_count: strengths.length,
        weaknesses_count: weaknesses.length,
        llm_enhanced: !!llmProvider,
      });

      return result;

    } catch (error) {
      logger.error('基本面分析失败', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 计算关键基本面指标
   */
  private calculateKeyMetrics(stockData: any) {
    // 基于行情数据模拟计算基本面指标
    const price = stockData.price || 0;
    const marketCap = stockData.market_cap || price * 1000000; // 模拟市值
    
    // 模拟财务指标（实际应用中应从财务数据获取）
    const peRatio = Math.round((15 + Math.random() * 20) * 100) / 100; // 15-35倍PE
    const pbRatio = Math.round((1 + Math.random() * 4) * 100) / 100; // 1-5倍PB
    const roe = Math.round((5 + Math.random() * 20) * 100) / 100; // 5-25% ROE
    const debtRatio = Math.round((20 + Math.random() * 40) * 100) / 100; // 20-60% 负债率
    const revenueGrowth = Math.round((-10 + Math.random() * 40) * 100) / 100; // -10%到30%增长

    return {
      pe_ratio: peRatio,
      pb_ratio: pbRatio,
      roe: roe,
      debt_ratio: debtRatio,
      revenue_growth: revenueGrowth,
    };
  }

  /**
   * 评估基本面强度
   */
  private assessFundamentalStrength(keyMetrics: any, stockData: any): 'strong' | 'moderate' | 'weak' {
    let score = 0;
    
    // PE估值评分
    if (keyMetrics.pe_ratio < 20) score += 2;
    else if (keyMetrics.pe_ratio < 30) score += 1;
    
    // PB估值评分
    if (keyMetrics.pb_ratio < 2) score += 2;
    else if (keyMetrics.pb_ratio < 3) score += 1;
    
    // ROE盈利能力评分
    if (keyMetrics.roe > 15) score += 2;
    else if (keyMetrics.roe > 10) score += 1;
    
    // 负债率评分
    if (keyMetrics.debt_ratio < 40) score += 2;
    else if (keyMetrics.debt_ratio < 60) score += 1;
    
    // 收入增长评分
    if (keyMetrics.revenue_growth > 15) score += 2;
    else if (keyMetrics.revenue_growth > 5) score += 1;
    
    // 股价表现评分
    const changePercent = stockData.change_percent || 0;
    if (changePercent > 2) score += 1;
    else if (changePercent < -2) score -= 1;
    
    if (score >= 7) return 'strong';
    if (score >= 4) return 'moderate';
    return 'weak';
  }

  /**
   * 使用模板生成分析
   */
  private generateTemplateAnalysis(
    stockCode: string,
    stockData: any,
    keyMetrics: any,
    strength: 'strong' | 'moderate' | 'weak'
  ) {
    const templates = this.templates[strength];
    const analysis = templates[Math.floor(Math.random() * templates.length)];
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // 根据指标生成优势和劣势
    if (keyMetrics.pe_ratio < 25) {
      strengths.push(`市盈率${keyMetrics.pe_ratio}倍，估值相对合理，显示出良好的投资价值倾向`);
    } else {
      weaknesses.push(`市盈率${keyMetrics.pe_ratio}倍偏高，存在估值压力的情景`);
    }
    
    if (keyMetrics.roe > 12) {
      strengths.push(`净资产收益率${keyMetrics.roe}%，盈利能力表现积极`);
    } else {
      weaknesses.push(`净资产收益率${keyMetrics.roe}%，盈利能力有待提升`);
    }
    
    if (keyMetrics.debt_ratio < 50) {
      strengths.push(`负债率${keyMetrics.debt_ratio}%，财务结构相对稳健`);
    } else {
      weaknesses.push(`负债率${keyMetrics.debt_ratio}%，需关注财务风险情景`);
    }
    
    if (keyMetrics.revenue_growth > 10) {
      strengths.push(`营收增长${keyMetrics.revenue_growth}%，业务发展呈现良好倾向`);
    } else if (keyMetrics.revenue_growth < 0) {
      weaknesses.push(`营收增长${keyMetrics.revenue_growth}%，业务面临下滑压力`);
    }
    
    // 生成展望
    let outlook: string;
    if (strength === 'strong') {
      outlook = '基于当前基本面分析，公司展现出稳健的经营基础，未来发展前景呈现积极倾向，建议持续关注其业绩表现情景。';
    } else if (strength === 'moderate') {
      outlook = '公司基本面表现中等，具备一定的投资价值，但需密切关注行业变化和公司经营改善情景。';
    } else {
      outlook = '当前基本面存在一定挑战，建议谨慎评估投资风险，关注公司后续改善措施的实施情景。';
    }
    
    const confidence = strength === 'strong' ? 0.8 : strength === 'moderate' ? 0.65 : 0.5;
    
    return {
      analysis,
      strengths,
      weaknesses,
      outlook,
      confidence,
    };
  }

  /**
   * 使用LLM生成增强分析
   */
  private async generateLLMAnalysis(
    stockCode: string,
    stockData: any,
    keyMetrics: any,
    llmProvider: LLMProvider
  ) {
    // 构建LLM提示词
    const prompt = `请对股票${stockCode}进行基本面分析，基于以下数据：

股价信息：
- 当前价格：${stockData.price}
- 涨跌幅：${stockData.change_percent}%
- 成交量：${stockData.volume}

基本面指标：
- 市盈率：${keyMetrics.pe_ratio}倍
- 市净率：${keyMetrics.pb_ratio}倍
- 净资产收益率：${keyMetrics.roe}%
- 负债率：${keyMetrics.debt_ratio}%
- 营收增长率：${keyMetrics.revenue_growth}%

请提供：
1. 基本面分析总结（使用"倾向"、"情景"等温和措辞）
2. 主要优势（3-5点）
3. 主要劣势（2-4点）
4. 未来展望
5. 分析信心度（0-1之间的数值）

请以JSON格式返回结果。`;

    try {
      const llmResponse = await llmProvider.analyze(prompt);
      return JSON.parse(llmResponse);
    } catch (error) {
      logger.warn('LLM分析失败，回退到模板分析', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // 回退到模板分析
      const strength = this.assessFundamentalStrength(keyMetrics, stockData);
      return this.generateTemplateAnalysis(stockCode, stockData, keyMetrics, strength);
    }
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
      logger.error('FundamentalAnalyzer健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}