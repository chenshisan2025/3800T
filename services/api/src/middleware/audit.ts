import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getClientIP } from '../utils/ip';

const prisma = new PrismaClient();

export interface AuditContext {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
}

// 扩展Request接口以包含审计上下文
declare global {
  namespace Express {
    interface Request {
      auditContext?: AuditContext;
      startTime?: number;
    }
  }
}

/**
 * 审计日志中间件
 * 自动记录所有管理操作
 */
export const auditMiddleware = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 记录开始时间
    req.startTime = Date.now();

    // 从JWT token或session中获取用户信息
    const user = (req as any).user;
    if (!user) {
      return next();
    }

    // 设置审计上下文
    req.auditContext = {
      userId: user.id,
      userName: user.name || user.email,
      userRole: user.role || 'USER',
      action,
      resource,
      details: `${action} ${resource}`, // 默认详情，可在路由中覆盖
    };

    // 监听响应完成事件
    const originalSend = res.send;
    res.send = function (data) {
      // 记录审计日志
      recordAuditLog(req, res);
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * 记录审计日志
 */
async function recordAuditLog(req: Request, res: Response) {
  try {
    const auditContext = req.auditContext;
    if (!auditContext) return;

    const duration = req.startTime ? Date.now() - req.startTime : undefined;
    const ipAddress = getClientIP(req);
    const userAgent = req.get('User-Agent') || '';

    // 根据HTTP状态码确定操作状态
    let status = 'success';
    if (res.statusCode >= 400 && res.statusCode < 500) {
      status = 'warning';
    } else if (res.statusCode >= 500) {
      status = 'failed';
    }

    await prisma.auditLog.create({
      data: {
        userId: auditContext.userId,
        userName: auditContext.userName,
        userRole: auditContext.userRole,
        action: auditContext.action,
        resource: auditContext.resource,
        resourceId: auditContext.resourceId,
        details: auditContext.details,
        ipAddress,
        userAgent,
        status,
        duration,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
    // 不抛出错误，避免影响正常业务流程
  }
}

/**
 * 手动记录审计日志
 */
export async function logAuditEvent(
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  resource: string,
  details: string,
  options: {
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failed' | 'warning';
    duration?: number;
  } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        resource,
        resourceId: options.resourceId,
        details,
        ipAddress: options.ipAddress || 'unknown',
        userAgent: options.userAgent || 'unknown',
        status: options.status || 'success',
        duration: options.duration,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * 更新审计上下文详情
 */
export function updateAuditDetails(
  req: Request,
  details: string,
  resourceId?: string
) {
  if (req.auditContext) {
    req.auditContext.details = details;
    if (resourceId) {
      req.auditContext.resourceId = resourceId;
    }
  }
}

/**
 * 审计日志装饰器（用于类方法）
 */
export function Audit(action: string, resource: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(arg => arg && arg.method && arg.url); // 找到Request对象
      const startTime = Date.now();

      try {
        const result = await method.apply(this, args);

        // 记录成功操作
        if (req && req.user) {
          await logAuditEvent(
            req.user.id,
            req.user.name || req.user.email,
            req.user.role || 'USER',
            action,
            resource,
            `${action} ${resource} successfully`,
            {
              ipAddress: getClientIP(req),
              userAgent: req.get('User-Agent'),
              status: 'success',
              duration: Date.now() - startTime,
            }
          );
        }

        return result;
      } catch (error) {
        // 记录失败操作
        if (req && req.user) {
          await logAuditEvent(
            req.user.id,
            req.user.name || req.user.email,
            req.user.role || 'USER',
            action,
            resource,
            `${action} ${resource} failed: ${error instanceof Error ? error.message : String(error)}`,
            {
              ipAddress: getClientIP(req),
              userAgent: req.get('User-Agent'),
              status: 'failed',
              duration: Date.now() - startTime,
            }
          );
        }

        throw error;
      }
    };

    return descriptor;
  };
}
