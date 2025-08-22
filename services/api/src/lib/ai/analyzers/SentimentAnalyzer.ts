import logger from '@/lib/logger';
import { getDataProviderManager } from '@/lib/providers';
import { LLMProvider } from '../providers/LLMProvider';

/**
 * 情绪面分析结果接口
 */
export interface SentimentAnalysisResult {
  analysis: string;
  sentiment_score: number; // -1到1之间，-1最悲观，1最乐观
  sentiment_label:
    | 'very_positive'
    | 'positive'
    | 'neutral'
    | 'negative'
    | 'very_negative';
  news_summary: {
    total_count: number;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    key_topics: string[];
  };
  market_mood: {
    investor_sentiment: 'bullish' | 'bearish' | 'neutral';
    media_attention: 'high' | 'medium' | 'low';
    social_buzz: 'strong' | 'moderate' | 'weak';
  };
  key_events: string[];
  confidence: number;
  sources: string[];
}

/**
 * 情绪面分析器
 * 基于新闻数据进行市场情绪分析
 */
export class SentimentAnalyzer {
  private templates = {
    very_positive: [
      '市场情绪分析显示投资者对该股票持非常积极的态度，新闻报道呈现明显的乐观倾向。',
      '从情绪面角度观察，该股票获得了广泛的正面关注，市场预期呈现强烈看好的情景。',
      '情绪指标分析表明投资者信心充足，媒体报道和市场讨论展现出高度乐观的倾向。',
    ],
    positive: [
      '市场情绪分析显示投资者对该股票保持积极态度，正面消息占据主导地位。',
      '从情绪面来看，该股票受到较多正面关注，市场氛围呈现乐观倾向。',
      '情绪指标反映出投资者对公司前景相对看好，整体情绪偏向积极情景。',
    ],
    neutral: [
      '市场情绪分析显示投资者对该股票态度相对中性，正负面消息基本平衡。',
      '从情绪面角度观察，该股票处于观望状态，市场情绪呈现谨慎平衡的情景。',
      '情绪指标分析表明投资者保持理性态度，等待更多信息确认的倾向明显。',
    ],
    negative: [
      '市场情绪分析显示投资者对该股票存在一定担忧，负面消息影响市场信心。',
      '从情绪面来看，该股票面临一些质疑声音，市场氛围呈现谨慎偏悲观的倾向。',
      '情绪指标反映出投资者信心有所动摇，需要关注情绪改善的情景。',
    ],
    very_negative: [
      '市场情绪分析显示投资者对该股票持明显悲观态度，负面消息主导市场情绪。',
      '从情绪面角度观察，该股票面临严重的信心危机，市场预期呈现强烈担忧的情景。',
      '情绪指标分析表明投资者情绪低迷，媒体报道和市场讨论展现出高度悲观的倾向。',
    ],
  };

  constructor() {
    logger.info('SentimentAnalyzer 初始化完成');
  }

  /**
   * 执行情绪面分析
   */
  async analyze(
    stockCode: string,
    llmProvider?: LLMProvider
  ): Promise<SentimentAnalysisResult> {
    logger.info('开始情绪面分析', { stock_code: stockCode });

    try {
      // 获取相关新闻数据
      const dataManager = getDataProviderManager();
      const newsResponse = await dataManager.getNews({
        keywords: [stockCode],
        limit: 50,
        days: 7, // 获取最近7天的新闻
      });

      if (!newsResponse.data || newsResponse.data.length === 0) {
        logger.warn('未找到相关新闻数据，使用默认情绪分析', {
          stock_code: stockCode,
        });
        return this.generateDefaultSentimentAnalysis(stockCode);
      }

      const newsData = newsResponse.data;

      // 分析新闻情绪
      const newsSummary = this.analyzeNewsSentiment(newsData);

      // 计算整体情绪得分
      const sentimentScore = this.calculateSentimentScore(
        newsSummary,
        newsData
      );
      const sentimentLabel = this.getSentimentLabel(sentimentScore);

      // 分析市场情绪
      const marketMood = this.analyzeMarketMood(newsData, sentimentScore);

      // 提取关键事件
      const keyEvents = this.extractKeyEvents(newsData);

      // 生成分析内容
      let analysis: string;
      let confidence: number;

      if (llmProvider) {
        // 使用LLM增强分析
        const llmResult = await this.generateLLMAnalysis(
          stockCode,
          newsData,
          newsSummary,
          sentimentScore,
          marketMood,
          keyEvents,
          llmProvider
        );
        analysis = llmResult.analysis;
        confidence = llmResult.confidence;
      } else {
        // 使用模板生成分析
        const templateResult = this.generateTemplateAnalysis(
          stockCode,
          newsData,
          sentimentLabel,
          newsSummary,
          marketMood
        );
        analysis = templateResult.analysis;
        confidence = templateResult.confidence;
      }

      const result: SentimentAnalysisResult = {
        analysis,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel,
        news_summary: newsSummary,
        market_mood: marketMood,
        key_events: keyEvents,
        confidence,
        sources: [
          `新闻数据 (${newsResponse.metadata.provider})`,
          '情绪分析模型',
          '市场情绪指标',
        ],
      };

      logger.info('情绪面分析完成', {
        stock_code: stockCode,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel,
        news_count: newsData.length,
        confidence,
        llm_enhanced: !!llmProvider,
      });

      return result;
    } catch (error) {
      logger.error('情绪面分析失败', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 分析新闻情绪
   */
  private analyzeNewsSentiment(newsData: any[]) {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const keyTopics = new Set<string>();

    newsData.forEach(news => {
      // 基于新闻的sentiment字段或标题内容分析情绪
      const sentiment =
        news.sentiment || this.analyzeTitleSentiment(news.title);

      if (sentiment === 'positive') {
        positiveCount++;
      } else if (sentiment === 'negative') {
        negativeCount++;
      } else {
        neutralCount++;
      }

      // 提取关键主题
      if (news.category) {
        keyTopics.add(news.category);
      }

      // 从标题中提取关键词
      const titleKeywords = this.extractKeywords(news.title);
      titleKeywords.forEach(keyword => keyTopics.add(keyword));
    });

    return {
      total_count: newsData.length,
      positive_count: positiveCount,
      negative_count: negativeCount,
      neutral_count: neutralCount,
      key_topics: Array.from(keyTopics).slice(0, 10), // 最多10个主题
    };
  }

  /**
   * 分析标题情绪
   */
  private analyzeTitleSentiment(
    title: string
  ): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      '上涨',
      '增长',
      '突破',
      '利好',
      '看好',
      '乐观',
      '强势',
      '创新高',
      '盈利',
      '业绩',
    ];
    const negativeWords = [
      '下跌',
      '下滑',
      '跌破',
      '利空',
      '看空',
      '悲观',
      '疲软',
      '创新低',
      '亏损',
      '风险',
    ];

    const titleLower = title.toLowerCase();

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (titleLower.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (titleLower.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * 提取关键词
   */
  private extractKeywords(title: string): string[] {
    const keywords = [
      '财报',
      '业绩',
      '重组',
      '并购',
      '分红',
      '增持',
      '减持',
      '回购',
      '投资',
      '合作',
    ];
    return keywords.filter(keyword => title.includes(keyword));
  }

  /**
   * 计算情绪得分
   */
  private calculateSentimentScore(newsSummary: any, newsData: any[]): number {
    const { positive_count, negative_count, total_count } = newsSummary;

    if (total_count === 0) return 0;

    // 基础情绪得分
    const baseScore = (positive_count - negative_count) / total_count;

    // 考虑新闻的时效性和重要性
    let weightedScore = 0;
    let totalWeight = 0;

    newsData.forEach((news, index) => {
      // 越新的新闻权重越高
      const timeWeight = Math.max(0.1, 1 - index * 0.1);

      // 根据新闻来源调整权重（模拟）
      const sourceWeight = news.source?.includes('官方') ? 1.5 : 1.0;

      const weight = timeWeight * sourceWeight;
      const sentiment =
        news.sentiment || this.analyzeTitleSentiment(news.title);

      let newsScore = 0;
      if (sentiment === 'positive') newsScore = 1;
      else if (sentiment === 'negative') newsScore = -1;

      weightedScore += newsScore * weight;
      totalWeight += weight;
    });

    const finalScore =
      totalWeight > 0 ? weightedScore / totalWeight : baseScore;

    // 限制在-1到1之间
    return Math.max(-1, Math.min(1, finalScore));
  }

  /**
   * 获取情绪标签
   */
  private getSentimentLabel(
    score: number
  ): 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' {
    if (score >= 0.6) return 'very_positive';
    if (score >= 0.2) return 'positive';
    if (score >= -0.2) return 'neutral';
    if (score >= -0.6) return 'negative';
    return 'very_negative';
  }

  /**
   * 分析市场情绪
   */
  private analyzeMarketMood(newsData: any[], sentimentScore: number) {
    // 投资者情绪
    let investorSentiment: 'bullish' | 'bearish' | 'neutral';
    if (sentimentScore > 0.3) investorSentiment = 'bullish';
    else if (sentimentScore < -0.3) investorSentiment = 'bearish';
    else investorSentiment = 'neutral';

    // 媒体关注度
    let mediaAttention: 'high' | 'medium' | 'low';
    if (newsData.length > 20) mediaAttention = 'high';
    else if (newsData.length > 10) mediaAttention = 'medium';
    else mediaAttention = 'low';

    // 社交热度（模拟）
    const socialBuzz =
      Math.abs(sentimentScore) > 0.5
        ? 'strong'
        : Math.abs(sentimentScore) > 0.2
          ? 'moderate'
          : 'weak';

    return {
      investor_sentiment: investorSentiment,
      media_attention: mediaAttention,
      social_buzz: socialBuzz as 'strong' | 'moderate' | 'weak',
    };
  }

  /**
   * 提取关键事件
   */
  private extractKeyEvents(newsData: any[]): string[] {
    const events: string[] = [];

    // 按重要性排序新闻（基于标题关键词）
    const importantNews = newsData
      .filter(news => {
        const title = news.title.toLowerCase();
        return (
          title.includes('财报') ||
          title.includes('业绩') ||
          title.includes('重组') ||
          title.includes('并购') ||
          title.includes('分红') ||
          title.includes('增持') ||
          title.includes('减持') ||
          title.includes('回购')
        );
      })
      .slice(0, 5); // 最多5个重要事件

    importantNews.forEach(news => {
      events.push(news.title);
    });

    // 如果重要新闻不足，添加最新的新闻
    if (events.length < 3) {
      const recentNews = newsData.slice(0, 3 - events.length);
      recentNews.forEach(news => {
        if (!events.includes(news.title)) {
          events.push(news.title);
        }
      });
    }

    return events;
  }

  /**
   * 使用模板生成分析
   */
  private generateTemplateAnalysis(
    stockCode: string,
    newsData: any[],
    sentimentLabel: string,
    newsSummary: any,
    marketMood: any
  ) {
    const templates =
      this.templates[sentimentLabel as keyof typeof this.templates];
    const analysis = templates[Math.floor(Math.random() * templates.length)];

    // 计算信心度
    let confidence = 0.6; // 基础信心度

    // 基于新闻数量调整信心度
    if (newsData.length > 20) confidence += 0.15;
    else if (newsData.length > 10) confidence += 0.1;
    else if (newsData.length < 5) confidence -= 0.1;

    // 基于情绪一致性调整信心度
    const dominantSentiment = Math.max(
      newsSummary.positive_count,
      newsSummary.negative_count,
      newsSummary.neutral_count
    );
    const sentimentConsistency = dominantSentiment / newsSummary.total_count;
    if (sentimentConsistency > 0.7) confidence += 0.1;
    else if (sentimentConsistency < 0.4) confidence -= 0.1;

    // 基于媒体关注度调整信心度
    if (marketMood.media_attention === 'high') confidence += 0.05;
    else if (marketMood.media_attention === 'low') confidence -= 0.05;

    confidence = Math.max(0.3, Math.min(0.9, confidence));

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
    newsData: any[],
    newsSummary: any,
    sentimentScore: number,
    marketMood: any,
    keyEvents: string[],
    llmProvider: LLMProvider
  ) {
    const recentNews = newsData
      .slice(0, 10)
      .map(news => `- ${news.title}`)
      .join('\n');

    const prompt = `请对股票${stockCode}进行情绪面分析，基于以下数据：

新闻统计：
- 总新闻数：${newsSummary.total_count}
- 正面新闻：${newsSummary.positive_count}
- 负面新闻：${newsSummary.negative_count}
- 中性新闻：${newsSummary.neutral_count}
- 情绪得分：${sentimentScore.toFixed(3)} (-1到1之间)

市场情绪：
- 投资者情绪：${marketMood.investor_sentiment}
- 媒体关注度：${marketMood.media_attention}
- 社交热度：${marketMood.social_buzz}

关键主题：${newsSummary.key_topics.join(', ')}

最近新闻标题：
${recentNews}

关键事件：
${keyEvents.map(event => `- ${event}`).join('\n')}

请提供：
1. 情绪面分析总结（使用"倾向"、"情景"等温和措辞）
2. 分析信心度（0-1之间的数值）

请以JSON格式返回结果。`;

    try {
      const llmResponse = await llmProvider.analyze(prompt);
      return JSON.parse(llmResponse);
    } catch (error) {
      logger.warn('LLM情绪分析失败，回退到模板分析', {
        stock_code: stockCode,
        error: error instanceof Error ? error.message : String(error),
      });

      // 回退到模板分析
      const sentimentLabel = this.getSentimentLabel(sentimentScore);
      return this.generateTemplateAnalysis(
        stockCode,
        newsData,
        sentimentLabel,
        newsSummary,
        marketMood
      );
    }
  }

  /**
   * 生成默认情绪分析（当没有新闻数据时）
   */
  private generateDefaultSentimentAnalysis(
    stockCode: string
  ): SentimentAnalysisResult {
    return {
      analysis:
        '由于缺乏足够的新闻数据，当前无法准确评估市场情绪倾向，建议关注后续相关报道和市场动态情景。',
      sentiment_score: 0,
      sentiment_label: 'neutral',
      news_summary: {
        total_count: 0,
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0,
        key_topics: [],
      },
      market_mood: {
        investor_sentiment: 'neutral',
        media_attention: 'low',
        social_buzz: 'weak',
      },
      key_events: [],
      confidence: 0.3,
      sources: ['情绪分析模型（默认）'],
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
      logger.error('SentimentAnalyzer健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
