import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import { ApiResponse } from '@/types';
import { AIAnalysisManager } from '@/lib/ai/AIAnalysisManager';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/supabase';
import { 
  SubscriptionPlan, 
  FeatureType, 
  getUserSubscriptionPlan, 
  hasFeature, 
  checkLimit, 
  getCurrentUsage 
} from '@/middleware/featureGate';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimiter';

const prisma = new PrismaClient();

// AI分析请求参数验证 - 改为GET参数
const AIAnalysisQuerySchema = z.object({
  symbol: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  analysis_type: z.enum(['comprehensive', 'fundamental', 'technical', 'sentiment', 'risk']).default('comprehensive'),
  use_llm: z.string().transform(val => val === 'true').default('false'), // URL参数转布尔值
  llm_provider: z.enum(['openai', 'claude', 'gemini', 'mock']).nullish(), // LLM提供商，可为null
});

export type AIAnalysisQuery = z.infer<typeof AIAnalysisQuerySchema>;

// 标准化的AI分析返回格式
export interface StandardAIAnalysisResult {
  rating: 'BUY' | 'HOLD' | 'SELL' | 'NEUTRAL';
  reasons: [string, string, string, string]; // 四个分析维度的理由
  citations: string[]; // 数据来源引用
}

// 原始AI分析结果类型（内部使用）
export interface AIAnalysisResult {
  stock_code: string;
  analysis_type: string;
  timestamp: number;
  
  // 各模块分析结果
  fundamental?: {
    score: number;
    summary: string;
    key_metrics: Record<string, any>;
    sources: string[];
  };
  
  technical?: {
    score: number;
    summary: string;
    indicators: Record<string, any>;
    trend: 'bullish' | 'bearish' | 'neutral';
    sources: string[];
  };
  
  sentiment?: {
    score: number;
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    news_count: number;
    sources: string[];
  };
  
  risk?: {
    score: number;
    summary: string;
    risk_level: 'low' | 'medium' | 'high';
    risk_factors: string[];
    sources: string[];
  };
  
  // 综合分析结果
  overall: {
    recommendation: 'BUY' | 'HOLD' | 'SELL' | 'NEUTRAL';
    confidence: number;
    summary: string;
    risk_notice: string;
    key_points: string[];
  };
  
  // 数据来源和元信息
  metadata: {
    data_sources: string[];
    analysis_duration_ms: number;
    llm_enhanced: boolean;
    provider_info: {
      name: string;
      isPrimary: boolean;
    };
  };
}

/**
 * GET /api/ai/analyze?symbol=...
 * 股票AI分析接口
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 应用速率限制中间件
    const rateLimitResult = await rateLimitMiddleware(request, 'ai_analysis');
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: '请先登录',
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    // 解析URL参数
    const { searchParams } = new URL(request.url);
    const rawQuery = {
      symbol: searchParams.get('symbol'),
      analysis_type: searchParams.get('analysis_type') || 'comprehensive',
      use_llm: searchParams.get('use_llm') || 'false',
      llm_provider: searchParams.get('llm_provider'),
    };
    const query = AIAnalysisQuerySchema.parse(rawQuery);

    // 获取用户订阅计划
    const plan = await getUserSubscriptionPlan(user.id);
    
    // 检查AI深度分析权限（基本面、风险分析需要PRO）
    if (['fundamental', 'risk'].includes(query.analysis_type)) {
      if (!hasFeature(plan, FeatureType.AI_DEEP_ANALYSIS)) {
        const response: ApiResponse = {
          success: false,
          message: 'AI深度分析功能需要升级到Pro会员',
          error: {
            message: 'Feature not available in your subscription plan',
            code: 'FEATURE_NOT_AVAILABLE',
            upgradeRequired: true,
            currentPlan: plan
          },
        };
        return NextResponse.json(response, { status: 403 });
      }
    }
    
    // 检查AI报告使用限制
    const dailyUsage = await getCurrentUsage(user.id, FeatureType.AI_REPORTS_DAILY);
    const monthlyUsage = await getCurrentUsage(user.id, FeatureType.AI_REPORTS_MONTHLY);
    
    if (!checkLimit(plan, FeatureType.AI_REPORTS_DAILY, dailyUsage)) {
      const response: ApiResponse = {
        success: false,
        message: '今日AI报告次数已用完，请明天再试或升级Pro会员',
        error: {
          message: 'Daily AI reports limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage: dailyUsage,
          limit: plan === SubscriptionPlan.FREE ? 3 : 50,
          upgradeRequired: plan === SubscriptionPlan.FREE
        },
      };
      return NextResponse.json(response, { status: 429 });
    }
    
    if (!checkLimit(plan, FeatureType.AI_REPORTS_MONTHLY, monthlyUsage)) {
      const response: ApiResponse = {
        success: false,
        message: '本月AI报告次数已用完，请下月再试或升级Pro会员',
        error: {
          message: 'Monthly AI reports limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage: monthlyUsage,
          limit: plan === SubscriptionPlan.FREE ? 30 : 1000,
          upgradeRequired: plan === SubscriptionPlan.FREE
        },
      };
      return NextResponse.json(response, { status: 429 });
    }
    
    logger.info('AI分析请求', {
      symbol: query.symbol,
      analysis_type: query.analysis_type,
      use_llm: query.use_llm,
      llm_provider: query.llm_provider,
    });
    
    // 创建AI分析管理器实例
    const analysisManager = new AIAnalysisManager();
    
    // 执行分析
    const analysisQuery = {
      stock_code: query.symbol, // 转换参数名
      analysis_type: query.analysis_type,
      use_llm: query.use_llm,
      llm_provider: query.llm_provider,
    };
    const result = await analysisManager.analyze(analysisQuery);
    
    // 转换为标准格式
    const standardResult: StandardAIAnalysisResult = {
      rating: result.overall.recommendation,
      reasons: [
        result.fundamental?.summary || '基本面分析：数据不足',
        result.technical?.summary || '技术面分析：数据不足', 
        result.sentiment?.summary || '情绪面分析：数据不足',
        result.risk?.summary || '风险面分析：数据不足'
      ] as [string, string, string, string],
      citations: result.metadata.data_sources
    };
    
    // 记录到数据库
    try {
      // 查找或创建用户记录
      let dbUser = await prisma.user.findUnique({
        where: { supabase_id: user.id },
      });
      
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            supabase_id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            subscriptionPlan: plan,
          },
        });
      }
      
      await prisma.aiReport.create({
        data: {
          userId: dbUser.id,
          stockSymbol: query.symbol,
          reportType: query.analysis_type,
          analysisData: result,
          score: Math.round(result.overall.confidence * 100),
        },
      });
      logger.info('AI报告已保存到数据库', { 
        symbol: query.symbol, 
        userId: dbUser.id,
        plan: plan,
        dailyUsage: dailyUsage + 1,
        monthlyUsage: monthlyUsage + 1
      });
    } catch (dbError) {
      logger.error('保存AI报告失败', { error: dbError });
      // 不影响主要功能，继续返回结果
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('AI分析完成', {
      symbol: query.symbol,
      duration_ms: duration,
      recommendation: result.overall.recommendation,
      confidence: result.overall.confidence,
    });
    
    const response: ApiResponse<StandardAIAnalysisResult> = {
      success: true,
      data: standardResult,
      message: `股票 ${query.symbol} 的AI分析已完成`,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('AI分析失败', {
      error: error instanceof Error ? error.message : String(error),
      duration_ms: duration,
    });
    
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        message: '请求参数验证失败',
        error: {
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'VALIDATION_ERROR',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'AI分析服务暂时不可用',
      error: {
        message: error instanceof Error ? error.message : '未知错误',
        code: 'ANALYSIS_ERROR',
      },
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/ai/analyze/status
 * 获取AI分析服务状态（移至单独端点）
 */
export async function POST() {
  try {
    const analysisManager = new AIAnalysisManager();
    const status = await analysisManager.getServiceStatus();
    
    const response: ApiResponse = {
      success: true,
      data: status,
      message: 'AI分析服务状态获取成功',
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('获取AI分析服务状态失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    const response: ApiResponse = {
      success: false,
      message: '获取服务状态失败',
      error: {
        message: error instanceof Error ? error.message : '未知错误',
        code: 'STATUS_ERROR',
      },
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}