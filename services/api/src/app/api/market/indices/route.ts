import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ok, fail, withErrorHandling, ErrorCodes } from '../../../../lib/http';
import { createRequestLogger } from '../../../../lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { IndicesQuerySchema } from '@/types';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimiter';

// 使用统一的查询参数验证schema
const QuerySchema = IndicesQuerySchema.extend({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

type IndicesQuery = z.infer<typeof IndicesQuerySchema>;

/**
 * GET /api/market/indices
 * 获取股票指数数据
 */
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const logger = createRequestLogger(request);

    try {
      // 应用速率限制
      const rateLimitResult = await rateLimitMiddleware(request, 'market_data');
      if (!rateLimitResult.success) {
        return fail(
          {
            code: ErrorCodes.RATE_LIMIT_EXCEEDED,
            message: rateLimitResult.message,
            details: {
              retryAfter: rateLimitResult.retryAfter,
              remaining: rateLimitResult.remaining,
            },
          },
          requestId,
          429
        );
      }

      // 验证请求参数
      const validation = validateRequest(request, QuerySchema);
      if (!validation.success) {
        return fail(
          {
            code: ErrorCodes.VALIDATION_ERROR,
            message: '请求参数验证失败',
            details: validation.error,
          },
          requestId,
          400
        );
      }

      const { market, category, page, limit } = validation.data;

      logger.info('获取指数数据请求', {
        endpoint: '/api/market/indices',
        market,
        category,
        page,
        limit,
        userAgent: request.headers.get('user-agent'),
      });

      // 使用DataProviderManager获取数据
      const indicesData = await dataProviderManager.getIndices({
        market,
        category,
      });

      // 实现分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = indicesData.slice(startIndex, endIndex);
      const totalCount = indicesData.length;
      const totalPages = Math.ceil(totalCount / limit);

      // 获取当前提供者信息
      const providerInfo = dataProviderManager.getCurrentProviderInfo();

      const responseData = {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        metadata: {
          provider: providerInfo.name,
          isPrimary: providerInfo.isPrimary,
          timestamp: Date.now(),
        },
      };

      return ok(responseData, 'Indices data retrieved successfully', requestId);
    } catch (error) {
      logger.error('获取指数数据失败', { error });
      throw error;
    }
  }
);
