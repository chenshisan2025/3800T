import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import { auditMiddleware, updateAuditDetails } from '../../middleware/audit';
import { hasPermission, Permission } from '../../utils/rbac';
import { Parser } from 'json2csv';

const router = Router();
const prisma = new PrismaClient();

// 审计日志查询接口
router.get('/logs', 
  authMiddleware,
  auditMiddleware('VIEW', 'AUDIT_LOG'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // 检查权限
      if (!hasPermission(user.role, Permission.AUDIT_READ)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const {
        page = 1,
        pageSize = 20,
        userId,
        action,
        resource,
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // 构建查询条件
      const where: any = {};
      
      if (userId) {
        where.userId = userId;
      }
      
      if (action) {
        where.action = {
          contains: action as string,
          mode: 'insensitive'
        };
      }
      
      if (resource) {
        where.resource = {
          contains: resource as string,
          mode: 'insensitive'
        };
      }
      
      if (status) {
        where.status = status;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      // 计算分页
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      // 查询数据
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take,
          orderBy: {
            [sortBy as string]: sortOrder as 'asc' | 'desc'
          }
        }),
        prisma.auditLog.count({ where })
      ]);

      // 更新审计详情
      updateAuditDetails(req, `查询审计日志，返回 ${logs.length} 条记录`);

      res.json({
        data: logs,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / Number(pageSize))
        }
      });
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 审计日志统计接口
router.get('/stats',
  authMiddleware,
  auditMiddleware('VIEW', 'AUDIT_STATS'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // 检查权限
      if (!hasPermission(user.role, Permission.AUDIT_READ)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      // 总操作数
      const totalOperations = await prisma.auditLog.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      });

      // 成功操作数
      const successOperations = await prisma.auditLog.count({
        where: {
          status: 'success',
          createdAt: {
            gte: startDate
          }
        }
      });

      // 失败操作数
      const failedOperations = await prisma.auditLog.count({
        where: {
          status: 'failed',
          createdAt: {
            gte: startDate
          }
        }
      });

      // 活跃用户数
      const activeUsers = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: startDate
          }
        }
      });

      // 按操作类型统计
      const operationsByAction = await prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          id: true
        },
        where: {
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      // 按资源类型统计
      const operationsByResource = await prisma.auditLog.groupBy({
        by: ['resource'],
        _count: {
          id: true
        },
        where: {
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 10
      });

      // 每日操作趋势
      const dailyTrend = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      updateAuditDetails(req, `查询审计统计数据，时间范围：${days}天`);

      res.json({
        totalOperations,
        successOperations,
        failedOperations,
        activeUsersCount: activeUsers.length,
        successRate: totalOperations > 0 ? (successOperations / totalOperations * 100).toFixed(2) : '0',
        operationsByAction: operationsByAction.map(item => ({
          action: item.action,
          count: item._count.id
        })),
        operationsByResource: operationsByResource.map(item => ({
          resource: item.resource,
          count: item._count.id
        })),
        dailyTrend
      });
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 审计日志详情接口
router.get('/logs/:id',
  authMiddleware,
  auditMiddleware('VIEW', 'AUDIT_LOG'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // 检查权限
      if (!hasPermission(user.role, Permission.AUDIT_READ)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { id } = req.params;

      const log = await prisma.auditLog.findUnique({
        where: { id }
      });

      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      updateAuditDetails(req, `查看审计日志详情`, id);

      res.json(log);
    } catch (error) {
      console.error('Failed to fetch audit log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 审计日志导出接口
router.get('/export',
  authMiddleware,
  auditMiddleware('EXPORT', 'AUDIT_LOG'),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // 检查权限
      if (!hasPermission(user.role, Permission.AUDIT_READ)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const {
        format = 'csv',
        userId,
        action,
        resource,
        status,
        startDate,
        endDate,
        limit = 10000
      } = req.query;

      // 构建查询条件
      const where: any = {};
      
      if (userId) where.userId = userId;
      if (action) where.action = { contains: action as string, mode: 'insensitive' };
      if (resource) where.resource = { contains: resource as string, mode: 'insensitive' };
      if (status) where.status = status;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      // 查询数据
      const logs = await prisma.auditLog.findMany({
        where,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (format === 'csv') {
        // 导出CSV格式
        const fields = [
          { label: 'ID', value: 'id' },
          { label: '用户ID', value: 'userId' },
          { label: '用户名', value: 'userName' },
          { label: '用户角色', value: 'userRole' },
          { label: '操作', value: 'action' },
          { label: '资源', value: 'resource' },
          { label: '资源ID', value: 'resourceId' },
          { label: '详情', value: 'details' },
          { label: 'IP地址', value: 'ipAddress' },
          { label: '用户代理', value: 'userAgent' },
          { label: '状态', value: 'status' },
          { label: '耗时(ms)', value: 'duration' },
          { label: '创建时间', value: 'createdAt' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csv); // 添加BOM以支持中文
      } else {
        // 导出JSON格式
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`);
        res.json(logs);
      }

      updateAuditDetails(req, `导出审计日志，格式：${format}，数量：${logs.length}`);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;