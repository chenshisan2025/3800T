import logger from '@/lib/logger';
import { getDataProviderManager } from '@/lib/providers';
import { AIAnalysisQuery, AIAnalysisResult } from '@/app/api/ai/analyze/route';
import { FundamentalAnalyzer } from './analyzers/FundamentalAnalyzer';
import { TechnicalAnalyzer } from './analyzers/TechnicalAnalyzer';
import { SentimentAnalyzer } from './analyzers/SentimentAnalyzer';
import { RiskAnalyzer } from './analyzers/RiskAnalyzer';
import { ReportSummarizer } from './ReportSummarizer';
import { Orchestrator } from '@/lib/orchestrator/Orchestrator';

/**
 * AI分析管理器
 * 协调各个分析模块，生成综合分析报告
 */
export class AIAnalysisManager {
  private fundamentalAnalyzer: FundamentalAnalyzer;
  private technicalAnalyzer: TechnicalAnalyzer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private riskAnalyzer: RiskAnalyzer;
  private summarizer: ReportSummarizer;
  private orchestrator: Orchestrator;
  
  constructor() {
    // 初始化各个分析器
    this.fundamentalAnalyzer = new FundamentalAnalyzer();
    this.technicalAnalyzer = new TechnicalAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.riskAnalyzer = new RiskAnalyzer();
    this.summarizer = new ReportSummarizer();
    this.orchestrator = Orchestrator.getInstance();
    
    logger.info('AIAnalysisManager 初始化完成');
  }
  
  /**
   * 执行股票AI分析
   */
  async analyze(query: AIAnalysisQuery): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    const { stock_code, analysis_type, use_llm, llm_provider } = query;
    
    logger.info('开始AI分析', {
      stock_code,
      analysis_type,
      use_llm,
      llm_provider,
    });
    
    try {
      // 初始化LLM提供者（如果需要）
      if (use_llm && llm_provider) {
        await this.orchestrator.initializeLLM(llm_provider);
      }
      
      // 获取数据提供者管理器
      const dataManager = getDataProviderManager();
      const providerInfo = dataManager.getCurrentProviderInfo();
      
      // 根据分析类型执行相应的分析
      const analysisResults: Partial<AIAnalysisResult> = {
        stock_code,
        analysis_type,
        timestamp: Date.now(),
      };
      
      const dataSources: string[] = [];
      
      // 执行基本面分析
      if (analysis_type === 'comprehensive' || analysis_type === 'fundamental') {
        logger.info('执行基本面分析', { stock_code });
        analysisResults.fundamental = await this.fundamentalAnalyzer.analyze(
          stock_code,
          this.orchestrator.getLLMProvider() || undefined
        );
        dataSources.push(...analysisResults.fundamental.sources);
      }
      
      // 执行技术面分析
      if (analysis_type === 'comprehensive' || analysis_type === 'technical') {
        logger.info('执行技术面分析', { stock_code });
        analysisResults.technical = await this.technicalAnalyzer.analyze(
          stock_code,
          this.orchestrator.getLLMProvider() || undefined
        );
        dataSources.push(...analysisResults.technical.sources);
      }
      
      // 执行情绪面分析
      if (analysis_type === 'comprehensive' || analysis_type === 'sentiment') {
        logger.info('执行情绪面分析', { stock_code });
        analysisResults.sentiment = await this.sentimentAnalyzer.analyze(
          stock_code,
          this.orchestrator.getLLMProvider() || undefined
        );
        dataSources.push(...analysisResults.sentiment.sources);
      }
      
      // 执行风险分析
      if (analysis_type === 'comprehensive' || analysis_type === 'risk') {
        logger.info('执行风险分析', { stock_code });
        analysisResults.risk = await this.riskAnalyzer.analyze(
          stock_code,
          analysisResults.fundamental,
          analysisResults.technical,
          analysisResults.sentiment,
          this.orchestrator.getLLMProvider() || undefined
        );
        dataSources.push(...analysisResults.risk.sources);
      }
      
      // 生成综合分析结果
      logger.info('生成综合分析结果', { stock_code });
      analysisResults.overall = await this.summarizer.generateSummary(
        stock_code,
        analysisResults.fundamental,
        analysisResults.technical,
        analysisResults.sentiment,
        analysisResults.risk,
        this.orchestrator.getLLMProvider() || undefined
      );
      
      // 添加元数据
      const duration = Date.now() - startTime;
      analysisResults.metadata = {
        data_sources: [...new Set(dataSources)], // 去重
        analysis_duration_ms: duration,
        llm_enhanced: !!this.orchestrator.getLLMProvider(),
        provider_info: providerInfo,
      };
      
      logger.info('AI分析完成', {
        stock_code,
        duration_ms: duration,
        recommendation: analysisResults.overall.recommendation,
        confidence: analysisResults.overall.confidence,
        data_sources_count: analysisResults.metadata.data_sources.length,
      });
      
      return analysisResults as AIAnalysisResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('AI分析失败', {
        stock_code,
        analysis_type,
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
      });
      
      throw error;
    }
  }
  
  /**
   * 获取AI分析服务状态
   */
  async getServiceStatus() {
    try {
      const dataManager = getDataProviderManager();
      const healthStatus = await dataManager.healthCheck();
      const providerInfo = dataManager.getCurrentProviderInfo();
      
      // 检查各个分析器状态
      const analyzersStatus = {
        fundamental: await this.fundamentalAnalyzer.healthCheck(),
        technical: await this.technicalAnalyzer.healthCheck(),
        sentiment: await this.sentimentAnalyzer.healthCheck(),
        risk: await this.riskAnalyzer.healthCheck(),
      };
      
      // 获取Orchestrator服务状态
      const orchestratorStatus = await this.orchestrator.getServiceStatus();
      const llmStatus = orchestratorStatus.llm_providers;
      
      const status = {
        service: 'AI Analysis Service',
        status: 'healthy',
        timestamp: Date.now(),
        data_provider: {
          ...providerInfo,
          health: healthStatus,
        },
        analyzers: analyzersStatus,
        llm_providers: llmStatus,
        orchestrator: {
          status: orchestratorStatus.status,
          cost_control: orchestratorStatus.cost_control,
          rate_limiting: orchestratorStatus.rate_limiting,
        },
        features: {
          fundamental_analysis: true,
          technical_analysis: true,
          sentiment_analysis: true,
          risk_analysis: true,
          llm_enhancement: Object.values(llmStatus).some(status => status.available),
        },
      };
      
      logger.info('AI分析服务状态检查完成', {
        data_provider_health: healthStatus.primary && healthStatus.fallback,
        analyzers_healthy: Object.values(analyzersStatus).every(status => status),
        llm_available: status.features.llm_enhancement,
      });
      
      return status;
      
    } catch (error) {
      logger.error('获取AI分析服务状态失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return {
        service: 'AI Analysis Service',
        status: 'unhealthy',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  

  
  /**
   * 重新初始化分析器（用于配置更新后）
   */
  async reinitialize(): Promise<void> {
    logger.info('重新初始化AI分析管理器');
    
    // 重新创建分析器实例
    this.fundamentalAnalyzer = new FundamentalAnalyzer();
    this.technicalAnalyzer = new TechnicalAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.riskAnalyzer = new RiskAnalyzer();
    this.summarizer = new ReportSummarizer();
    
    // 重新初始化Orchestrator
    this.orchestrator = Orchestrator.getInstance();
    
    logger.info('AI分析管理器重新初始化完成');
  }
}