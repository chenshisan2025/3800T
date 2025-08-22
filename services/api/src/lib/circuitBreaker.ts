import { recordError, ErrorType, ErrorSeverity } from './errorMonitor';
import logger from './logger';

// 熔断器状态
export enum CircuitBreakerState {
  CLOSED = 'closed', // 正常状态
  OPEN = 'open', // 熔断状态
  HALF_OPEN = 'half_open', // 半开状态
}

// 熔断器配置
interface CircuitBreakerConfig {
  failureThreshold: number; // 失败阈值
  recoveryTimeout: number; // 恢复超时时间（毫秒）
  monitoringPeriod: number; // 监控周期（毫秒）
  minimumRequests: number; // 最小请求数
  successThreshold: number; // 半开状态下的成功阈值
}

// 熔断器统计信息
interface CircuitBreakerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

// 熔断器类
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private stats: CircuitBreakerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastFailureTime: 0,
    lastSuccessTime: 0,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
  };
  private nextAttempt: number = 0;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: 5, // 5次失败后熔断
      recoveryTimeout: 60000, // 60秒后尝试恢复
      monitoringPeriod: 300000, // 5分钟监控周期
      minimumRequests: 10, // 最少10个请求才开始统计
      successThreshold: 3, // 半开状态下3次成功后恢复
      ...config,
    };
  }

  // 执行受保护的操作
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // 检查熔断器状态
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `Circuit breaker is OPEN for ${this.name}. Next attempt at ${new Date(this.nextAttempt).toISOString()}`
        );
      } else {
        // 转换到半开状态
        this.state = CircuitBreakerState.HALF_OPEN;
        this.stats.consecutiveSuccesses = 0;
        logger.info('熔断器转换到半开状态', { name: this.name });
      }
    }

    this.stats.totalRequests++;
    const startTime = Date.now();

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  // 成功回调
  private onSuccess(): void {
    this.stats.successfulRequests++;
    this.stats.lastSuccessTime = Date.now();
    this.stats.consecutiveFailures = 0;
    this.stats.consecutiveSuccesses++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.stats.consecutiveSuccesses >= this.config.successThreshold) {
        // 恢复到关闭状态
        this.state = CircuitBreakerState.CLOSED;
        this.resetStats();
        logger.info('熔断器恢复到关闭状态', { name: this.name });
      }
    }
  }

  // 失败回调
  private onFailure(error: any): void {
    this.stats.failedRequests++;
    this.stats.lastFailureTime = Date.now();
    this.stats.consecutiveFailures++;
    this.stats.consecutiveSuccesses = 0;

    // 记录错误
    recordError(
      error instanceof Error ? error : 'Circuit breaker operation failed',
      ErrorType.CIRCUIT_BREAKER_ERROR,
      ErrorSeverity.MEDIUM,
      `CircuitBreaker.${this.name}`,
      {
        state: this.state,
        consecutiveFailures: this.stats.consecutiveFailures,
        totalRequests: this.stats.totalRequests,
      }
    );

    // 检查是否需要打开熔断器
    if (this.shouldTrip()) {
      this.trip();
    }
  }

  // 判断是否应该触发熔断
  private shouldTrip(): boolean {
    // 请求数量不足，不触发熔断
    if (this.stats.totalRequests < this.config.minimumRequests) {
      return false;
    }

    // 连续失败次数达到阈值
    if (this.stats.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // 在监控周期内的失败率过高
    const monitoringStartTime = Date.now() - this.config.monitoringPeriod;
    if (this.stats.lastFailureTime > monitoringStartTime) {
      const failureRate = this.stats.failedRequests / this.stats.totalRequests;
      return failureRate > 0.5; // 失败率超过50%
    }

    return false;
  }

  // 触发熔断
  private trip(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttempt = Date.now() + this.config.recoveryTimeout;

    logger.warn('熔断器触发到开启状态', {
      name: this.name,
      consecutiveFailures: this.stats.consecutiveFailures,
      totalRequests: this.stats.totalRequests,
      failureRate: this.stats.failedRequests / this.stats.totalRequests,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    });

    // 记录熔断事件
    recordError(
      `Circuit breaker ${this.name} tripped`,
      ErrorType.CIRCUIT_BREAKER_ERROR,
      ErrorSeverity.HIGH,
      'CircuitBreaker',
      {
        name: this.name,
        stats: this.stats,
        nextAttempt: this.nextAttempt,
      }
    );
  }

  // 重置统计信息
  private resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastFailureTime: 0,
      lastSuccessTime: Date.now(),
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
    };
  }

  // 手动重置熔断器
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.nextAttempt = 0;
    this.resetStats();
    logger.info('熔断器手动重置', { name: this.name });
  }

  // 获取熔断器状态
  getState(): CircuitBreakerState {
    return this.state;
  }

  // 获取统计信息
  getStats(): CircuitBreakerStats & {
    state: CircuitBreakerState;
    name: string;
  } {
    return {
      ...this.stats,
      state: this.state,
      name: this.name,
    };
  }

  // 检查是否可用
  isAvailable(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true;
    }
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      return true;
    }
    if (this.state === CircuitBreakerState.OPEN) {
      return Date.now() >= this.nextAttempt;
    }
    return false;
  }
}

// 熔断器管理器
class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  // 获取或创建熔断器
  getBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  // 获取所有熔断器状态
  getAllStats(): Array<
    CircuitBreakerStats & { state: CircuitBreakerState; name: string }
  > {
    return Array.from(this.breakers.values()).map(breaker =>
      breaker.getStats()
    );
  }

  // 重置所有熔断器
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
    logger.info('所有熔断器已重置');
  }

  // 重置指定熔断器
  reset(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }

  // 获取熔断器数量
  getCount(): number {
    return this.breakers.size;
  }

  // 清理不活跃的熔断器
  cleanup(): void {
    const now = Date.now();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24小时

    for (const [name, breaker] of this.breakers.entries()) {
      const stats = breaker.getStats();
      const lastActivity = Math.max(
        stats.lastSuccessTime,
        stats.lastFailureTime
      );

      if (now - lastActivity > inactiveThreshold && stats.totalRequests === 0) {
        this.breakers.delete(name);
        logger.info('清理不活跃的熔断器', { name });
      }
    }
  }
}

// 全局熔断器管理器实例
export const circuitBreakerManager = new CircuitBreakerManager();

// 预定义的熔断器配置
export const CIRCUIT_BREAKER_CONFIGS = {
  DATABASE: {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    monitoringPeriod: 180000,
    minimumRequests: 5,
    successThreshold: 2,
  },
  AI_SERVICE: {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 300000,
    minimumRequests: 10,
    successThreshold: 3,
  },
  EXTERNAL_API: {
    failureThreshold: 4,
    recoveryTimeout: 45000,
    monitoringPeriod: 240000,
    minimumRequests: 8,
    successThreshold: 2,
  },
  RATE_LIMIT: {
    failureThreshold: 10,
    recoveryTimeout: 120000,
    monitoringPeriod: 600000,
    minimumRequests: 20,
    successThreshold: 5,
  },
};

// 便捷方法
export const getDatabaseBreaker = () =>
  circuitBreakerManager.getBreaker(
    'database',
    CIRCUIT_BREAKER_CONFIGS.DATABASE
  );

export const getAIServiceBreaker = () =>
  circuitBreakerManager.getBreaker(
    'ai_service',
    CIRCUIT_BREAKER_CONFIGS.AI_SERVICE
  );

export const getExternalAPIBreaker = () =>
  circuitBreakerManager.getBreaker(
    'external_api',
    CIRCUIT_BREAKER_CONFIGS.EXTERNAL_API
  );

export const getRateLimitBreaker = () =>
  circuitBreakerManager.getBreaker(
    'rate_limit',
    CIRCUIT_BREAKER_CONFIGS.RATE_LIMIT
  );

// 定期清理任务
setInterval(
  () => {
    circuitBreakerManager.cleanup();
  },
  60 * 60 * 1000
); // 每小时清理一次
