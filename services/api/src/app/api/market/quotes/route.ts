import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { QuotesQuerySchema } from '@/types';

// 使用统一的查询参数验证schema
const QuerySchema = QuotesQuerySchema;

type QuotesQuery = z.infer<typeof QuotesQuerySchema>;

/**
 * GET /api/market/quotes
 * 获取股票报价数据
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求参数
    const validation = validateRequest(request, QuerySchema);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: '请求参数验证失败',
          message: validation.error,
        },
        { status: 400 }
      );
    }

    const { codes, market, fields } = validation.data;
    
    logger.info('获取股票报价请求', {
      endpoint: '/api/market/quotes',
      codes,
      market,
      fields,
      userAgent: request.headers.get('user-agent'),
    });

    // 使用DataProviderManager获取数据
    const quotesData = await dataProviderManager.getQuotes({
      codes,
      market,
      fields,
    });

    // 获取当前提供者信息
    const providerInfo = dataProviderManager.getCurrentProviderInfo();

    return NextResponse.json({
      success: true,
      data: quotesData,
      metadata: {
        provider: providerInfo.name,
        isPrimary: providerInfo.isPrimary,
        timestamp: Date.now(),
        count: quotesData.length,
      },
    });

  } catch (error) {
    logger.error('获取股票报价失败', {
      endpoint: '/api/market/quotes',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: '获取股票报价失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}