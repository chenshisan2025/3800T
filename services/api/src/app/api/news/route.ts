import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import logger from '@/lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { NewsQuerySchema } from '@/types';
import {
  ok,
  fail,
  withErrorHandling,
  ErrorCodes,
  getRequestId,
} from '@/lib/http';

// 使用统一的查询参数验证schema，添加分页参数
const QuerySchema = NewsQuerySchema.extend({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

type NewsQuery = z.infer<typeof NewsQuerySchema>;

/**
 * GET /api/news
 * 获取新闻数据
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

    const { category, keyword, stock_code, start_date, end_date, page, limit } =
      validation.data;

    logger.info('获取新闻数据请求', {
      endpoint: '/api/news',
      category,
      keyword,
      stock_code,
      start_date,
      end_date,
      page,
      limit,
      userAgent: request.headers.get('user-agent'),
    });

    // 使用DataProviderManager获取数据
    const newsResult = await dataProviderManager.getNews({
      category,
      keyword,
      stock_code,
      start_date,
      end_date,
      limit: limit * page, // 获取到当前页的所有数据
    });

    // 实现分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = newsResult.data.slice(startIndex, endIndex);
    const totalCount = newsResult.data.length;
    const totalPages = Math.ceil(totalCount / limit);

    // 获取当前提供者信息
    const providerInfo = dataProviderManager.getCurrentProviderInfo();

    return ok(
      {
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
          count: paginatedData.length,
          ...newsResult.metadata,
        },
      },
      undefined,
      requestId
    );
  }
);
