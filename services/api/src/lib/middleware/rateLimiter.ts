import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

/**
 * 速率限制配置
 */
interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  keyGenerator?: (req: NextRequest) => string; // 键生成器
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
}

/**
 * 熔断器状态
 */
enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * 熔断器配置
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // 失败阈值
  recoveryTimeout: number; // 恢复超时时间
  monitoringPeriod: number; // 监控周期
}

/**
 * 请求记录
 */
interface RequestRecord {
  count: number;
  resetTime: number;
  failures: number;
  lastFailureTime: number;
}

/**
 * 熔断器记录
 */
interface CircuitBreakerRecord {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * 速率限制和熔断器管理器
 */
class RateLimiterManager {
  private requestRecords = new Map<string, RequestRecord>();
  private circuitBreakers = new Map<string, CircuitBreakerRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每5分钟清理过期记录
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * 检查速率限制
   */
  checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const record = this.requestRecords.get(key);

    if (!record || now > record.resetTime) {
      // 创建新记录或重置过期记录
      const newRecord: RequestRecord = {
        count: 1,
        resetTime: now + config.windowMs,
        failures: 0,
        lastFailureTime: 0,
      };
      this.requestRecords.set(key, newRecord);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newRecord.resetTime,
      };
    }

    if (record.count >= config.maxRequests) {
      // 超出速率限制
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    // 增加请求计数
    record.count++;
    this.requestRecords.set(key, record);

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * 检查熔断器状态
   */
  checkCircuitBreaker(
    key: string,
    config: CircuitBreakerConfig
  ): {
    allowed: boolean;
    state: CircuitBreakerState;
    retryAfter?: number;
  } {
    const now = Date.now();
    const breaker = this.circuitBreakers.get(key) || {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };

    switch (breaker.state) {
      case CircuitBreakerState.CLOSED:
        return { allowed: true, state: breaker.state };

      case CircuitBreakerState.OPEN:
        if (now >= breaker.nextAttemptTime) {
          // 转换到半开状态
          breaker.state = CircuitBreakerState.HALF_OPEN;
          this.circuitBreakers.set(key, breaker);
          return { allowed: true, state: breaker.state };
        }
        return {
          allowed: false,
          state: breaker.state,
          retryAfter: Math.ceil((breaker.nextAttemptTime - now) / 1000),
        };

      case CircuitBreakerState.HALF_OPEN:
        return { allowed: true, state: breaker.state };

      default:
        return { allowed: true, state: CircuitBreakerState.CLOSED };
    }
  }

  /**
   * 记录请求成功
   */
  recordSuccess(key: string, config: CircuitBreakerConfig): void {
    const breaker = this.circuitBreakers.get(key);
    if (breaker && breaker.state === CircuitBreakerState.HALF_OPEN) {
      // 从半开状态恢复到关闭状态
      breaker.state = CircuitBreakerState.CLOSED;
      breaker.failureCount = 0;
      this.circuitBreakers.set(key, breaker);

      logger.info('熔断器恢复', { key, state: breaker.state });
    }
  }

  /**
   * 记录请求失败
   */
  recordFailure(key: string, config: CircuitBreakerConfig): void {
    const now = Date.now();
    const breaker = this.circuitBreakers.get(key) || {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };

    breaker.failureCount++;
    breaker.lastFailureTime = now;

    if (breaker.failureCount >= config.failureThreshold) {
      // 触发熔断
      breaker.state = CircuitBreakerState.OPEN;
      breaker.nextAttemptTime = now + config.recoveryTimeout;

      logger.warn('熔断器触发', {
        key,
        failureCount: breaker.failureCount,
        nextAttemptTime: new Date(breaker.nextAttemptTime).toISOString(),
      });
    }

    this.circuitBreakers.set(key, breaker);
  }

  /**
   * 清理过期记录
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // 清理速率限制记录
    for (const [key, record] of this.requestRecords.entries()) {
      if (now > record.resetTime) {
        this.requestRecords.delete(key);
        cleanedCount++;
      }
    }

    // 清理熔断器记录（保留最近24小时的记录）
    const dayAgo = now - 24 * 60 * 60 * 1000;
    for (const [key, breaker] of this.circuitBreakers.entries()) {
      if (
        breaker.state === CircuitBreakerState.CLOSED &&
        breaker.lastFailureTime < dayAgo
      ) {
        this.circuitBreakers.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('清理过期记录', { cleanedCount });
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      rateLimitRecords: this.requestRecords.size,
      circuitBreakers: this.circuitBreakers.size,
      openCircuitBreakers: Array.from(this.circuitBreakers.values()).filter(
        b => b.state === CircuitBreakerState.OPEN
      ).length,
    };
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// 全局实例
const rateLimiterManager = new RateLimiterManager();

/**
 * 创建速率限制中间件
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : req.ip || req.headers.get('x-forwarded-for') || 'anonymous';

    const result = rateLimiterManager.checkRateLimit(key, config);

    if (!result.allowed) {
      logger.warn('速率限制触发', {
        key,
        remaining: result.remaining,
        retryAfter: result.retryAfter,
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: '请求过于频繁，请稍后再试',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }

    return null; // 允许请求继续
  };
}

/**
 * 创建熔断器中间件
 */
export function createCircuitBreaker(config: CircuitBreakerConfig) {
  return {
    check: async (key: string): Promise<NextResponse | null> => {
      const result = rateLimiterManager.checkCircuitBreaker(key, config);

      if (!result.allowed) {
        logger.warn('熔断器阻止请求', {
          key,
          state: result.state,
          retryAfter: result.retryAfter,
        });

        return NextResponse.json(
          {
            error: 'Service temporarily unavailable',
            message: '服务暂时不可用，请稍后再试',
            retryAfter: result.retryAfter,
          },
          {
            status: 503,
            headers: {
              'Retry-After': result.retryAfter?.toString() || '300',
            },
          }
        );
      }

      return null;
    },

    recordSuccess: (key: string) => {
      rateLimiterManager.recordSuccess(key, config);
    },

    recordFailure: (key: string) => {
      rateLimiterManager.recordFailure(key, config);
    },
  };
}

/**
 * 预定义的速率限制配置
 */
export const rateLimitConfigs = {
  // API接口限制：每分钟100次请求
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id');
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
      return userId ? `user:${userId}` : `ip:${ip}`;
    },
  },

  // 健康检查限制：每分钟60次请求
  health: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    keyGenerator: (req: NextRequest) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
      return `health:${ip}`;
    },
  },

  // 监控接口限制：每分钟30次请求
  monitor: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyGenerator: (req: NextRequest) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
      return `monitor:${ip}`;
    },
  },

  // AI分析限制：每小时10次请求
  aiAnalysis: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'anonymous';
      return `ai:${userId}`;
    },
  },

  // 数据提供商限制：每秒10次请求
  dataProvider: {
    windowMs: 1000,
    maxRequests: 10,
    keyGenerator: () => 'data-provider',
  },
};

/**
 * 预定义的熔断器配置
 */
export const circuitBreakerConfigs = {
  // 数据提供商熔断器
  dataProvider: {
    failureThreshold: 5, // 5次失败后熔断
    recoveryTimeout: 30 * 1000, // 30秒后尝试恢复
    monitoringPeriod: 60 * 1000, // 1分钟监控周期
  },

  // LLM服务熔断器
  llmService: {
    failureThreshold: 3, // 3次失败后熔断
    recoveryTimeout: 60 * 1000, // 1分钟后尝试恢复
    monitoringPeriod: 5 * 60 * 1000, // 5分钟监控周期
  },
};

export { rateLimiterManager };
export type { RateLimitConfig, CircuitBreakerConfig };
