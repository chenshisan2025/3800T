import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRequestLogger } from '@/lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { KlineQuerySchema } from '@/types';

// 使用统一的查询参数验证schema
const QuerySchema = KlineQuerySchema;

type KlineQuery = z.infer<typeof KlineQuerySchema>;

/**
 * GET /api/data/kline
 * 获取K线数据
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  try {
    // 验证请求参数
    const validation = await validateRequest(request, QuerySchema);
    if (!validation.success) {
      return validation.response;
    }

    const { code, period, start_date, end_date, limit, adjust } =
      validation.data;

    logger.info('获取K线数据请求', {
      code,
      period,
      start_date,
      end_date,
      limit,
      adjust,
      userAgent: request.headers.get('user-agent'),
    });

    // 使用DataProviderManager获取数据
    const klineData = await dataProviderManager.getKline({
      code,
      period,
      start_date,
      end_date,
      limit,
      adjust,
    });

    // 获取当前提供者信息
    const providerInfo = dataProviderManager.getCurrentProviderInfo();

    return NextResponse.json({
      success: true,
      data: klineData.data,
      metadata: {
        provider: providerInfo.name,
        isPrimary: providerInfo.isPrimary,
        timestamp: Date.now(),
        count: klineData.data.length,
        ...klineData.metadata,
      },
    });
  } catch (error) {
    logger.error('获取K线数据失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: '获取K线数据失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
