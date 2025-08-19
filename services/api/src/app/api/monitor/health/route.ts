import { NextRequest } from 'next/server';
import { apiResponse } from '@/utils';
import { errorMonitor } from '@/lib/errorMonitor';
import { createRateLimiter, rateLimitConfigs } from '@/lib/middleware/rateLimiter';
import { prisma } from '@/lib/prisma';
import { circuitBreakerManager } from '@/lib/circuitBreaker';

// 系统健康状态接口
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    errorMonitor: ServiceStatus;
    memory: ServiceStatus;
    circuit_breakers: ServiceStatus;
  };
  metrics: {
    totalErrors: number;
    criticalErrors: number;
    errorRate: number;
    responseTime: number;
    circuit_breaker_stats: {
      total_breakers: number;
      open_breakers: number;
      half_open_breakers: number;
      total_requests: number;
      total_failures: number;
      overall_success_rate: number;
    };
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck: string;
  message?: string;
  details?: any;
}

// GET /api/monitor/health - 获取系统健康状态
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 应用速率限制
    const rateLimiter = createRateLimiter(rateLimitConfigs.health);
    const rateLimitResponse = await rateLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse; // 返回速率限制响应
    }

    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      services: {
        database: await checkDatabaseHealth(),
        errorMonitor: checkErrorMonitorHealth(),
        memory: checkMemoryHealth(),
        circuit_breakers: checkCircuitBreakers(),
      },
      metrics: await getSystemMetrics(),
    };

    // 确定整体健康状态
    const serviceStatuses = Object.values(healthStatus.services).map(s => s.status);
    if (serviceStatuses.includes('down')) {
      healthStatus.status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      healthStatus.status = 'degraded';
    }

    // 检查错误率
    if (healthStatus.metrics.errorRate > 0.1) { // 错误率超过10%
      healthStatus.status = 'degraded';
    }
    if (healthStatus.metrics.errorRate > 0.3) { // 错误率超过30%
      healthStatus.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    healthStatus.metrics.responseTime = responseTime;

    return apiResponse.success(healthStatus, '系统健康状态获取成功');
  } catch (error) {
    console.error('Health check failed:', error);
    
    const responseTime = Date.now() - startTime;
    const unhealthyStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      services: {
        database: { status: 'down', error: 'Health check failed', lastCheck: new Date().toISOString() },
        errorMonitor: { status: 'down', error: 'Health check failed', lastCheck: new Date().toISOString() },
        memory: { status: 'down', error: 'Health check failed', lastCheck: new Date().toISOString() },
      },
      metrics: {
        totalErrors: 0,
        criticalErrors: 0,
        errorRate: 1,
        responseTime,
      },
    };

    return apiResponse.error('系统健康检查失败', 500, unhealthyStatus);
  }
}

// 检查数据库健康状态
async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now();
  
  try {
    // 执行简单的数据库查询
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime > 1000 ? 'degraded' : 'up', // 响应时间超过1秒认为是降级
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
      lastCheck: new Date().toISOString(),
    };
  }
}

// 检查错误监控系统健康状态
function checkErrorMonitorHealth(): ServiceStatus {
  try {
    // 检查错误监控系统是否正常工作
    const stats = errorMonitor.getErrorStats(1); // 获取最近1小时的统计
    
    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Error monitor check failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// 检查内存使用情况
function checkMemoryHealth(): ServiceStatus {
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const usedMB = memUsage.heapUsed / 1024 / 1024;
      const totalMB = memUsage.heapTotal / 1024 / 1024;
      const usagePercent = (usedMB / totalMB) * 100;
      
      let status: 'up' | 'degraded' | 'down' = 'up';
      if (usagePercent > 80) {
        status = 'degraded';
      }
      if (usagePercent > 95) {
        status = 'down';
      }
      
      return {
        status,
        lastCheck: new Date().toISOString(),
      };
    }
    
    return {
      status: 'up',
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Memory check failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// 检查熔断器状态
function checkCircuitBreakers(): ServiceStatus {
  try {
    const breakerStates = circuitBreakerManager.getAllStates();
    const openBreakers = Object.values(breakerStates).filter(state => state.state === 'OPEN');
    const halfOpenBreakers = Object.values(breakerStates).filter(state => state.state === 'HALF_OPEN');
    
    const totalBreakers = Object.keys(breakerStates).length;
    const openCount = openBreakers.length;
    const halfOpenCount = halfOpenBreakers.length;
    
    if (openCount > 0) {
      return {
        status: 'down',
        message: `${openCount}个熔断器处于开启状态`,
        lastCheck: new Date().toISOString(),
        details: {
          total_breakers: totalBreakers,
          open_breakers: openCount,
          half_open_breakers: halfOpenCount,
        },
      };
    } else if (halfOpenCount > 0) {
      return {
        status: 'degraded',
        message: `${halfOpenCount}个熔断器处于半开状态`,
        lastCheck: new Date().toISOString(),
        details: {
          total_breakers: totalBreakers,
          open_breakers: openCount,
          half_open_breakers: halfOpenCount,
        },
      };
    }
    
    return {
      status: 'up',
      message: '所有熔断器状态正常',
      lastCheck: new Date().toISOString(),
      details: {
        total_breakers: totalBreakers,
        open_breakers: openCount,
        half_open_breakers: halfOpenCount,
      },
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Circuit breaker check failed',
      lastCheck: new Date().toISOString(),
    };
  }
}

// 获取系统指标
async function getSystemMetrics() {
  try {
    const stats = errorMonitor.getErrorStats(1); // 最近1小时
    const totalRequests = 100; // 这里应该从实际的请求统计中获取
    
    // 获取熔断器统计
    const breakerStates = circuitBreakerManager.getAllStates();
    const breakerStats = Object.values(breakerStates).reduce(
      (acc, state) => {
        acc.total_requests += state.stats?.totalRequests || 0;
        acc.total_failures += state.stats?.failureCount || 0;
        return acc;
      },
      { total_requests: 0, total_failures: 0 }
    );
    
    const circuitBreakerMetrics = {
      total_breakers: Object.keys(breakerStates).length,
      open_breakers: Object.values(breakerStates).filter(s => s.state === 'OPEN').length,
      half_open_breakers: Object.values(breakerStates).filter(s => s.state === 'HALF_OPEN').length,
      total_requests: breakerStats.total_requests,
      total_failures: breakerStats.total_failures,
      overall_success_rate: breakerStats.total_requests > 0 
        ? ((breakerStats.total_requests - breakerStats.total_failures) / breakerStats.total_requests * 100)
        : 100,
    };
    
    return {
      totalErrors: stats.total,
      criticalErrors: stats.bySeverity.critical || 0,
      errorRate: totalRequests > 0 ? stats.total / totalRequests : 0,
      responseTime: 0, // 将在主函数中设置
      circuit_breaker_stats: circuitBreakerMetrics,
    };
  } catch (error) {
    return {
      totalErrors: 0,
      criticalErrors: 0,
      errorRate: 0,
      responseTime: 0,
      circuit_breaker_stats: {
        total_breakers: 0,
        open_breakers: 0,
        half_open_breakers: 0,
        total_requests: 0,
        total_failures: 0,
        overall_success_rate: 100,
      },
    };
  }
}