import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { UpdateWatchlistSchema } from '@/types';
import { logInfo, logError } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/watchlist/[id] - 获取单个自选股详情
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }
    
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return apiResponse.error('无效的自选股 ID', 400, 'INVALID_WATCHLIST_ID');
    }
    
    const watchlistId = parseInt(id, 10);
    
    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });
    
    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }
    
    // 查询自选股详情
    const watchlistItem = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        user_id: dbUser.id,
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
            updated_at: true,
          },
        },
      },
    });
    
    if (!watchlistItem) {
      return apiResponse.notFound('自选股不存在');
    }
    
    const response = {
      id: watchlistItem.id,
      stock: watchlistItem.stock,
      added_at: watchlistItem.created_at,
      notes: watchlistItem.notes,
    };
    
    return apiResponse.success(response);
    
  } catch (error) {
    logError('获取自选股详情失败', error);
    return handleApiError(error, 'GetWatchlistItem');
  }
}

// PUT /api/users/watchlist/[id] - 更新自选股备注
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }
    
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return apiResponse.error('无效的自选股 ID', 400, 'INVALID_WATCHLIST_ID');
    }
    
    const watchlistId = parseInt(id, 10);
    
    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });
    
    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }
    
    // 检查自选股是否存在且属于当前用户
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        user_id: dbUser.id,
      },
    });
    
    if (!existingWatchlist) {
      return apiResponse.notFound('自选股不存在');
    }
    
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = validateRequest(UpdateWatchlistSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }
    
    const { notes } = validationResult.data;
    
    // 更新自选股备注
    const updatedWatchlist = await prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        notes,
        updated_at: new Date(),
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
    
    logInfo('自选股备注更新成功', {
      userId: dbUser.id,
      watchlistId,
      stockCode: updatedWatchlist.stock.code,
    });
    
    const response = {
      id: updatedWatchlist.id,
      stock: updatedWatchlist.stock,
      added_at: updatedWatchlist.created_at,
      notes: updatedWatchlist.notes,
    };
    
    return apiResponse.success(response, '自选股备注更新成功');
    
  } catch (error) {
    logError('更新自选股备注失败', error);
    return handleApiError(error, 'UpdateWatchlistItem');
  }
}

// DELETE /api/users/watchlist/[id] - 从自选股中删除股票
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }
    
    const { id } = params;
    
    if (!id || isNaN(Number(id))) {
      return apiResponse.error('无效的自选股 ID', 400, 'INVALID_WATCHLIST_ID');
    }
    
    const watchlistId = parseInt(id, 10);
    
    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });
    
    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }
    
    // 检查自选股是否存在且属于当前用户
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        user_id: dbUser.id,
      },
      include: {
        stock: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });
    
    if (!existingWatchlist) {
      return apiResponse.notFound('自选股不存在');
    }
    
    // 删除自选股
    await prisma.watchlist.delete({
      where: { id: watchlistId },
    });
    
    logInfo('股票从自选股删除成功', {
      userId: dbUser.id,
      watchlistId,
      stockCode: existingWatchlist.stock.code,
      stockName: existingWatchlist.stock.name,
    });
    
    return apiResponse.success(
      {
        id: watchlistId,
        stock: existingWatchlist.stock,
        removed_at: new Date(),
      },
      '股票已从自选股中删除'
    );
    
  } catch (error) {
    logError('删除自选股失败', error);
    return handleApiError(error, 'DeleteWatchlistItem');
  }
}