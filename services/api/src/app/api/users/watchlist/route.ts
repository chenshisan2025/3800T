import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest, stockUtils } from '@/utils';
import { CreateWatchlistSchema } from '@/types';
import { logInfo, logError } from '@/lib/logger';
import { 
  SubscriptionPlan, 
  FeatureType, 
  getUserSubscriptionPlan, 
  checkLimit, 
  getCurrentUsage 
} from '@/middleware/featureGate';

// GET /api/users/watchlist - 获取用户自选股列表
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
    
    // 获取用户自选股列表
    const watchlist = await prisma.watchlist.findMany({
      where: { user_id: dbUser.id },
      include: {
        stock: {
          select: {
            code: true,
            name: true,
            market: true,
            industry: true,
            current_price: true,
            change_percent: true,
            updated_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    
    // 格式化响应数据
    const formattedWatchlist = watchlist.map((item) => ({
      id: item.id,
      stock: item.stock,
      added_at: item.created_at,
      notes: item.notes,
    }));
    
    logInfo('用户自选股列表查询', {
      userId: dbUser.id,
      count: watchlist.length,
    });
    
    return apiResponse.success({
      watchlist: formattedWatchlist,
      total: watchlist.length,
    });
    
  } catch (error) {
    logError('获取用户自选股列表失败', error);
    return handleApiError(error, 'GetUserWatchlist');
  }
}

// POST /api/users/watchlist - 添加股票到自选股
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }
    
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = validateRequest(CreateWatchlistSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }
    
    const { stock_code, notes } = validationResult.data;
    
    // 验证股票代码格式
    if (!stockUtils.isValidStockCode(stock_code)) {
      return apiResponse.error('无效的股票代码格式', 400, 'INVALID_STOCK_CODE');
    }
    
    const formattedCode = stockUtils.formatStockCode(stock_code);
    
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
    
    // 检查股票是否存在
    const stock = await prisma.stock.findUnique({
      where: { code: formattedCode },
      select: {
        id: true,
        code: true,
        name: true,
        market: true,
        current_price: true,
        change_percent: true,
      },
    });
    
    if (!stock) {
      return apiResponse.notFound('股票不存在');
    }
    
    // 检查是否已经在自选股中
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: {
        user_id: dbUser.id,
        stock_id: stock.id,
      },
    });

    if (existingWatchlist) {
      return apiResponse.error('该股票已在自选股中', 409, 'STOCK_ALREADY_IN_WATCHLIST');
    }

    // 获取用户订阅计划
    const plan = await getUserSubscriptionPlan(dbUser.id);
    
    // 检查自选股数量限制
    const currentWatchlistCount = await getCurrentUsage(dbUser.id, FeatureType.WATCHLIST_ITEMS);
    
    if (!checkLimit(plan, FeatureType.WATCHLIST_ITEMS, currentWatchlistCount)) {
      const limit = plan === SubscriptionPlan.FREE ? 10 : 100;
      return apiResponse.error(
        `自选股数量已达上限（${limit}个），请删除部分股票或升级Pro会员`,
        429,
        'WATCHLIST_LIMIT_EXCEEDED',
        {
          currentCount: currentWatchlistCount,
          limit,
          upgradeRequired: plan === SubscriptionPlan.FREE
        }
      );
    }
    
    // 添加到自选股
    const watchlistItem = await prisma.watchlist.create({
      data: {
        user_id: dbUser.id,
        stock_id: stock.id,
        notes: notes || null,
      },
      include: {
        stock: {
          select: {
            code: true,
            name: true,
            market: true,
            industry: true,
            current_price: true,
            change_percent: true,
          },
        },
      },
    });
    
    logInfo('股票添加到自选股成功', {
      userId: dbUser.id,
      stockCode: formattedCode,
      stockName: stock.name,
    });
    
    return apiResponse.success(
      {
        id: watchlistItem.id,
        stock: watchlistItem.stock,
        added_at: watchlistItem.created_at,
        notes: watchlistItem.notes,
      },
      '股票已添加到自选股'
    );
    
  } catch (error) {
    logError('添加股票到自选股失败', error);
    return handleApiError(error, 'AddToWatchlist');
  }
}