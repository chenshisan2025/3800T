import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRequestLogger } from '@/lib/logger';
import {
  captureException,
  setRequestContext,
  addBreadcrumb,
} from '@/lib/sentry';
import { validateRequest } from '@/lib/utils/validation';
import { dataProviderManager } from '@/lib/providers/DataProviderManager';
import { QuotesQuerySchema } from '@/types';
import {
  ok,
  fail,
  withErrorHandling,
  ErrorCodes,
  getRequestId,
} from '@/lib/http';

// 使用统一的查询参数验证schema
const QuerySchema = QuotesQuerySchema;

type QuotesQuery = z.infer<typeof QuotesQuerySchema>;

/**
 * GET /api/market/quotes
 * 获取股票报价数据
 */
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const logger = createRequestLogger(request);

    try {
      // 设置Sentry请求上下文
      setRequestContext(request, {
        endpoint: '/api/market/quotes',
        method: 'GET',
      });

      addBreadcrumb({
        message: '股票报价查询开始',
        category: 'api.market.quotes',
        level: 'info',
      });

      // 验证请求参数
      const validation = validateRequest(request, QuerySchema);
      if (!validation.success) {
        logger.warn('股票报价查询参数验证失败', {
          error: validation.error,
          url: request.url,
        });

        return fail(
          {
            code: ErrorCodes.VALIDATION_ERROR,
            message: validation.error,
          },
          requestId,
          400
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

      logger.info('股票报价查询成功', {
        codes,
        market,
        fields,
        provider: providerInfo.name,
        count: quotesData.length,
      });

      addBreadcrumb({
        message: `股票报价查询完成，返回${quotesData.length}条记录`,
        category: 'api.market.quotes',
        level: 'info',
        data: {
          provider: providerInfo.name,
          count: quotesData.length,
        },
      });

      return ok(
        {
          quotes: quotesData,
          metadata: {
            provider: providerInfo.name,
            isPrimary: providerInfo.isPrimary,
            timestamp: Date.now(),
            count: quotesData.length,
          },
        },
        undefined,
        requestId
      );
    } catch (error) {
      logger.error('获取股票报价失败', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      captureException(error, {
        tags: {
          endpoint: '/api/market/quotes',
          method: 'GET',
          operation: 'GetQuotes',
        },
        extra: {
          url: request.url,
          userAgent: request.headers.get('user-agent'),
        },
      });

      throw error; // 重新抛出错误，让withErrorHandling处理
    }
  }
);
