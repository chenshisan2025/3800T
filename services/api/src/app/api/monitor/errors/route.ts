import { NextRequest } from 'next/server';
import { apiResponse } from '@/utils';
import { errorMonitor, ErrorType, ErrorSeverity } from '@/lib/errorMonitor';
import {
  createRateLimiter,
  rateLimitConfigs,
} from '@/lib/middleware/rateLimiter';

// GET /api/monitor/errors - 获取错误统计
export async function GET(request: NextRequest) {
  try {
    // 应用速率限制
    const rateLimiter = createRateLimiter(rateLimitConfigs.monitor);
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const type = searchParams.get('type') as ErrorType;
    const unresolved = searchParams.get('unresolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let data;

    if (type) {
      // 获取特定类型的错误
      data = {
        errors: errorMonitor.getErrorsByType(type, limit),
        type,
      };
    } else if (unresolved) {
      // 获取未解决的错误
      data = {
        errors: errorMonitor.getUnresolvedErrors(limit),
        filter: 'unresolved',
      };
    } else {
      // 获取错误统计
      data = errorMonitor.getErrorStats(hours);
    }

    return apiResponse.success(data, '错误监控数据获取成功');
  } catch (error) {
    console.error('Error fetching error stats:', error);
    return apiResponse.error('获取错误监控数据失败', 500);
  }
}

// POST /api/monitor/errors - 手动记录错误
export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const rateLimiter = createRateLimiter(rateLimitConfigs.monitor);
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { message, type, severity, context, metadata } = body;

    if (!message) {
      return apiResponse.error('错误消息不能为空', 400);
    }

    const errorId = errorMonitor.recordError(
      message,
      type || ErrorType.UNKNOWN_ERROR,
      severity || ErrorSeverity.MEDIUM,
      context,
      metadata
    );

    return apiResponse.success({ errorId }, '错误记录成功');
  } catch (error) {
    console.error('Error recording error:', error);
    return apiResponse.error('记录错误失败', 500);
  }
}

// PATCH /api/monitor/errors/:id - 标记错误为已解决
export async function PATCH(request: NextRequest) {
  try {
    // 应用速率限制
    const rateLimiter = createRateLimiter(rateLimitConfigs.monitor);
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const errorId = searchParams.get('id');

    if (!errorId) {
      return apiResponse.error('错误ID不能为空', 400);
    }

    const resolved = errorMonitor.resolveError(errorId);

    if (!resolved) {
      return apiResponse.error('错误记录不存在', 404);
    }

    return apiResponse.success(
      { errorId, resolved: true },
      '错误已标记为已解决'
    );
  } catch (error) {
    console.error('Error resolving error:', error);
    return apiResponse.error('标记错误解决状态失败', 500);
  }
}
