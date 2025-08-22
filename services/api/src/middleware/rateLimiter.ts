import { NextRequest, NextResponse } from 'next/server';
import { RateLimitStore, RateLimitConfig } from '@/lib/redis';

/**
 * 限流中间件配置
 */
export interface RateLimitOptions {
  userLimit?: number;
  ipLimit?: number;
  windowMs?: number;
  enabled?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * 限流结果
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  totalHits: number;
}

/**
 * 获取客户端IP地址
 */
function getClientIP(req: NextRequest): string {
  // 优先从 X-Forwarded-For 获取真实IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 其他代理头
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Cloudflare
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  // 默认返回连接IP（在本地开发时可能是 ::1 或 127.0.0.1）
  return req.ip || '127.0.0.1';
}

/**
 * 获取用户ID（从JWT token或session）
 */
function getUserId(req: NextRequest): string | null {
  try {
    // 从Authorization header获取token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // 这里应该解析JWT token获取用户ID
      // 为了简化，我们从cookie或header中获取用户标识
      const userId =
        req.cookies.get('userId')?.value || req.headers.get('x-user-id');
      return userId || null;
    }

    // 从cookie获取用户ID
    const userId = req.cookies.get('userId')?.value;
    return userId || null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
}

/**
 * 创建限流中间件
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<NextResponse | null> {
    try {
      // 获取配置（优先使用Redis中的配置）
      const config = await RateLimitConfig.getConfig();
      if (!config || !config.enabled) {
        return null; // 限流未启用，继续处理请求
      }

      const {
        userLimit = config.userLimit,
        ipLimit = config.ipLimit,
        windowMs = config.windowMs,
      } = options;

      const clientIP = getClientIP(req);
      const userId = getUserId(req);

      // 检查用户级限流（如果用户已登录）
      if (userId) {
        const userKey = `user:${userId}`;
        const userResult = await checkRateLimit(userKey, userLimit, windowMs);

        if (!userResult.success) {
          return createRateLimitResponse(userResult, 'user');
        }
      }

      // 检查IP级限流
      const ipKey = `ip:${clientIP}`;
      const ipResult = await checkRateLimit(ipKey, ipLimit, windowMs);

      if (!ipResult.success) {
        return createRateLimitResponse(ipResult, 'ip');
      }

      // 限流检查通过，添加限流信息到响应头
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', ipLimit.toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        ipResult.remaining.toString()
      );
      response.headers.set(
        'X-RateLimit-Reset',
        ipResult.resetTime.getTime().toString()
      );

      return response;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // 发生错误时不阻止请求，但记录错误
      return null;
    }
  };
}

/**
 * 检查限流
 */
async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const result = await RateLimitStore.increment(key, windowMs);
    const resetTime = new Date(Date.now() + result.ttl * 1000);

    return {
      success: result.count <= limit,
      limit,
      remaining: Math.max(0, limit - result.count),
      resetTime,
      totalHits: result.count,
    };
  } catch (error) {
    console.error('Failed to check rate limit:', error);
    // 发生错误时允许请求通过
    return {
      success: true,
      limit,
      remaining: limit,
      resetTime: new Date(Date.now() + windowMs),
      totalHits: 0,
    };
  }
}

/**
 * 创建限流响应
 */
function createRateLimitResponse(
  result: RateLimitResult,
  type: 'user' | 'ip'
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded for ${type}. Try again later.`,
      retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
    },
    { status: 429 }
  );

  // 添加标准的限流响应头
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set(
    'X-RateLimit-Reset',
    result.resetTime.getTime().toString()
  );
  response.headers.set(
    'Retry-After',
    Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
  );

  return response;
}

/**
 * 重置限流计数器
 */
export async function resetRateLimit(
  identifier: string,
  type: 'user' | 'ip'
): Promise<void> {
  const key = `${type}:${identifier}`;
  await RateLimitStore.reset(key);
}

/**
 * 获取限流状态
 */
export async function getRateLimitStatus(
  identifier: string,
  type: 'user' | 'ip'
): Promise<{ count: number; ttl: number }> {
  const key = `${type}:${identifier}`;
  return await RateLimitStore.getCount(key);
}

/**
 * 默认限流中间件实例
 */
export const rateLimiter = createRateLimiter();
