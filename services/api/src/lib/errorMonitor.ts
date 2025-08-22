import logger from './logger';

// 错误类型枚举
export enum ErrorType {
  API_ERROR = 'api_error',
  DATABASE_ERROR = 'database_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  SYSTEM_ERROR = 'system_error',
  AI_SERVICE_ERROR = 'ai_service_error',
  CIRCUIT_BREAKER_ERROR = 'circuit_breaker_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 错误记录接口
interface ErrorRecord {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  userId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
}

// 错误统计接口
interface ErrorStats {
  total: number;
  byType: Record<ErrorType, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byHour: Record<string, number>;
  recentErrors: ErrorRecord[];
  topErrors: Array<{ message: string; count: number; lastOccurred: Date }>;
}

class ErrorMonitor {
  private errors: ErrorRecord[] = [];
  private maxErrors = 1000; // 最多保存1000条错误记录
  private errorCounts: Map<string, { count: number; lastOccurred: Date }> =
    new Map();

  // 记录错误
  recordError(
    error: Error | string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: string,
    metadata?: Record<string, any>
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const errorRecord: ErrorRecord = {
      id: this.generateErrorId(),
      type,
      severity,
      message: errorMessage,
      stack: errorStack,
      context,
      metadata,
      timestamp: new Date(),
      resolved: false,
    };

    // 添加到错误列表
    this.errors.unshift(errorRecord);

    // 保持错误记录数量限制
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // 更新错误计数
    const errorKey = `${type}:${errorMessage}`;
    const existing = this.errorCounts.get(errorKey);
    this.errorCounts.set(errorKey, {
      count: (existing?.count || 0) + 1,
      lastOccurred: new Date(),
    });

    // 记录到日志
    const logMessage = `[${type}] ${errorMessage}`;
    const logMeta = {
      errorId: errorRecord.id,
      severity,
      context,
      metadata,
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(logMessage, {
          errorId: errorRecord.id,
          severity,
          context,
          metadata,
          stack: errorStack,
        });
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(logMessage, logMeta);
        break;
      case ErrorSeverity.LOW:
        logger.info(logMessage, logMeta);
        break;
    }

    // 检查是否需要触发告警
    this.checkAlerts(errorRecord);

    return errorRecord.id;
  }

  // 标记错误为已解决
  resolveError(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      logger.info('错误已解决', { errorId });
      return true;
    }
    return false;
  }

  // 获取错误统计
  getErrorStats(hours: number = 24): ErrorStats {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoffTime);

    const stats: ErrorStats = {
      total: recentErrors.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byHour: {},
      recentErrors: recentErrors.slice(0, 50), // 最近50条
      topErrors: [],
    };

    // 初始化计数器
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // 统计错误
    recentErrors.forEach(error => {
      stats.byType[error.type]++;
      stats.bySeverity[error.severity]++;

      const hour = error.timestamp.getHours().toString().padStart(2, '0');
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    // 获取最常见的错误
    const errorFrequency = Array.from(this.errorCounts.entries())
      .filter(([_, data]) => data.lastOccurred >= cutoffTime)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, data]) => ({
        message: key.split(':')[1],
        count: data.count,
        lastOccurred: data.lastOccurred,
      }));

    stats.topErrors = errorFrequency;

    return stats;
  }

  // 获取特定类型的错误
  getErrorsByType(type: ErrorType, limit: number = 50): ErrorRecord[] {
    return this.errors.filter(e => e.type === type).slice(0, limit);
  }

  // 获取未解决的错误
  getUnresolvedErrors(limit: number = 50): ErrorRecord[] {
    return this.errors.filter(e => !e.resolved).slice(0, limit);
  }

  // 清理旧错误记录
  cleanupOldErrors(days: number = 7): number {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const initialCount = this.errors.length;

    this.errors = this.errors.filter(e => e.timestamp >= cutoffTime);

    const removedCount = initialCount - this.errors.length;
    if (removedCount > 0) {
      logger.info('清理旧错误记录', { removedCount });
    }

    return removedCount;
  }

  // 生成错误ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 检查告警条件
  private checkAlerts(error: ErrorRecord): void {
    // 关键错误立即告警
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.triggerAlert('critical_error', error);
    }

    // 检查错误频率
    const recentErrors = this.errors.filter(
      e =>
        e.type === error.type &&
        e.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // 最近5分钟
    );

    if (recentErrors.length >= 10) {
      this.triggerAlert('high_frequency_error', error, {
        count: recentErrors.length,
        timeWindow: '5 minutes',
      });
    }
  }

  // 触发告警
  private triggerAlert(
    alertType: string,
    error: ErrorRecord,
    metadata?: any
  ): void {
    logger.error('错误告警触发', {
      alertType,
      errorId: error.id,
      errorMessage: error.message,
      errorType: error.type,
      severity: error.severity,
      metadata,
    });

    // 这里可以集成外部告警系统，如邮件、短信、Slack等
    // 例如：await sendSlackAlert(alertMessage, error, metadata);
  }
}

// 创建全局错误监控实例
export const errorMonitor = new ErrorMonitor();

// 便捷方法
export const recordError = errorMonitor.recordError.bind(errorMonitor);
export const resolveError = errorMonitor.resolveError.bind(errorMonitor);
export const getErrorStats = errorMonitor.getErrorStats.bind(errorMonitor);

// 自动清理任务（每小时执行一次）
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      errorMonitor.cleanupOldErrors();
    },
    60 * 60 * 1000
  ); // 1小时
}
