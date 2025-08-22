import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRouteHandlerClient } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { createRequestLogger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema
const CreateWatchlistSchema = z.object({
  stockSymbol: z.string().min(1, '股票代码不能为空'),
});

const UpdateWatchlistSchema = z.object({
  id: z.string().uuid('无效的ID格式'),
});

// 获取当前用户信息
async function getCurrentUser(request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// GET /api/watchlist - 获取用户自选股列表
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }

    // 获取用户自选股列表
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            market: true,
            industry: true,
            currentPrice: true,
            changePercent: true,
            updatedAt: true,
          },
        },
        alerts: {
          where: { isActive: true },
          select: {
            id: true,
            condition: true,
            targetPrice: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 格式化响应数据
    const formattedWatchlist = watchlist.map(item => ({
      id: item.id,
      stockSymbol: item.stockSymbol,
      stock: item.stock,
      alerts: item.alerts,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    logger.info('用户自选股列表查询成功', {
      userId: user.id,
      count: watchlist.length,
    });

    return apiResponse.success({
      watchlist: formattedWatchlist,
      total: watchlist.length,
    });
  } catch (error) {
    logger.error('获取用户自选股列表失败', { error });
    return handleApiError(error, 'GetWatchlist');
  }
}

// POST /api/watchlist - 添加股票到自选股
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }

    // 验证请求参数
    const validation = await validateRequest(request, CreateWatchlistSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { stockSymbol } = validation.data;

    // 检查股票是否存在
    const stock = await prisma.stock.findUnique({
      where: { symbol: stockSymbol },
      select: {
        symbol: true,
        name: true,
        market: true,
        industry: true,
        currentPrice: true,
        changePercent: true,
      },
    });

    if (!stock) {
      return apiResponse.error('股票不存在', 404, 'STOCK_NOT_FOUND');
    }

    // 检查是否已经在自选股中
    const existingWatchlist = await prisma.watchlist.findUnique({
      where: {
        userId_stockSymbol: {
          userId: user.id,
          stockSymbol: stockSymbol,
        },
      },
    });

    if (existingWatchlist) {
      return apiResponse.error(
        '该股票已在自选股中',
        409,
        'STOCK_ALREADY_IN_WATCHLIST'
      );
    }

    // 添加到自选股
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: user.id,
        stockSymbol: stockSymbol,
      },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            market: true,
            industry: true,
            currentPrice: true,
            changePercent: true,
          },
        },
      },
    });

    logger.info('股票添加到自选股成功', {
      userId: user.id,
      stockSymbol: stockSymbol,
      stockName: stock.name,
    });

    return apiResponse.success(
      {
        id: watchlistItem.id,
        stockSymbol: watchlistItem.stockSymbol,
        stock: watchlistItem.stock,
        createdAt: watchlistItem.createdAt,
        updatedAt: watchlistItem.updatedAt,
      },
      '股票已添加到自选股'
    );
  } catch (error) {
    logger.error('添加股票到自选股失败', { error });
    return handleApiError(error, 'AddToWatchlist');
  }
}

// DELETE /api/watchlist - 从自选股中移除股票
export async function DELETE(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getCurrentUser(request);
    if (!user) {
      return apiResponse.error('请先登录', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const stockSymbol = searchParams.get('stockSymbol');

    if (!id && !stockSymbol) {
      return apiResponse.error(
        '请提供 id 或 stockSymbol 参数',
        400,
        'MISSING_PARAMS'
      );
    }

    let whereClause: any;

    if (id) {
      whereClause = {
        id: id,
        userId: user.id,
      };
    } else {
      whereClause = {
        userId_stockSymbol: {
          userId: user.id,
          stockSymbol: stockSymbol!,
        },
      };
    }

    // 检查自选股是否存在
    const watchlistItem = await prisma.watchlist.findFirst({
      where: whereClause,
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
          },
        },
      },
    });

    if (!watchlistItem) {
      return apiResponse.error('自选股记录不存在', 404, 'WATCHLIST_NOT_FOUND');
    }

    // 删除自选股记录（同时会删除相关的提醒规则）
    await prisma.watchlist.delete({
      where: { id: watchlistItem.id },
    });

    logger.info('股票从自选股移除成功', {
      userId: user.id,
      stockSymbol: watchlistItem.stockSymbol,
      stockName: watchlistItem.stock.name,
    });

    return apiResponse.success(
      {
        id: watchlistItem.id,
        stockSymbol: watchlistItem.stockSymbol,
        stock: watchlistItem.stock,
      },
      '股票已从自选股中移除'
    );
  } catch (error) {
    logger.error('从自选股移除股票失败', { error });
    return handleApiError(error, 'RemoveFromWatchlist');
  }
}
