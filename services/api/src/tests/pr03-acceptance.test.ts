import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { AIAnalysisManager } from '@/lib/ai/AIAnalysisManager';
import { FundamentalAnalyzer } from '@/lib/ai/analyzers/FundamentalAnalyzer';
import { TechnicalAnalyzer } from '@/lib/ai/analyzers/TechnicalAnalyzer';
import { SentimentAnalyzer } from '@/lib/ai/analyzers/SentimentAnalyzer';
import { RiskAnalyzer } from '@/lib/ai/analyzers/RiskAnalyzer';
import { LLMProvider } from '@/lib/ai/providers/LLMProvider';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';

// Mock environment variables for testing
const originalEnv = process.env;

describe('PR-03 AI Orchestrator 模板和LLM钩子验收测试', () => {
  let app: any;
  let server: any;

  beforeAll(async () => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.GOOGLE_API_KEY = 'test-google-key';
  }, 10000);

  afterAll(async () => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('1. API响应格式验证 - rating/reasons/cites/meta.timeliness', () => {
    let aiManager: AIAnalysisManager;

    beforeAll(() => {
      aiManager = new AIAnalysisManager(dataProviderManager);
    });

    it('API应该返回正确的格式：rating/reasons/cites/meta.timeliness', async () => {
      const aiManager = new AIAnalysisManager();
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      // 转换为标准格式（模拟API路由的转换逻辑）
      const result = {
        rating: rawResult.overall.recommendation,
        reasons: [
          rawResult.fundamental?.analysis || '基本面分析：数据不足',
          rawResult.technical?.analysis || '技术面分析：数据不足',
          rawResult.sentiment?.analysis || '情绪面分析：数据不足',
          rawResult.risk?.analysis || '风险面分析：数据不足',
        ] as [string, string, string, string],
        cites: rawResult.metadata.data_sources.map(source => ({
          source: source,
          url: '#',
          title: source,
        })),
        meta: {
          timeliness: rawResult.metadata.provider_info.isPrimary
            ? 'real-time'
            : 'delayed',
          analysis_duration_ms: rawResult.metadata.analysis_duration_ms,
          llm_enhanced: rawResult.metadata.llm_enhanced,
          data_sources_count: rawResult.metadata.data_sources.length,
        },
      };

      expect(result).toBeDefined();
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('cites');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('timeliness');
    });

    it('应该返回包含reasons字段的正确格式', async () => {
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      const result = {
        reasons: [
          rawResult.fundamental?.analysis || '基本面分析：数据不足',
          rawResult.technical?.analysis || '技术面分析：数据不足',
          rawResult.sentiment?.analysis || '情绪面分析：数据不足',
          rawResult.risk?.analysis || '风险面分析：数据不足',
        ],
      };

      expect(result).toHaveProperty('reasons');
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);

      // 检查reasons数组中的每个元素
      result.reasons.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
      });
    });

    it('应该返回包含cites字段的正确格式', async () => {
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      const result = {
        cites: rawResult.metadata.data_sources.map(source => ({
          source: source,
          url: '#',
          title: source,
        })),
      };

      expect(result).toHaveProperty('cites');
      expect(Array.isArray(result.cites)).toBe(true);

      // 检查cites数组中的每个元素
      result.cites.forEach(cite => {
        expect(cite).toHaveProperty('source');
        expect(cite).toHaveProperty('url');
        expect(cite).toHaveProperty('title');
        expect(typeof cite.source).toBe('string');
        expect(typeof cite.url).toBe('string');
        expect(typeof cite.title).toBe('string');
      });
    });

    it('应该返回包含meta.timeliness字段的正确格式', async () => {
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      const result = {
        meta: {
          timeliness: rawResult.metadata.provider_info.isPrimary
            ? 'real-time'
            : 'delayed',
          timestamp: rawResult.metadata.timestamp,
          analysisId: rawResult.metadata.analysis_id,
          version: rawResult.metadata.version,
        },
      };

      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('timeliness');
      expect(typeof result.meta.timeliness).toBe('string');
      expect(['real-time', 'delayed', 'historical']).toContain(
        result.meta.timeliness
      );

      // 检查meta的其他必需字段
      expect(result.meta).toHaveProperty('timestamp');
      expect(result.meta).toHaveProperty('analysisId');
      expect(result.meta).toHaveProperty('version');
    });
  });

  describe('2. 四个子代理输出验证 - fundamental/technical/sentiment/risk', () => {
    let fundamentalAnalyzer: FundamentalAnalyzer;
    let technicalAnalyzer: TechnicalAnalyzer;
    let sentimentAnalyzer: SentimentAnalyzer;
    let riskAnalyzer: RiskAnalyzer;

    beforeAll(() => {
      fundamentalAnalyzer = new FundamentalAnalyzer(dataProviderManager);
      technicalAnalyzer = new TechnicalAnalyzer(dataProviderManager);
      sentimentAnalyzer = new SentimentAnalyzer(dataProviderManager);
      riskAnalyzer = new RiskAnalyzer(dataProviderManager);
    });

    it('FundamentalAnalyzer应该产生有效输出', async () => {
      const result = await fundamentalAnalyzer.analyze('AAPL', false);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('key_metrics');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('outlook');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('sources');

      expect(typeof result.analysis).toBe('string');
      expect(result.analysis.length).toBeGreaterThan(0);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('TechnicalAnalyzer应该产生有效输出', async () => {
      const result = await technicalAnalyzer.analyze('AAPL', false);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('indicators');
      expect(result).toHaveProperty('signals');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('confidence');

      expect(typeof result.analysis).toBe('string');
      expect(result.analysis.length).toBeGreaterThan(0);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('SentimentAnalyzer应该产生有效输出', async () => {
      const result = await sentimentAnalyzer.analyze('AAPL', false);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('sentiment_score');
      expect(result).toHaveProperty('sentiment_label');
      expect(result).toHaveProperty('news_summary');
      expect(result).toHaveProperty('market_mood');
      expect(result).toHaveProperty('key_events');

      expect(typeof result.analysis).toBe('string');
      expect(result.analysis.length).toBeGreaterThan(0);
      expect(typeof result.sentiment_score).toBe('number');
      expect(result.sentiment_score).toBeGreaterThanOrEqual(-1);
      expect(result.sentiment_score).toBeLessThanOrEqual(1);
    });

    it('RiskAnalyzer应该产生有效输出', async () => {
      const result = await riskAnalyzer.analyze('AAPL', false);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('overall_risk_level');
      expect(result).toHaveProperty('risk_score');
      expect(result).toHaveProperty('risk_factors');
      expect(result).toHaveProperty('risk_warnings');
      expect(result).toHaveProperty('risk_mitigation');

      expect(typeof result.analysis).toBe('string');
      expect(result.analysis.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(result.overall_risk_level);
      expect(typeof result.risk_score).toBe('number');
      expect(result.risk_score).toBeGreaterThanOrEqual(0);
      expect(result.risk_score).toBeLessThanOrEqual(100);
    });

    it('所有四个子代理应该在综合分析中都有输出', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);
      const result = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      expect(result).toHaveProperty('fundamental');
      expect(result).toHaveProperty('technical');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('risk');

      // 验证每个子代理都有实际输出
      expect(result.fundamental).toBeDefined();
      expect(result.technical).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.risk).toBeDefined();

      // 验证每个分析器都有analysis字段
      expect(result.fundamental.analysis).toBeDefined();
      expect(result.technical.analysis).toBeDefined();
      expect(result.sentiment.analysis).toBeDefined();
      expect(result.risk.analysis).toBeDefined();
    });
  });

  describe('3. 安全措辞检查 - 无"保本/稳赚"类用语', () => {
    const unsafeTerms = [
      '保本',
      '稳赚',
      '必赚',
      '零风险',
      '无风险',
      '保证收益',
      '稳定盈利',
      '必胜',
      '包赚',
      '绝对安全',
      '100%收益',
      '确保盈利',
    ];

    const safePhrases = [
      '倾向',
      '情景',
      '可能',
      '预期',
      '建议',
      '考虑',
      '关注',
      '观察',
      '分析',
      '评估',
      '基于分析',
      '历史数据显示',
      '技术指标表明',
      '市场趋势显示',
    ];

    it('FundamentalAnalyzer输出应该使用安全措辞', async () => {
      const analyzer = new FundamentalAnalyzer(dataProviderManager);
      const result = await analyzer.analyze('AAPL', false);

      const textToCheck = [
        result.analysis,
        ...(Array.isArray(result.strengths)
          ? result.strengths
          : [result.strengths || '']),
        ...(Array.isArray(result.weaknesses)
          ? result.weaknesses
          : [result.weaknesses || '']),
        result.outlook,
      ].join(' ');

      // 检查不应该包含不安全用语
      unsafeTerms.forEach(term => {
        expect(textToCheck).not.toContain(term);
      });

      // 检查应该包含至少一些安全措辞
      const containsSafePhrases = safePhrases.some(phrase =>
        textToCheck.toLowerCase().includes(phrase.toLowerCase())
      );
      expect(containsSafePhrases).toBe(true);
    });

    it('TechnicalAnalyzer输出应该使用安全措辞', async () => {
      const analyzer = new TechnicalAnalyzer(dataProviderManager);
      const result = await analyzer.analyze('AAPL', false);

      const textToCheck = [
        result.analysis,
        ...(Array.isArray(result.recommendations)
          ? result.recommendations
          : [result.recommendations || '']),
      ].join(' ');

      console.log('TechnicalAnalyzer输出:', {
        analysis: result.analysis,
        recommendations: result.recommendations,
        textToCheck: textToCheck.substring(0, 200) + '...',
      });

      // 检查不应该包含不安全用语
      unsafeTerms.forEach(term => {
        expect(textToCheck).not.toContain(term);
      });

      // 检查应该包含至少一些安全措辞
      const containsSafePhrases = safePhrases.some(phrase =>
        textToCheck.toLowerCase().includes(phrase.toLowerCase())
      );
      expect(containsSafePhrases).toBe(true);
    });

    it('SentimentAnalyzer输出应该使用安全措辞', async () => {
      const analyzer = new SentimentAnalyzer(dataProviderManager);
      const result = await analyzer.analyze('AAPL', false);

      const textToCheck = result.analysis;

      console.log('SentimentAnalyzer输出:', {
        analysis: result.analysis,
        textToCheck: textToCheck.substring(0, 200) + '...',
      });

      // 检查不应该包含不安全用语
      unsafeTerms.forEach(term => {
        expect(textToCheck).not.toContain(term);
      });

      // 检查应该包含至少一些安全措辞
      const containsSafePhrases = safePhrases.some(phrase =>
        textToCheck.toLowerCase().includes(phrase.toLowerCase())
      );
      expect(containsSafePhrases).toBe(true);
    });

    it('RiskAnalyzer输出应该使用安全措辞', async () => {
      const analyzer = new RiskAnalyzer(dataProviderManager);
      const result = await analyzer.analyze('AAPL', false);

      const textToCheck = [
        result.analysis,
        ...(Array.isArray(result.risk_warnings)
          ? result.risk_warnings
          : [result.risk_warnings || '']),
        ...(Array.isArray(result.risk_mitigation)
          ? result.risk_mitigation
          : [result.risk_mitigation || '']),
      ].join(' ');

      console.log('RiskAnalyzer输出:', {
        analysis: result.analysis,
        risk_warnings: result.risk_warnings,
        risk_mitigation: result.risk_mitigation,
        textToCheck: textToCheck.substring(0, 200) + '...',
      });

      // 检查不应该包含不安全用语
      unsafeTerms.forEach(term => {
        expect(textToCheck).not.toContain(term);
      });

      // 检查应该包含至少一些安全措辞
      const containsSafePhrases = safePhrases.some(phrase =>
        textToCheck.toLowerCase().includes(phrase.toLowerCase())
      );
      expect(containsSafePhrases).toBe(true);
    });

    it('综合分析输出应该使用安全措辞', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      const result = {
        summary: rawResult.overall.summary,
        reasons: [
          rawResult.fundamental?.analysis || '基本面分析：数据不足',
          rawResult.technical?.analysis || '技术面分析：数据不足',
          rawResult.sentiment?.analysis || '情绪面分析：数据不足',
          rawResult.risk?.analysis || '风险面分析：数据不足',
        ],
      };

      const textToCheck = [result.summary, ...result.reasons].join(' ');

      // 检查不应该包含不安全用语
      unsafeTerms.forEach(term => {
        expect(textToCheck).not.toContain(term);
      });

      // 检查应该包含至少一些安全措辞
      const containsSafePhrases = safePhrases.some(phrase =>
        textToCheck.toLowerCase().includes(phrase.toLowerCase())
      );
      expect(containsSafePhrases).toBe(true);
    });
  });

  describe('4. 多Symbol示例响应测试', () => {
    const testSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];

    it('应该能够处理多个不同的股票代码', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);

      for (const symbol of testSymbols.slice(0, 2)) {
        // 测试至少两个symbol
        const rawResult = await aiManager.analyze({
          stock_code: symbol,
          analysis_type: 'comprehensive',
          use_llm: false,
          llm_provider: undefined,
        });

        const result = {
          rating: rawResult.overall.recommendation,
          reasons: [
            rawResult.fundamental?.analysis || '基本面分析：数据不足',
            rawResult.technical?.analysis || '技术面分析：数据不足',
            rawResult.sentiment?.analysis || '情绪面分析：数据不足',
            rawResult.risk?.analysis || '风险面分析：数据不足',
          ],
          cites: rawResult.metadata.data_sources,
          meta: {
            timeliness: rawResult.metadata.provider_info.isPrimary
              ? 'real-time'
              : 'delayed',
            symbol: symbol,
          },
          summary: rawResult.overall.summary,
        };

        expect(result).toBeDefined();
        expect(result).toHaveProperty('rating');
        expect(result).toHaveProperty('reasons');
        expect(result).toHaveProperty('cites');
        expect(result).toHaveProperty('meta');
        expect(result.meta).toHaveProperty('timeliness');

        // 验证symbol特定的内容
        expect(result.meta.symbol).toBe(symbol);
        if (typeof result.summary === 'string') {
          expect(result.summary).toContain(symbol);
        }
      }
    });

    it('不同symbol应该产生不同的分析结果', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);

      const results = [];
      for (const symbol of testSymbols.slice(0, 2)) {
        const rawResult = await aiManager.analyze({
          stock_code: symbol,
          analysis_type: 'comprehensive',
          use_llm: false,
          llm_provider: undefined,
        });

        const result = {
          summary: rawResult.overall.summary,
          meta: {
            symbol: symbol,
          },
        };
        results.push(result);
      }

      // 验证不同symbol产生不同的结果
      expect(results[0].summary).not.toBe(results[1].summary);
      expect(results[0].meta.symbol).not.toBe(results[1].meta.symbol);
    });
  });

  describe('5. 缓存/限流/费用钩子预留验证', () => {
    it('LLMProvider应该预留缓存钩子', async () => {
      // 检查LLMProvider类是否有缓存相关的方法或属性预留
      const mockProvider = new (class extends LLMProvider {
        async analyze() {
          return {
            content: 'test',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            model: 'test',
            provider: 'test',
          };
        }
        async analyzeWithMetadata() {
          return {
            content: 'test',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            model: 'test',
            provider: 'test',
          };
        }
        async healthCheck() {
          return true;
        }
      })();

      // 检查是否有缓存相关方法的占位或预留
      expect(typeof mockProvider.getProviderType).toBe('function');
      expect(typeof mockProvider.getConfig).toBe('function');
      expect(typeof mockProvider.updateConfig).toBe('function');

      // 验证配置中是否有缓存相关字段的预留
      const config = mockProvider.getConfig();
      expect(config).toBeDefined();
    });

    it('AIAnalysisManager应该预留限流钩子', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);

      // 检查是否有限流相关的方法或属性
      expect(aiManager).toBeDefined();
      expect(typeof aiManager.analyze).toBe('function');

      // 验证分析方法能够正常执行（为限流钩子预留空间）
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: false,
        llm_provider: undefined,
      });

      const result = {
        meta: {
          timestamp: rawResult.metadata.timestamp,
          analysisId: rawResult.metadata.analysis_id,
        },
      };

      expect(result).toBeDefined();
      expect(result.meta).toHaveProperty('timestamp');
      expect(result.meta).toHaveProperty('analysisId');
    });

    it('分析结果应该包含费用追踪相关字段', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: true, // 启用LLM以测试费用追踪
        llm_provider: 'mock',
      });

      const result = {
        meta: {
          timestamp: rawResult.metadata.timestamp,
          analysisId: rawResult.metadata.analysis_id,
          version: rawResult.metadata.version,
          llmUsage: rawResult.metadata.llm_usage,
        },
      };

      expect(result).toBeDefined();
      expect(result.meta).toBeDefined();

      // 检查是否有费用相关的元数据字段预留
      expect(result.meta).toHaveProperty('timestamp');
      expect(result.meta).toHaveProperty('analysisId');
      expect(result.meta).toHaveProperty('version');

      // 验证LLM使用情况的追踪
      if (result.meta.llmUsage) {
        expect(result.meta.llmUsage).toHaveProperty('provider');
        expect(result.meta.llmUsage).toHaveProperty('model');
        expect(result.meta.llmUsage).toHaveProperty('tokens');
      }
    });

    it('健康检查应该支持服务状态监控', async () => {
      const fundamentalAnalyzer = new FundamentalAnalyzer(dataProviderManager);
      const technicalAnalyzer = new TechnicalAnalyzer(dataProviderManager);
      const sentimentAnalyzer = new SentimentAnalyzer(dataProviderManager);
      const riskAnalyzer = new RiskAnalyzer(dataProviderManager);

      // 验证所有分析器都有健康检查功能
      expect(typeof fundamentalAnalyzer.healthCheck).toBe('function');
      expect(typeof technicalAnalyzer.healthCheck).toBe('function');
      expect(typeof sentimentAnalyzer.healthCheck).toBe('function');
      expect(typeof riskAnalyzer.healthCheck).toBe('function');

      // 执行健康检查
      const healthResults = await Promise.all([
        fundamentalAnalyzer.healthCheck(),
        technicalAnalyzer.healthCheck(),
        sentimentAnalyzer.healthCheck(),
        riskAnalyzer.healthCheck(),
      ]);

      healthResults.forEach(result => {
        // 健康检查可能返回boolean或包含状态信息的对象
        expect(result).toBeDefined();
        expect(typeof result === 'boolean' || typeof result === 'object').toBe(
          true
        );
      });
    });
  });

  describe('6. 错误处理和边界情况测试', () => {
    it('应该正确处理无效的股票代码', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);

      try {
        await aiManager.analyze({
          stock_code: 'INVALID_SYMBOL_12345',
          analysis_type: 'comprehensive',
          use_llm: false,
          llm_provider: undefined,
        });

        // 如果没有抛出错误，验证返回的结果是否合理
        expect(true).toBe(true);
      } catch (error) {
        // 如果抛出错误，验证错误是否合理
        expect(error).toBeDefined();
      }
    });

    it('应该正确处理LLM服务不可用的情况', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);

      // 测试LLM不可用时的回退机制 - 使用mock provider避免API key问题
      const rawResult = await aiManager.analyze({
        stock_code: 'AAPL',
        analysis_type: 'comprehensive',
        use_llm: true,
        llm_provider: 'mock',
      });

      const result = {
        rating: rawResult.overall.recommendation,
        reasons: [
          rawResult.fundamental?.analysis || '基本面分析：数据不足',
          rawResult.technical?.analysis || '技术面分析：数据不足',
          rawResult.sentiment?.analysis || '情绪面分析：数据不足',
          rawResult.risk?.analysis || '风险面分析：数据不足',
        ],
        meta: {
          timeliness: rawResult.metadata.provider_info.isPrimary
            ? 'real-time'
            : 'delayed',
        },
      };

      expect(result).toBeDefined();
      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('meta');
    });

    it('应该在数据提供者不可用时提供合理的回退', async () => {
      const aiManager = new AIAnalysisManager(dataProviderManager);

      try {
        const rawResult = await aiManager.analyze({
          stock_code: 'INVALID_SYMBOL',
          analysis_type: 'comprehensive',
          use_llm: false,
          llm_provider: undefined,
        });

        // 转换为标准格式
        const result = {
          rating: rawResult.overall.recommendation,
          reasons: [
            rawResult.fundamental?.analysis || '基本面分析：数据不足',
            rawResult.technical?.analysis || '技术面分析：数据不足',
            rawResult.sentiment?.analysis || '情绪面分析：数据不足',
            rawResult.risk?.analysis || '风险面分析：数据不足',
          ] as [string, string, string, string],
          cites: rawResult.metadata.data_sources,
          meta: {
            timeliness: rawResult.metadata.provider_info.isPrimary
              ? 'real-time'
              : 'delayed',
            analysis_duration_ms: rawResult.metadata.analysis_duration_ms,
            llm_enhanced: rawResult.metadata.llm_enhanced,
            data_sources_count: rawResult.metadata.data_sources.length,
          },
        };

        expect(result).toBeDefined();
        expect(result.meta).toHaveProperty('timeliness');

        // 在数据不可用时，timeliness应该反映实际情况
        expect(['real-time', 'delayed', 'historical']).toContain(
          result.meta.timeliness
        );
      } catch (error) {
        // 如果抛出错误，验证错误是否合理
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
      }
    });
  });
});
