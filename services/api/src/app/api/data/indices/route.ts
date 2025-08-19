import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { IndicesQuerySchema } from '@/types';

// 使用统一的查询参数验证schema
const QuerySchema = IndicesQuerySchema.extend({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

type IndicesQuery = z.infer<typeof IndicesQuerySchema>;

/**
 * GET /api/data/indices
 * 获取股票指数数据
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求参数
    const validation = await validateRequest(request, QuerySchema);
    if (!validation.success) {
      return validation.response;
    }

    const { market, category, page, limit } = validation.data;
    
    logger.info('获取指数数据请求', {
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

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    logger.error('获取指数数据失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: '获取指数数据失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}