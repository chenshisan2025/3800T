import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { NewsQuerySchema } from '@/types';

// 使用统一的查询参数验证schema，添加分页参数
const QuerySchema = NewsQuerySchema.extend({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

type NewsQuery = z.infer<typeof NewsQuerySchema>;

/**
 * GET /api/data/news
 * 获取新闻数据
 */
export async function GET(request: NextRequest) {
  try {
    // 验证请求参数
    const validation = await validateRequest(request, QuerySchema);
    if (!validation.success) {
      return validation.response;
    }

    const { category, keyword, stock_code, start_date, end_date, page, limit } = validation.data;
    
    logger.info('获取新闻数据请求', {
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
        count: paginatedData.length,
        ...newsResult.metadata,
      },
    });
  } catch (error) {
    logger.error('获取新闻数据失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: '获取新闻数据失败',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}