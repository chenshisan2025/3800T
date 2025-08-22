import { Request, Response, NextFunction } from 'express';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { fail, ErrorCodes } from '../lib/http';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionPlan?: string;
  iat?: number;
  exp?: number;
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

// 扩展Request接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT认证中间件
 * 验证Authorization header中的Bearer token
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 获取Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    // 检查Bearer token格式
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // 提取token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    // 验证JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      } else {
        return res.status(401).json({ error: 'Token verification failed' });
      }
    }

    // 验证用户是否存在且状态正常
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: 'USER', // 默认角色
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 可选认证中间件
 * 如果提供了token则验证，否则继续执行
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // 如果没有Authorization header，直接继续
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionPlan: true,
        },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: 'USER', // 默认角色
        };
      }
    } catch (jwtError) {
      // 忽略token验证错误，继续执行
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * 生成JWT token
 */
export function generateToken(
  userId: string,
  expiresIn: string = '24h'
): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn } as any);
}

/**
 * 生成刷新token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: '7d',
  } as any);
}

/**
 * 验证刷新token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

/**
 * 从请求中提取用户ID
 */
export function getUserIdFromRequest(req: Request): string | null {
  return req.user?.id || null;
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}

/**
 * API Key认证中间件（用于系统间调用）
 */
export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
};

/**
 * 要求用户认证的中间件函数
 * 用于Next.js API路由
 */
export function requireUser() {
  return async (request: NextRequest, requestId: string) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return fail(
        {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Authorization header missing',
        },
        requestId,
        401
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return fail(
        {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Invalid authorization format',
        },
        requestId,
        401
      );
    }

    const token = authHeader.substring(7);

    if (!token) {
      return fail(
        {
          code: ErrorCodes.UNAUTHORIZED,
          message: 'Token missing',
        },
        requestId,
        401
      );
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          subscriptionPlan: true,
        },
      });

      if (!user) {
        return fail(
          {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'User not found',
          },
          requestId,
          401
        );
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: 'USER',
          subscriptionPlan: user.subscriptionPlan || 'free',
        } as AuthUser,
      };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return fail(
          {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Token expired',
          },
          requestId,
          401
        );
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return fail(
          {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Invalid token',
          },
          requestId,
          401
        );
      } else {
        return fail(
          {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Token verification failed',
          },
          requestId,
          401
        );
      }
    }
  };
}

/**
 * 功能门控中间件
 * 检查用户订阅计划是否满足要求
 */
export function featureGate(required: SubscriptionPlan) {
  return async (user: AuthUser, requestId: string) => {
    const userPlan = user.subscriptionPlan || 'free';

    // 定义计划层级
    const planHierarchy: Record<SubscriptionPlan, number> = {
      free: 0,
      pro: 1,
      enterprise: 2,
    };

    const userLevel = planHierarchy[userPlan as SubscriptionPlan] ?? 0;
    const requiredLevel = planHierarchy[required];

    if (userLevel < requiredLevel) {
      return fail(
        {
          code: ErrorCodes.FEATURE_NOT_AVAILABLE,
          message: `This feature requires ${required} subscription. Current plan: ${userPlan}`,
        },
        requestId,
        403
      );
    }

    return null; // 通过验证
  };
}

/**
 * 组合认证和功能门控的便捷函数
 */
export function requireUserWithFeature(required: SubscriptionPlan) {
  return async (request: NextRequest, requestId: string) => {
    const authResult = await requireUser()(request, requestId);

    // 如果认证失败，直接返回错误
    if ('ok' in authResult && !authResult.ok) {
      return authResult;
    }

    const { user } = authResult as { user: AuthUser };

    // 检查功能门控
    const featureResult = await featureGate(required)(user, requestId);
    if (featureResult) {
      return featureResult;
    }

    return { user };
  };
}
