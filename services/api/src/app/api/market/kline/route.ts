import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { KlineQuerySchema } from '@/types';
import {
  ok,
  fail,
  withErrorHandling,
  ErrorCodes,
  getRequestId,
} from '@/lib/http';

// 使用统一的查询参数验证schema
const QuerySchema = KlineQuerySchema;

type KlineQuery = z.infer<typeof KlineQuerySchema>;

/**
 * GET /api/market/kline
 * 获取K线数据
 */
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    // 验证请求参数
    const validation = validateRequest(request, QuerySchema);
    if (!validation.success) {
      return fail(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: validation.error,
        },
        requestId,
        400
      );
    }

    const { code, period, start_time, end_time, limit } = validation.data;

    logger.info('获取K线数据请求', {
      endpoint: '/api/market/kline',
      code,
      period,
      start_time,
      end_time,
      limit,
      userAgent: request.headers.get('user-agent'),
    });

    // 使用DataProviderManager获取数据
    const klineData = await dataProviderManager.getKline({
      code,
      period,
      start_time,
      end_time,
      limit,
    });

    // 获取当前提供者信息
    const providerInfo = dataProviderManager.getCurrentProviderInfo();

    return ok(
      {
        data: klineData.data,
        metadata: {
          ...klineData.metadata,
          provider: providerInfo.name,
          isPrimary: providerInfo.isPrimary,
          count: klineData.data.length,
        },
      },
      undefined,
      requestId
    );
  }
);
