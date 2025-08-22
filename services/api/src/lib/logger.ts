import pino from 'pino';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * 日志级别
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 日志上下文
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

/**
 * 创建pino日志实例
 */
function createPinoLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

    // 开发环境使用美化输出，生产环境使用JSON
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

    // 基础字段配置
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      service: 'gulingtong-api',
      version: process.env.npm_package_version || '1.0.0',
    },

    // 时间戳格式
    timestamp: pino.stdTimeFunctions.isoTime,

    // 序列化器配置
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers?.['user-agent'],
          'x-forwarded-for': req.headers?.['x-forwarded-for'],
          'x-real-ip': req.headers?.['x-real-ip'],
        },
        remoteAddress: req.connection?.remoteAddress,
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.headers?.['content-type'],
          'content-length': res.headers?.['content-length'],
        },
      }),
      err: pino.stdSerializers.err,
    },

    // 格式化器
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  });
}

// 全局日志实例
const pinoLogger = createPinoLogger();

/**
 * 日志管理器类
 */
export class Logger {
  private context: LogContext;
  private logger: pino.Logger;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.logger = pinoLogger.child(context);
  }

  /**
   * 创建带上下文的子日志器
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  /**
   * 更新上下文
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
    this.logger = pinoLogger.child(this.context);
  }

  /**
   * 获取当前上下文
   */
  getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Trace级别日志
   */
  trace(message: string, meta?: any): void {
    this.logger.trace(meta, message);
  }

  /**
   * Debug级别日志
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(meta, message);
  }

  /**
   * Info级别日志
   */
  info(message: string, meta?: any): void {
    this.logger.info(meta, message);
  }

  /**
   * Warn级别日志
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(meta, message);
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      this.logger.error({ err: error, ...meta }, message);
    } else {
      this.logger.error({ error, ...meta }, message);
    }
  }

  /**
   * Fatal级别日志
   */
  fatal(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      this.logger.fatal({ err: error, ...meta }, message);
    } else {
      this.logger.fatal({ error, ...meta }, message);
    }
  }

  /**
   * 记录HTTP请求
   */
  logRequest(req: NextRequest, meta?: any): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      ...meta,
    });
  }

  /**
   * 记录HTTP响应
   */
  logResponse(statusCode: number, responseTime: number, meta?: any): void {
    this.info('HTTP Response', {
      statusCode,
      responseTime,
      ...meta,
    });
  }

  /**
   * 记录限流事件
   */
  logRateLimit(
    type: 'user' | 'ip',
    identifier: string,
    limit: number,
    current: number
  ): void {
    this.warn('Rate limit triggered', {
      type,
      identifier,
      limit,
      current,
      category: 'rate_limit',
    });
  }

  /**
   * 记录数据库操作
   */
  logDatabase(
    operation: string,
    table?: string,
    duration?: number,
    meta?: any
  ): void {
    this.debug('Database operation', {
      operation,
      table,
      duration,
      category: 'database',
      ...meta,
    });
  }

  /**
   * 记录缓存操作
   */
  logCache(
    operation: 'hit' | 'miss' | 'set' | 'del',
    key: string,
    meta?: any
  ): void {
    this.debug('Cache operation', {
      operation,
      key,
      category: 'cache',
      ...meta,
    });
  }
}

/**
 * 从请求中提取上下文信息
 */
export function extractRequestContext(req: NextRequest): LogContext {
  // 生成或获取requestId
  const requestId = req.headers.get('x-request-id') || uuidv4();

  // 获取客户端IP
  const getClientIP = (): string => {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return (
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      req.ip ||
      '127.0.0.1'
    );
  };

  // 获取用户ID（如果存在）
  const getUserId = (): string | undefined => {
    try {
      const userId =
        req.cookies.get('userId')?.value || req.headers.get('x-user-id');
      return userId || undefined;
    } catch {
      return undefined;
    }
  };

  return {
    requestId,
    userId: getUserId(),
    ip: getClientIP(),
    userAgent: req.headers.get('user-agent') || undefined,
    method: req.method,
    url: req.url,
  };
}

/**
 * 创建请求日志器
 */
export function createRequestLogger(req: NextRequest): Logger {
  const context = extractRequestContext(req);
  return new Logger(context);
}

/**
 * 默认日志器实例
 */
export const logger = new Logger();

/**
 * 日志中间件
 */
export function createLoggerMiddleware() {
  return function loggerMiddleware(req: NextRequest) {
    const startTime = Date.now();
    const requestLogger = createRequestLogger(req);

    // 记录请求开始
    requestLogger.info('Request started', {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
    });

    // 将logger添加到请求对象（如果支持）
    (req as any).logger = requestLogger;

    return {
      logger: requestLogger,
      logResponse: (statusCode: number, meta?: any) => {
        const responseTime = Date.now() - startTime;
        requestLogger.logResponse(statusCode, responseTime, meta);
      },
    };
  };
}

/**
 * 日志查询接口
 */
export interface LogQuery {
  requestId?: string;
  userId?: string;
  level?: LogLevel;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  meta?: any;
}

// 导出类型和实例
export { pino };
export default logger;
