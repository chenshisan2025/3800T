import { NextRequest } from 'next/server';
import { getRequestId } from './http';

// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// 结构化日志接口
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  traceId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// 增强版日志记录器
export class EnhancedLogger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static createLogEntry(
    level: LogLevel,
    message: string,
    context?: {
      requestId?: string;
      traceId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...context,
    };
  }

  private static output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      default:
        console.log(logString);
    }
  }

  static error(
    message: string,
    context?: {
      requestId?: string;
      traceId?: string;
      userId?: string;
      metadata?: Record<string, any>;
      error?: Error;
    }
  ): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...context,
      metadata: {
        ...context?.metadata,
        ...(context?.error && {
          errorName: context.error.name,
          errorStack: context.error.stack,
        }),
      },
    });
    this.output(entry);
  }

  static warn(
    message: string,
    context?: {
      requestId?: string;
      traceId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.output(entry);
  }

  static info(
    message: string,
    context?: {
      requestId?: string;
      traceId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.output(entry);
  }

  static http(
    message: string,
    context: {
      requestId: string;
      method: string;
      url: string;
      statusCode?: number;
      duration?: number;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const entry: LogEntry = {
      ...this.createLogEntry(LogLevel.HTTP, message, context),
      method: context.method,
      url: context.url,
      statusCode: context.statusCode,
      duration: context.duration,
    };
    this.output(entry);
  }

  static debug(
    message: string,
    context?: {
      requestId?: string;
      traceId?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.output(entry);
    }
  }
}

// 请求日志中间件
export function logRequest(
  request: NextRequest,
  requestId: string,
  startTime: number = Date.now()
) {
  return {
    // 记录请求开始
    start: () => {
      EnhancedLogger.http('Request started', {
        requestId,
        method: request.method,
        url: request.url,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ip:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
        },
      });
    },

    // 记录请求完成
    end: (statusCode: number, userId?: string) => {
      const duration = Date.now() - startTime;
      EnhancedLogger.http('Request completed', {
        requestId,
        method: request.method,
        url: request.url,
        statusCode,
        duration,
        userId,
      });
    },

    // 记录请求错误
    error: (error: Error, statusCode: number = 500, userId?: string) => {
      const duration = Date.now() - startTime;
      EnhancedLogger.error('Request failed', {
        requestId,
        userId,
        error,
        metadata: {
          method: request.method,
          url: request.url,
          statusCode,
          duration,
        },
      });
    },
  };
}

// 便捷日志函数（带 requestId 支持）
export function logError(
  message: string,
  error?: Error,
  requestId?: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  EnhancedLogger.error(message, {
    requestId,
    traceId: requestId,
    userId,
    error,
    metadata,
  });
}

export function logInfo(
  message: string,
  requestId?: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  EnhancedLogger.info(message, {
    requestId,
    traceId: requestId,
    userId,
    metadata,
  });
}

export function logWarn(
  message: string,
  requestId?: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  EnhancedLogger.warn(message, {
    requestId,
    traceId: requestId,
    userId,
    metadata,
  });
}

export function logDebug(
  message: string,
  requestId?: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  EnhancedLogger.debug(message, {
    requestId,
    traceId: requestId,
    userId,
    metadata,
  });
}

// 兼容现有代码的简化日志记录器
export const logger = {
  error: (message: string, metadata?: Record<string, any>) =>
    EnhancedLogger.error(message, { metadata }),
  warn: (message: string, metadata?: Record<string, any>) =>
    EnhancedLogger.warn(message, { metadata }),
  info: (message: string, metadata?: Record<string, any>) =>
    EnhancedLogger.info(message, { metadata }),
  debug: (message: string, metadata?: Record<string, any>) =>
    EnhancedLogger.debug(message, { metadata }),
};
