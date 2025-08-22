import { NextRequest } from 'next/server';
import { apiResponse } from '@/utils';
import {
  createRateLimiter,
  rateLimitConfigs,
} from '@/lib/middleware/rateLimiter';
import { circuitBreakerManager } from '@/lib/circuitBreaker';
import { recordError, ErrorType, ErrorSeverity } from '@/lib/errorMonitor';

// GET /api/monitor/circuit-breakers - 获取所有熔断器状态
export async function GET(request: NextRequest) {
  try {
    // 应用速率限制
    const rateLimiter = createRateLimiter(rateLimitConfigs.api);
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      recordError(
        'Rate limit exceeded for circuit breakers monitor API',
        ErrorType.RATE_LIMIT_ERROR,
        ErrorSeverity.LOW,
        'CircuitBreakerMonitor',
        { endpoint: 'GET /api/monitor/circuit-breakers' }
      );
      return rateLimitResponse;
    }

    // 获取所有熔断器状态
    const circuitBreakers = circuitBreakerManager.getAllStats();

    // 计算汇总统计
    const summary = {
      total_breakers: circuitBreakers.length,
      open_breakers: circuitBreakers.filter(cb => cb.state === 'open').length,
      half_open_breakers: circuitBreakers.filter(cb => cb.state === 'half_open')
        .length,
      closed_breakers: circuitBreakers.filter(cb => cb.state === 'closed')
        .length,
      total_requests: circuitBreakers.reduce(
        (sum, cb) => sum + cb.totalRequests,
        0
      ),
      total_failures: circuitBreakers.reduce(
        (sum, cb) => sum + cb.failedRequests,
        0
      ),
      overall_success_rate: 0,
    };

    if (summary.total_requests > 0) {
      summary.overall_success_rate =
        ((summary.total_requests - summary.total_failures) /
          summary.total_requests) *
        100;
    }

    const result = {
      summary,
      circuit_breakers: circuitBreakers.map(cb => ({
        name: cb.name,
        state: cb.state,
        total_requests: cb.totalRequests,
        successful_requests: cb.successfulRequests,
        failed_requests: cb.failedRequests,
        consecutive_failures: cb.consecutiveFailures,
        consecutive_successes: cb.consecutiveSuccesses,
        last_failure_time: cb.lastFailureTime
          ? new Date(cb.lastFailureTime).toISOString()
          : null,
        last_success_time: cb.lastSuccessTime
          ? new Date(cb.lastSuccessTime).toISOString()
          : null,
        success_rate:
          cb.totalRequests > 0
            ? (cb.successfulRequests / cb.totalRequests) * 100
            : 0,
        failure_rate:
          cb.totalRequests > 0
            ? (cb.failedRequests / cb.totalRequests) * 100
            : 0,
      })),
      timestamp: new Date().toISOString(),
    };

    return apiResponse.success(result, '获取熔断器状态成功');
  } catch (error) {
    recordError(
      error instanceof Error ? error : 'Circuit breaker monitor API failed',
      ErrorType.API_ERROR,
      ErrorSeverity.HIGH,
      'CircuitBreakerMonitorAPI',
      { endpoint: 'GET /api/monitor/circuit-breakers' }
    );
    return apiResponse.error('熔断器监控API错误', 500);
  }
}

// POST /api/monitor/circuit-breakers/reset - 重置熔断器
export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const rateLimiter = createRateLimiter(rateLimitConfigs.api);
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      recordError(
        'Rate limit exceeded for circuit breaker reset API',
        ErrorType.RATE_LIMIT_ERROR,
        ErrorSeverity.LOW,
        'CircuitBreakerResetAPI',
        { endpoint: 'POST /api/monitor/circuit-breakers/reset' }
      );
      return rateLimitResponse;
    }

    const body = await request.json();
    const { breaker_name, reset_all } = body;

    if (reset_all) {
      // 重置所有熔断器
      circuitBreakerManager.resetAll();

      recordError(
        'All circuit breakers reset',
        ErrorType.SYSTEM_ERROR,
        ErrorSeverity.LOW,
        'CircuitBreakerResetAPI',
        { action: 'reset_all' }
      );

      return apiResponse.success(
        {
          message: '所有熔断器已重置',
          reset_count: circuitBreakerManager.getCount(),
        },
        '重置所有熔断器成功'
      );
    } else if (breaker_name) {
      // 重置指定熔断器
      const success = circuitBreakerManager.reset(breaker_name);

      if (success) {
        recordError(
          `Circuit breaker ${breaker_name} reset`,
          ErrorType.SYSTEM_ERROR,
          ErrorSeverity.LOW,
          'CircuitBreakerResetAPI',
          { action: 'reset_single', breaker_name }
        );

        return apiResponse.success(
          { message: `熔断器 ${breaker_name} 已重置` },
          '重置熔断器成功'
        );
      } else {
        return apiResponse.error(`熔断器 ${breaker_name} 不存在`, 404);
      }
    } else {
      return apiResponse.error(
        '请指定要重置的熔断器名称或设置 reset_all 为 true',
        400
      );
    }
  } catch (error) {
    recordError(
      error instanceof Error ? error : 'Circuit breaker reset API failed',
      ErrorType.API_ERROR,
      ErrorSeverity.HIGH,
      'CircuitBreakerResetAPI',
      { endpoint: 'POST /api/monitor/circuit-breakers/reset' }
    );
    return apiResponse.error('熔断器重置API错误', 500);
  }
}
