import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ok, fail, withErrorHandling, ErrorCodes } from '../../../lib/http';
import { createRequestLogger } from '@/lib/logger';

// Supabase数据库连接检查
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    return !error;
  } catch (error) {
    return false;
  }
}

// GET /api/health - 健康检查
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const startTime = Date.now();
    const logger = createRequestLogger(request);

    logger.info('健康检查开始');

    try {
      // 检查数据库连接
      const isDatabaseHealthy = await checkDatabaseConnection();

      const responseTime = Date.now() - startTime;

      const healthStatus = {
        status: isDatabaseHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        responseTime: responseTime,
        services: {
          database: {
            status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
            responseTime: responseTime,
          },
          api: {
            status: 'healthy',
            responseTime: responseTime,
          },
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      };

      // 如果数据库不健康，返回 503 状态码但仍使用统一格式
      if (!isDatabaseHealthy) {
        logger.error('数据库连接失败');

        return fail(
          {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Database connection failed',
          },
          requestId,
          503
        );
      }

      logger.info(`健康检查通过 - 响应时间: ${responseTime}ms`);

      return ok(healthStatus, 'Service is healthy', requestId);
    } catch (error) {
      logger.error('健康检查异常', { error });
      throw error;
    }
  }
);

// HEAD /api/health - 简单健康检查（用于负载均衡器）
export const HEAD = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const startTime = Date.now();
    const logger = createRequestLogger(request);

    logger.info('HEAD健康检查开始');

    try {
      const isDatabaseHealthy = await checkDatabaseConnection();

      if (isDatabaseHealthy) {
        logger.info('HEAD健康检查通过');
        return new NextResponse(null, {
          status: 200,
          headers: { 'x-request-id': requestId },
        });
      } else {
        logger.warn('HEAD健康检查失败 - 数据库不健康');
        return new NextResponse(null, {
          status: 503,
          headers: { 'x-request-id': requestId },
        });
      }
    } catch (error) {
      logger.error('HEAD健康检查异常', { error });
      throw error;
    }
  }
);
