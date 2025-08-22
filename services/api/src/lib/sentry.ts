import * as Sentry from '@sentry/nextjs';
import { httpIntegration, expressIntegration } from '@sentry/node';
import { NextRequest } from 'next/server';
import { getRedisClient, SentryConfig } from './redis';
import logger from './logger';

/**
 * Sentry配置接口
 */
export interface SentryConfiguration {
  dsn?: string;
  environment: string;
  sampleRate: number;
  tracesSampleRate: number;
  enabled: boolean;
  debug?: boolean;
}

/**
 * Sentry初始化状态
 */
let sentryInitialized = false;
let currentConfig: SentryConfiguration | null = null;

/**
 * 获取默认Sentry配置
 */
function getDefaultConfig(): SentryConfiguration {
  const dsn = process.env.SENTRY_DSN;

  return {
    dsn: dsn || undefined,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || '1.0'),
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'
    ),
    enabled: !!dsn, // 只有当DSN存在时才启用
    debug: process.env.NODE_ENV === 'development',
  };
}

/**
 * 初始化Sentry
 */
export async function initializeSentry(
  config?: SentryConfiguration
): Promise<void> {
  try {
    // 如果没有提供配置，尝试从Redis获取
    if (!config) {
      const redisConfig = await SentryConfig.getConfig();
      if (redisConfig) {
        config = {
          dsn: redisConfig.dsn,
          environment: redisConfig.environment,
          sampleRate: redisConfig.sampleRate,
          tracesSampleRate: redisConfig.sampleRate, // 使用相同的采样率
          enabled: redisConfig.enabled && !!redisConfig.dsn,
          debug: process.env.NODE_ENV === 'development',
        };
      } else {
        config = getDefaultConfig();
      }
    }

    // 如果Sentry未启用或没有DSN，跳过初始化
    if (!config.enabled || !config.dsn) {
      logger.info('Sentry monitoring disabled (no DSN provided)');
      currentConfig = config;
      return;
    }

    // 如果已经初始化且配置相同，跳过
    if (
      sentryInitialized &&
      currentConfig &&
      currentConfig.dsn === config.dsn &&
      currentConfig.environment === config.environment
    ) {
      return;
    }

    // 初始化Sentry
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      sampleRate: config.sampleRate,
      tracesSampleRate: config.tracesSampleRate,
      debug: config.debug,

      // 集成配置
      integrations: [httpIntegration(), expressIntegration()],

      // 错误过滤
      beforeSend(event, hint) {
        // 过滤掉一些不重要的错误
        const error = hint.originalException;

        if (error instanceof Error) {
          // 过滤网络错误
          if (
            error.message.includes('Network Error') ||
            error.message.includes('fetch')
          ) {
            return null;
          }

          // 过滤取消的请求
          if (error.name === 'AbortError') {
            return null;
          }
        }

        return event;
      },

      // 添加全局标签
      initialScope: {
        tags: {
          service: 'gulingtong-api',
          version: process.env.npm_package_version || '1.0.0',
        },
      },
    });

    sentryInitialized = true;
    currentConfig = config;

    logger.info('Sentry monitoring initialized', {
      dsn: config.dsn ? '[REDACTED]' : 'not configured',
      environment: config.environment,
      sampleRate: config.sampleRate,
      enabled: config.enabled,
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
  }
}

/**
 * 更新Sentry配置
 */
export async function updateSentryConfig(
  config: Partial<SentryConfiguration>
): Promise<void> {
  try {
    // 保存配置到Redis
    await SentryConfig.setConfig({
      dsn: config.dsn,
      environment: config.environment || 'production',
      sampleRate: config.sampleRate || 1.0,
      enabled: config.enabled !== false && !!config.dsn,
    });

    // 重新初始化Sentry
    const newConfig: SentryConfiguration = {
      ...getDefaultConfig(),
      ...config,
      enabled: config.enabled !== false && !!config.dsn,
    };

    await initializeSentry(newConfig);

    logger.info('Sentry configuration updated', {
      dsn: config.dsn ? '[REDACTED]' : 'not configured',
      environment: config.environment,
      enabled: config.enabled,
    });
  } catch (error) {
    logger.error('Failed to update Sentry configuration', { error });
    throw error;
  }
}

/**
 * 获取当前Sentry配置
 */
export function getCurrentSentryConfig(): SentryConfiguration | null {
  return currentConfig;
}

/**
 * 检查Sentry是否已启用
 */
export function isSentryEnabled(): boolean {
  return sentryInitialized && !!currentConfig?.enabled && !!currentConfig?.dsn;
}

/**
 * 捕获异常
 */
export function captureException(
  error: Error,
  context?: any
): string | undefined {
  if (!isSentryEnabled()) {
    return undefined;
  }

  return Sentry.captureException(error, {
    tags: {
      component: context?.component,
      operation: context?.operation,
    },
    extra: context,
  });
}

/**
 * 捕获消息
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): string {
  if (!isSentryEnabled()) {
    return '';
  }

  return Sentry.captureMessage(message, {
    level,
    tags: {
      source: 'manual',
      timestamp: new Date().toISOString(),
    },
    extra: context,
  });
}

/**
 * 设置用户上下文
 */
export function setUserContext(user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser(user);
}

/**
 * 设置请求上下文
 */
export function setRequestContext(context: {
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
}): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setContext('request', context);
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info',
  data?: any
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * 创建性能事务
 */
export function startTransaction(
  name: string,
  op: string,
  description?: string
): any {
  if (!isSentryEnabled()) {
    return null;
  }

  const span = Sentry.startInactiveSpan({
    name,
    op,
    description,
  });

  return {
    setTag: (key: string, value: string) => {
      span?.setTag(key, value);
    },
    setStatus: (status: string) => {
      span?.setStatus(status as any);
    },
    finish: () => {
      span?.end();
    },
  };
}

/**
 * Sentry中间件
 */
export function createSentryMiddleware() {
  return function sentryMiddleware(req: any) {
    if (!isSentryEnabled()) {
      return {
        transaction: undefined,
        finish: () => {},
      };
    }

    // 设置用户上下文
    const userId =
      req.cookies?.get('userId')?.value || req.headers?.get('x-user-id');
    if (userId) {
      setUserContext({ id: userId });
    }

    // 设置请求上下文
    const requestId = req.headers?.get('x-request-id');
    setRequestContext({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers?.get('user-agent'),
    });

    // 创建性能事务
    const transaction = startTransaction(
      `${req.method} ${req.url}`,
      'http.server'
    );

    return {
      transaction,
      finish: (statusCode?: number, error?: Error) => {
        if (transaction) {
          transaction.setTag(
            'http.status_code',
            statusCode?.toString() || 'unknown'
          );

          if (error) {
            transaction.setStatus('internal_error');
            captureException(error, {
              component: 'middleware',
              operation: 'request_handling',
              statusCode,
            });
          } else if (statusCode && statusCode >= 400) {
            transaction.setStatus('failed_precondition');
          } else {
            transaction.setStatus('ok');
          }

          transaction.finish();
        }
      },
    };
  };
}

// 在模块加载时初始化Sentry
if (typeof window === 'undefined') {
  // 只在服务器端初始化
  initializeSentry().catch(error => {
    console.error('Failed to initialize Sentry on startup:', error);
  });
}

// 导出Sentry实例
export { Sentry };
