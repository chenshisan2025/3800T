import logger from '@/lib/logger';

/**
 * LLM提供商类型
 */
export type LLMProviderType = 'openai' | 'claude' | 'gemini' | 'mock';

/**
 * LLM分析请求配置
 */
export interface LLMAnalysisConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
}

/**
 * LLM分析响应
 */
export interface LLMAnalysisResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  provider: LLMProviderType;
}

/**
 * LLM提供商抽象接口
 */
export abstract class LLMProvider {
  protected providerType: LLMProviderType;
  protected config: LLMAnalysisConfig;
  protected apiKey?: string;
  protected baseUrl?: string;

  constructor(
    providerType: LLMProviderType,
    config: LLMAnalysisConfig = {},
    apiKey?: string,
    baseUrl?: string
  ) {
    this.providerType = providerType;
    this.config = {
      temperature: 0.7,
      max_tokens: 2000,
      timeout: 30000,
      ...config,
    };
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 执行分析
   */
  abstract analyze(prompt: string, config?: LLMAnalysisConfig): Promise<string>;

  /**
   * 获取详细响应（包含使用量等元数据）
   */
  abstract analyzeWithMetadata(
    prompt: string,
    config?: LLMAnalysisConfig
  ): Promise<LLMAnalysisResponse>;

  /**
   * 健康检查
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 获取提供商类型
   */
  getProviderType(): LLMProviderType {
    return this.providerType;
  }

  /**
   * 获取配置
   */
  getConfig(): LLMAnalysisConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LLMAnalysisConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * OpenAI提供商实现
 */
export class OpenAIProvider extends LLMProvider {
  constructor(apiKey?: string, config: LLMAnalysisConfig = {}) {
    super('openai', {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      ...config,
    }, apiKey, 'https://api.openai.com/v1');
  }

  async analyze(prompt: string, config?: LLMAnalysisConfig): Promise<string> {
    const response = await this.analyzeWithMetadata(prompt, config);
    return response.content;
  }

  async analyzeWithMetadata(
    prompt: string,
    config?: LLMAnalysisConfig
  ): Promise<LLMAnalysisResponse> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      logger.info('发送OpenAI分析请求', {
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.max_tokens,
        prompt_length: prompt.length,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的股票分析师，请基于提供的数据进行客观、专业的分析。使用"倾向"、"情景"等温和措辞。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.max_tokens,
        }),
        signal: AbortSignal.timeout(finalConfig.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: LLMAnalysisResponse = {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        provider: 'openai',
      };

      logger.info('OpenAI分析完成', {
        model: result.model,
        usage: result.usage,
        content_length: result.content.length,
      });

      return result;

    } catch (error) {
      logger.error('OpenAI分析失败', {
        error: error instanceof Error ? error.message : String(error),
        model: finalConfig.model,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      return response.ok;
    } catch (error) {
      logger.error('OpenAI健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Claude提供商实现
 */
export class ClaudeProvider extends LLMProvider {
  constructor(apiKey?: string, config: LLMAnalysisConfig = {}) {
    super('claude', {
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      max_tokens: 2000,
      ...config,
    }, apiKey, 'https://api.anthropic.com/v1');
  }

  async analyze(prompt: string, config?: LLMAnalysisConfig): Promise<string> {
    const response = await this.analyzeWithMetadata(prompt, config);
    return response.content;
  }

  async analyzeWithMetadata(
    prompt: string,
    config?: LLMAnalysisConfig
  ): Promise<LLMAnalysisResponse> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      if (!this.apiKey) {
        throw new Error('Claude API key not configured');
      }

      logger.info('发送Claude分析请求', {
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.max_tokens,
        prompt_length: prompt.length,
      });

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: finalConfig.model,
          max_tokens: finalConfig.max_tokens,
          temperature: finalConfig.temperature,
          system: '你是一个专业的股票分析师，请基于提供的数据进行客观、专业的分析。使用"倾向"、"情景"等温和措辞。',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: AbortSignal.timeout(finalConfig.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: LLMAnalysisResponse = {
        content: data.content[0]?.text || '',
        usage: data.usage,
        model: data.model,
        provider: 'claude',
      };

      logger.info('Claude分析完成', {
        model: result.model,
        usage: result.usage,
        content_length: result.content.length,
      });

      return result;

    } catch (error) {
      logger.error('Claude分析失败', {
        error: error instanceof Error ? error.message : String(error),
        model: finalConfig.model,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      // Claude没有专门的健康检查端点，使用简单的消息测试
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hello',
            },
          ],
        }),
        signal: AbortSignal.timeout(10000),
      });

      return response.ok;
    } catch (error) {
      logger.error('Claude健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Gemini提供商实现
 */
export class GeminiProvider extends LLMProvider {
  constructor(apiKey?: string, config: LLMAnalysisConfig = {}) {
    super('gemini', {
      model: 'gemini-pro',
      temperature: 0.7,
      max_tokens: 2000,
      ...config,
    }, apiKey, 'https://generativelanguage.googleapis.com/v1');
  }

  async analyze(prompt: string, config?: LLMAnalysisConfig): Promise<string> {
    const response = await this.analyzeWithMetadata(prompt, config);
    return response.content;
  }

  async analyzeWithMetadata(
    prompt: string,
    config?: LLMAnalysisConfig
  ): Promise<LLMAnalysisResponse> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      logger.info('发送Gemini分析请求', {
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        max_tokens: finalConfig.max_tokens,
        prompt_length: prompt.length,
      });

      const systemPrompt = '你是一个专业的股票分析师，请基于提供的数据进行客观、专业的分析。使用"倾向"、"情景"等温和措辞。';
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const response = await fetch(
        `${this.baseUrl}/models/${finalConfig.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: fullPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: finalConfig.temperature,
              maxOutputTokens: finalConfig.max_tokens,
            },
          }),
          signal: AbortSignal.timeout(finalConfig.timeout || 30000),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: LLMAnalysisResponse = {
        content: data.candidates[0]?.content?.parts[0]?.text || '',
        usage: data.usageMetadata ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        } : undefined,
        model: finalConfig.model || 'gemini-pro',
        provider: 'gemini',
      };

      logger.info('Gemini分析完成', {
        model: result.model,
        usage: result.usage,
        content_length: result.content.length,
      });

      return result;

    } catch (error) {
      logger.error('Gemini分析失败', {
        error: error instanceof Error ? error.message : String(error),
        model: finalConfig.model,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      const response = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        {
          signal: AbortSignal.timeout(10000),
        }
      );

      return response.ok;
    } catch (error) {
      logger.error('Gemini健康检查失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Mock提供商实现（用于测试和开发）
 */
export class MockLLMProvider extends LLMProvider {
  private responses = [
    '基于综合分析，该股票呈现出积极的投资倾向，基本面指标表现良好，技术面显示上涨动能，市场情绪相对乐观。建议在当前价位适度配置，关注后续发展情景。',
    '从多维度评估来看，该股票投资价值适中，存在一定的上涨空间，但也需要关注相关风险因素。建议采取分批建仓的策略，密切关注市场变化倾向。',
    '综合各项指标分析，该股票短期内可能面临调整压力，建议谨慎对待。长期来看，如果基本面能够改善，仍有投资价值的情景可能。',
    '风险评估显示该股票存在较高的不确定性，市场情绪波动较大，技术面信号混杂。建议风险承受能力有限的投资者暂时观望，等待更明确的投资倾向。',
  ];

  constructor(config: LLMAnalysisConfig = {}) {
    super('mock', {
      model: 'mock-llm-v1',
      temperature: 0.7,
      max_tokens: 2000,
      ...config,
    });
  }

  async analyze(prompt: string, config?: LLMAnalysisConfig): Promise<string> {
    const response = await this.analyzeWithMetadata(prompt, config);
    return response.content;
  }

  async analyzeWithMetadata(
    prompt: string,
    config?: LLMAnalysisConfig
  ): Promise<LLMAnalysisResponse> {
    const finalConfig = { ...this.config, ...config };
    
    try {
      logger.info('发送Mock LLM分析请求', {
        model: finalConfig.model,
        prompt_length: prompt.length,
      });

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      // 随机选择一个响应
      const content = this.responses[Math.floor(Math.random() * this.responses.length)];
      
      const result: LLMAnalysisResponse = {
        content,
        usage: {
          prompt_tokens: Math.floor(prompt.length / 4), // 粗略估算
          completion_tokens: Math.floor(content.length / 4),
          total_tokens: Math.floor((prompt.length + content.length) / 4),
        },
        model: finalConfig.model || 'mock-llm-v1',
        provider: 'mock',
      };

      logger.info('Mock LLM分析完成', {
        model: result.model,
        usage: result.usage,
        content_length: result.content.length,
      });

      return result;

    } catch (error) {
      logger.error('Mock LLM分析失败', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    // Mock提供商总是健康的
    return true;
  }
}

/**
 * LLM提供商工厂
 */
export class LLMProviderFactory {
  /**
   * 创建LLM提供商实例
   */
  static createProvider(
    type: LLMProviderType,
    apiKey?: string,
    config: LLMAnalysisConfig = {}
  ): LLMProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(apiKey, config);
      case 'claude':
        return new ClaudeProvider(apiKey, config);
      case 'gemini':
        return new GeminiProvider(apiKey, config);
      case 'mock':
        return new MockLLMProvider(config);
      default:
        throw new Error(`Unsupported LLM provider type: ${type}`);
    }
  }

  /**
   * 获取支持的提供商类型
   */
  static getSupportedProviders(): LLMProviderType[] {
    return ['openai', 'claude', 'gemini', 'mock'];
  }

  /**
   * 验证提供商类型
   */
  static isValidProviderType(type: string): type is LLMProviderType {
    return this.getSupportedProviders().includes(type as LLMProviderType);
  }
}