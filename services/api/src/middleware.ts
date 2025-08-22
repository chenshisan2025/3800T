import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from '@/lib/startup';

// 应用初始化标志
let isInitialized = false;

// 限流配置
const RATE_LIMIT_CONFIG = {
  '/api/ai': {
    userLimit: 10, // 每分钟10次
    ipLimit: 20, // 每分钟20次
    windowMs: 60000, // 1分钟窗口
  },
  '/api/market': {
    userLimit: 30, // 每分钟30次
    ipLimit: 60, // 每分钟60次
    windowMs: 60000, // 1分钟窗口
  },
};

// 获取客户端IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return request.ip || 'unknown';
}

// 获取用户ID（从JWT token或cookie）
function getUserId(request: NextRequest): string | null {
  // 从Authorization header获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // 简单解析JWT payload（不验证签名，仅用于限流）
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || null;
    } catch {
      // 忽略解析错误
    }
  }

  // 从cookie获取
  const userCookie = request.cookies.get('user_id');
  if (userCookie) {
    return userCookie.value;
  }

  return null;
}

// 简化的限流检查（使用内存存储，适合Edge Runtime）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // 创建新记录或重置过期记录
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // 超出限制
  }

  // 增加计数
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  // 只在第一次请求时初始化应用
  if (!isInitialized) {
    await initializeApp();
    isInitialized = true;
  }

  const { pathname } = request.nextUrl;

  // 检查是否需要应用限流
  let rateLimitConfig = null;
  if (pathname.startsWith('/api/ai/')) {
    rateLimitConfig = RATE_LIMIT_CONFIG['/api/ai'];
  } else if (pathname.startsWith('/api/market/')) {
    rateLimitConfig = RATE_LIMIT_CONFIG['/api/market'];
  }

  if (rateLimitConfig) {
    const clientIP = getClientIP(request);
    const userId = getUserId(request);

    // 优先检查用户级限流
    if (userId) {
      const userKey = `user:${userId}:${pathname.split('/')[2]}`; // ai 或 market
      if (
        !checkRateLimit(
          userKey,
          rateLimitConfig.userLimit,
          rateLimitConfig.windowMs
        )
      ) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: '请求过于频繁，请稍后再试',
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'User rate limit exceeded',
            },
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimitConfig.userLimit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(
                (Date.now() + rateLimitConfig.windowMs) / 1000
              ).toString(),
              'Retry-After': Math.ceil(
                rateLimitConfig.windowMs / 1000
              ).toString(),
            },
          }
        );
      }
    }

    // 检查IP级限流
    const ipKey = `ip:${clientIP}:${pathname.split('/')[2]}`; // ai 或 market
    if (
      !checkRateLimit(ipKey, rateLimitConfig.ipLimit, rateLimitConfig.windowMs)
    ) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: '请求过于频繁，请稍后再试',
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'IP rate limit exceeded',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitConfig.ipLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(
              (Date.now() + rateLimitConfig.windowMs) / 1000
            ).toString(),
            'Retry-After': Math.ceil(
              rateLimitConfig.windowMs / 1000
            ).toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配需要限流的API路径和其他路径:
     * - /api/ai/* (AI相关API)
     * - /api/market/* (市场数据API)
     * - 其他非静态资源路径
     */
    '/api/ai/:path*',
    '/api/market/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
