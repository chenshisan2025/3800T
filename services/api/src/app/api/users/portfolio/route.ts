import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { CreatePortfolioSchema } from '@/types';
import { logInfo, logError } from '@/lib/logger';
import { 
  SubscriptionPlan, 
  FeatureType, 
  getUserSubscriptionPlan, 
  checkLimit, 
  getCurrentUsage 
} from '@/middleware/featureGate';

// GET /api/users/portfolio - 获取用户投资组合列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }
    
    // 查找或创建用户记录
    let dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });
    
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabase_id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        },
      });
    }
    
    // 获取用户投资组合列表
    const portfolios = await prisma.portfolio.findMany({
      where: { user_id: dbUser.id },
      include: {
        items: {
          include: {
            stock: {
              select: {
                code: true,
                name: true,
                market: true,
                current_price: true,
                change_percent: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 计算每个投资组合的统计信息
    const portfoliosWithStats = portfolios.map((portfolio) => {
      const totalValue = portfolio.items.reduce((sum, item) => {
        const currentValue = item.quantity * (item.stock.current_price || 0);
        return sum + currentValue;
      }, 0);
      
      const totalCost = portfolio.items.reduce((sum, item) => {
        return sum + (item.quantity * item.average_cost);
      }, 0);
      
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      
      return {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        created_at: portfolio.createdAt,
        updated_at: portfolio.updatedAt,
        items_count: portfolio._count.items,
        stats: {
          total_value: totalValue,
          total_cost: totalCost,
          total_gain_loss: totalGainLoss,
          total_gain_loss_percent: totalGainLossPercent,
        },
        items: portfolio.items.map((item) => {
          const currentValue = item.quantity * (item.stock.current_price || 0);
          const cost = item.quantity * item.average_cost;
          const gainLoss = currentValue - cost;
          const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
          
          return {
            id: item.id,
            stock: item.stock,
            quantity: item.quantity,
            average_cost: item.average_cost,
            current_value: currentValue,
            gain_loss: gainLoss,
            gain_loss_percent: gainLossPercent,
            added_at: item.createdAt,
          };
        }),
      };
    });
    
    logInfo('用户投资组合列表查询', {
      userId: dbUser.id,
      count: portfolios.length,
    });
    
    return apiResponse.success({
      portfolios: portfoliosWithStats,
      total: portfolios.length,
    });
    
  } catch (error) {
    logError('获取用户投资组合列表失败', error);
    return handleApiError(error, 'GetUserPortfolios');
  }
}

// POST /api/users/portfolio - 创建新的投资组合
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }
    
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = validateRequest(CreatePortfolioSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }
    
    const { name, description } = validationResult.data;
    
    // 查找或创建用户记录
    let dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });
    
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          supabase_id: user.id,
          email: user.email || '',
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
        },
      });
    }
    
    // 检查投资组合名称是否已存在
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        user_id: dbUser.id,
        name,
      },
    });
    
    if (existingPortfolio) {
      return apiResponse.error('投资组合名称已存在', 409, 'PORTFOLIO_NAME_EXISTS');
    }
    
    // 获取用户订阅计划
    const plan = await getUserSubscriptionPlan(dbUser.id);
    
    // 检查投资组合数量限制
    const currentPortfolioCount = await getCurrentUsage(dbUser.id, FeatureType.PORTFOLIO_ITEMS);
    
    if (!checkLimit(plan, FeatureType.PORTFOLIO_ITEMS, currentPortfolioCount)) {
      const limit = plan === SubscriptionPlan.FREE ? 3 : 20;
      return apiResponse.error(
        `投资组合数量已达上限（${limit}个），请删除部分组合或升级Pro会员`,
        429,
        'PORTFOLIO_LIMIT_EXCEEDED',
        {
          currentCount: currentPortfolioCount,
          limit,
          upgradeRequired: plan === SubscriptionPlan.FREE
        }
      );
    }
    
    // 创建投资组合
    const portfolio = await prisma.portfolio.create({
      data: {
        user_id: dbUser.id,
        name,
        description: description || null,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    
    logInfo('投资组合创建成功', {
      userId: dbUser.id,
      portfolioId: portfolio.id,
      portfolioName: name,
    });
    
    const response = {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      created_at: portfolio.createdAt,
      updated_at: portfolio.updatedAt,
      items_count: portfolio._count.items,
      stats: {
        total_value: 0,
        total_cost: 0,
        total_gain_loss: 0,
        total_gain_loss_percent: 0,
      },
      items: [],
    };
    
    return apiResponse.success(response, '投资组合创建成功');
    
  } catch (error) {
    logError('创建投资组合失败', error);
    return handleApiError(error, 'CreatePortfolio');
  }
}