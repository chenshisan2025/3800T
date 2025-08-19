import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { logInfo, logError } from '@/lib/logger';
import { z } from 'zod';
import { 
  SubscriptionPlan, 
  FeatureType, 
  getUserSubscriptionPlan, 
  checkLimit, 
  getCurrentUsage 
} from '@/middleware/featureGate';

// 验证 schema
const CreateAlertSchema = z.object({
  watchlistId: z.string().uuid('无效的自选股ID格式'),
  stockSymbol: z.string().min(1, '股票代码不能为空'),
  condition: z.enum(['gte', 'lte'], {
    errorMap: () => ({ message: '条件必须是 gte（大于等于）或 lte（小于等于）' }),
  }),
  targetPrice: z.number().positive('目标价格必须大于0'),
  message: z.string().optional(),
});

const UpdateAlertSchema = z.object({
  condition: z.enum(['gte', 'lte']).optional(),
  targetPrice: z.number().positive('目标价格必须大于0').optional(),
  message: z.string().optional(),
  isActive: z.boolean().optional(),
});

// 获取当前用户信息
async function getCurrentUser(request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// GET /api/alerts - 获取用户提醒规则列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }
    
    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get('watchlistId');
    const stockSymbol = searchParams.get('stockSymbol');
    const isActive = searchParams.get('isActive');
    
    // 构建查询条件
    let whereClause: any = {
      userId: user.id,
    };
    
    if (watchlistId) {
      whereClause.watchlistId = watchlistId;
    }
    
    if (stockSymbol) {
      whereClause.stockSymbol = stockSymbol;
    }
    
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }
    
    // 获取提醒规则列表
    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        watchlist: {
          select: {
            id: true,
            stockSymbol: true,
          },
        },
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
            market: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 格式化响应数据
    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      watchlistId: alert.watchlistId,
      stockSymbol: alert.stockSymbol,
      condition: alert.condition,
      targetPrice: alert.targetPrice,
      message: alert.message,
      isActive: alert.isActive,
      stock: alert.stock,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    }));
    
    logInfo('用户提醒规则列表查询成功', {
      userId: user.id,
      count: alerts.length,
      filters: { watchlistId, stockSymbol, isActive },
    });
    
    return apiResponse.success({
      alerts: formattedAlerts,
      total: alerts.length,
    });
    
  } catch (error) {
    logError(error as Error, 'GetAlerts');
    return handleApiError(error, 'GetAlerts');
  }
}

// POST /api/alerts - 创建提醒规则
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }
    
    // 验证请求参数
    const validation = await validateRequest(request, CreateAlertSchema);
    if (!validation.success) {
      return validation.error;
    }
    
    const { watchlistId, stockSymbol, condition, targetPrice, message } = validation.data;
    
    // 验证自选股是否存在且属于当前用户
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId: user.id,
        stockSymbol: stockSymbol,
      },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
          },
        },
      },
    });
    
    if (!watchlist) {
      return apiResponse.error('自选股不存在或无权限访问', 404, 'WATCHLIST_NOT_FOUND');
    }
    
    // 检查是否已存在相同条件的提醒规则
    const existingAlert = await prisma.alert.findFirst({
      where: {
        userId: user.id,
        watchlistId: watchlistId,
        stockSymbol: stockSymbol,
        condition: condition,
        targetPrice: targetPrice,
        isActive: true,
      },
    });
    
    if (existingAlert) {
      return apiResponse.error('相同条件的提醒规则已存在', 409, 'ALERT_ALREADY_EXISTS');
    }
    
    // 获取用户订阅计划
    const plan = await getUserSubscriptionPlan(user.id);
    
    // 检查提醒数量限制
    const currentAlertCount = await getCurrentUsage(user.id, FeatureType.ALERT_ITEMS);
    
    if (!checkLimit(plan, FeatureType.ALERT_ITEMS, currentAlertCount)) {
      const limit = plan === SubscriptionPlan.FREE ? 5 : 50;
      return apiResponse.error(
        `提醒规则数量已达上限（${limit}个），请删除部分提醒或升级Pro会员`,
        429,
        'ALERT_LIMIT_EXCEEDED',
        {
          currentCount: currentAlertCount,
          limit,
          upgradeRequired: plan === SubscriptionPlan.FREE
        }
      );
    }
    
    // 创建提醒规则
    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        watchlistId: watchlistId,
        stockSymbol: stockSymbol,
        condition: condition,
        targetPrice: targetPrice,
        message: message || `当 ${watchlist.stock.name}(${stockSymbol}) 价格${condition === 'gte' ? '大于等于' : '小于等于'} ${targetPrice} 时提醒`,
        isActive: true,
      },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
            market: true,
          },
        },
      },
    });
    
    logInfo('提醒规则创建成功', {
      userId: user.id,
      alertId: alert.id,
      stockSymbol: stockSymbol,
      condition: condition,
      targetPrice: targetPrice,
    });
    
    return apiResponse.success(
      {
        id: alert.id,
        watchlistId: alert.watchlistId,
        stockSymbol: alert.stockSymbol,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        message: alert.message,
        isActive: alert.isActive,
        stock: alert.stock,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
      },
      '提醒规则创建成功'
    );
    
  } catch (error) {
    logError(error as Error, 'CreateAlert');
    return handleApiError(error, 'CreateAlert');
  }
}

// PUT /api/alerts - 更新提醒规则
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }
    
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    
    if (!alertId) {
      return apiResponse.error('请提供提醒规则ID', 400, 'MISSING_ALERT_ID');
    }
    
    // 验证请求参数
    const validation = await validateRequest(request, UpdateAlertSchema);
    if (!validation.success) {
      return validation.error;
    }
    
    const updateData = validation.data;
    
    // 验证提醒规则是否存在且属于当前用户
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: user.id,
      },
    });
    
    if (!existingAlert) {
      return apiResponse.error('提醒规则不存在或无权限访问', 404, 'ALERT_NOT_FOUND');
    }
    
    // 更新提醒规则
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
            market: true,
          },
        },
      },
    });
    
    logInfo('提醒规则更新成功', {
      userId: user.id,
      alertId: alertId,
      updateData: updateData,
    });
    
    return apiResponse.success(
      {
        id: updatedAlert.id,
        watchlistId: updatedAlert.watchlistId,
        stockSymbol: updatedAlert.stockSymbol,
        condition: updatedAlert.condition,
        targetPrice: updatedAlert.targetPrice,
        message: updatedAlert.message,
        isActive: updatedAlert.isActive,
        stock: updatedAlert.stock,
        createdAt: updatedAlert.createdAt,
        updatedAt: updatedAlert.updatedAt,
      },
      '提醒规则更新成功'
    );
    
  } catch (error) {
    logError(error as Error, 'UpdateAlert');
    return handleApiError(error, 'UpdateAlert');
  }
}

// DELETE /api/alerts - 删除提醒规则
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }
    
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    
    if (!alertId) {
      return apiResponse.error('请提供提醒规则ID', 400, 'MISSING_ALERT_ID');
    }
    
    // 验证提醒规则是否存在且属于当前用户
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: user.id,
      },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    });
    
    if (!existingAlert) {
      return apiResponse.error('提醒规则不存在或无权限访问', 404, 'ALERT_NOT_FOUND');
    }
    
    // 删除提醒规则
    await prisma.alert.delete({
      where: { id: alertId },
    });
    
    logInfo('提醒规则删除成功', {
      userId: user.id,
      alertId: alertId,
      stockSymbol: existingAlert.stockSymbol,
    });
    
    return apiResponse.success(
      {
        id: existingAlert.id,
        stockSymbol: existingAlert.stockSymbol,
        stock: existingAlert.stock,
      },
      '提醒规则删除成功'
    );
    
  } catch (error) {
    logError(error as Error, 'DeleteAlert');
    return handleApiError(error, 'DeleteAlert');
  }
}