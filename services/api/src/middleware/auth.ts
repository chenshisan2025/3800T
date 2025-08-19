import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}

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
        subscriptionPlan: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: 'USER' // 默认角色
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
          subscriptionPlan: true
        }
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: 'USER' // 默认角色
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
export function generateToken(userId: string, expiresIn: string = '24h'): string {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn } as any
  );
}

/**
 * 生成刷新token
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' } as any
  );
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
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
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