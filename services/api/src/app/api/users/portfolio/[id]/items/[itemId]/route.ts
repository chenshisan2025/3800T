import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { UpdatePortfolioItemSchema } from '@/types';
import { createRequestLogger } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
    itemId: string;
  };
}

// GET /api/users/portfolio/[id]/items/[itemId] - 获取单个持仓项目详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    const { id, itemId } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error(
        '无效的投资组合 ID',
        400,
        'INVALID_PORTFOLIO_ID'
      );
    }

    if (!itemId || isNaN(Number(itemId))) {
      return apiResponse.error('无效的持仓项目 ID', 400, 'INVALID_ITEM_ID');
    }

    const portfolioId = parseInt(id, 10);
    const portfolioItemId = parseInt(itemId, 10);

    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });

    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }

    // 查询持仓项目详情（包含投资组合所有权验证）
    const portfolioItem = await prisma.portfolioItem.findFirst({
      where: {
        id: portfolioItemId,
        portfolio_id: portfolioId,
        portfolio: {
          user_id: dbUser.id,
        },
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
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!portfolioItem) {
      return apiResponse.notFound('持仓项目不存在');
    }

    // 计算持仓统计信息
    const currentValue =
      portfolioItem.quantity * (portfolioItem.stock.current_price || 0);
    const cost = portfolioItem.quantity * portfolioItem.average_cost;
    const gainLoss = currentValue - cost;
    const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

    const response = {
      id: portfolioItem.id,
      portfolio: portfolioItem.portfolio,
      stock: portfolioItem.stock,
      quantity: portfolioItem.quantity,
      average_cost: portfolioItem.average_cost,
      current_value: currentValue,
      cost_value: cost,
      gain_loss: gainLoss,
      gain_loss_percent: gainLossPercent,
      added_at: portfolioItem.created_at,
      updated_at: portfolioItem.updated_at,
    };

    return apiResponse.success(response);
  } catch (error) {
    logger.error('获取持仓项目详情失败', { error });
    return handleApiError(error, 'GetPortfolioItemDetail');
  }
}

// PUT /api/users/portfolio/[id]/items/[itemId] - 更新持仓项目
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    const { id, itemId } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error(
        '无效的投资组合 ID',
        400,
        'INVALID_PORTFOLIO_ID'
      );
    }

    if (!itemId || isNaN(Number(itemId))) {
      return apiResponse.error('无效的持仓项目 ID', 400, 'INVALID_ITEM_ID');
    }

    const portfolioId = parseInt(id, 10);
    const portfolioItemId = parseInt(itemId, 10);

    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });

    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }

    // 检查持仓项目是否存在且属于当前用户
    const existingItem = await prisma.portfolioItem.findFirst({
      where: {
        id: portfolioItemId,
        portfolio_id: portfolioId,
        portfolio: {
          user_id: dbUser.id,
        },
      },
    });

    if (!existingItem) {
      return apiResponse.notFound('持仓项目不存在');
    }

    const body = await request.json();

    // 验证请求数据
    const validationResult = validateRequest(UpdatePortfolioItemSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { quantity, average_cost } = validationResult.data;

    // 验证数量和成本
    if (quantity !== undefined && quantity <= 0) {
      return apiResponse.error('持仓数量必须大于 0', 400, 'INVALID_QUANTITY');
    }

    if (average_cost !== undefined && average_cost <= 0) {
      return apiResponse.error(
        '平均成本必须大于 0',
        400,
        'INVALID_AVERAGE_COST'
      );
    }

    // 更新持仓项目
    const updatedItem = await prisma.portfolioItem.update({
      where: { id: portfolioItemId },
      data: {
        quantity: quantity !== undefined ? quantity : existingItem.quantity,
        average_cost:
          average_cost !== undefined ? average_cost : existingItem.average_cost,
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
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 更新投资组合的更新时间
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { updated_at: new Date() },
    });

    // 计算更新后的统计信息
    const currentValue =
      updatedItem.quantity * (updatedItem.stock.current_price || 0);
    const cost = updatedItem.quantity * updatedItem.average_cost;
    const gainLoss = currentValue - cost;
    const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;

    logger.info('持仓项目更新成功', {
      userId: dbUser.id,
      portfolioId,
      itemId: portfolioItemId,
      stockCode: updatedItem.stock.code,
      oldQuantity: existingItem.quantity,
      newQuantity: updatedItem.quantity,
      oldAverageCost: existingItem.average_cost,
      newAverageCost: updatedItem.average_cost,
    });

    const response = {
      id: updatedItem.id,
      portfolio: updatedItem.portfolio,
      stock: updatedItem.stock,
      quantity: updatedItem.quantity,
      average_cost: updatedItem.average_cost,
      current_value: currentValue,
      cost_value: cost,
      gain_loss: gainLoss,
      gain_loss_percent: gainLossPercent,
      added_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at,
    };

    return apiResponse.success(response, '持仓项目更新成功');
  } catch (error) {
    logger.error('更新持仓项目失败', { error });
    return handleApiError(error, 'UpdatePortfolioItem');
  }
}

// DELETE /api/users/portfolio/[id]/items/[itemId] - 删除持仓项目
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);
  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    const { id, itemId } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error(
        '无效的投资组合 ID',
        400,
        'INVALID_PORTFOLIO_ID'
      );
    }

    if (!itemId || isNaN(Number(itemId))) {
      return apiResponse.error('无效的持仓项目 ID', 400, 'INVALID_ITEM_ID');
    }

    const portfolioId = parseInt(id, 10);
    const portfolioItemId = parseInt(itemId, 10);

    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });

    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }

    // 检查持仓项目是否存在且属于当前用户
    const existingItem = await prisma.portfolioItem.findFirst({
      where: {
        id: portfolioItemId,
        portfolio_id: portfolioId,
        portfolio: {
          user_id: dbUser.id,
        },
      },
      include: {
        stock: {
          select: {
            code: true,
            name: true,
          },
        },
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingItem) {
      return apiResponse.notFound('持仓项目不存在');
    }

    // 删除持仓项目
    await prisma.portfolioItem.delete({
      where: { id: portfolioItemId },
    });

    // 更新投资组合的更新时间
    await prisma.portfolio.update({
      where: { id: portfolioId },
      data: { updated_at: new Date() },
    });

    logger.info('持仓项目删除成功', {
      userId: dbUser.id,
      portfolioId,
      itemId: portfolioItemId,
      stockCode: existingItem.stock.code,
      stockName: existingItem.stock.name,
      quantity: existingItem.quantity,
    });

    return apiResponse.success(
      {
        id: portfolioItemId,
        portfolio: existingItem.portfolio,
        stock: existingItem.stock,
        quantity: existingItem.quantity,
        average_cost: existingItem.average_cost,
        deleted_at: new Date(),
      },
      '持仓项目删除成功'
    );
  } catch (error) {
    logger.error('删除持仓项目失败', { error });
    return handleApiError(error, 'DeletePortfolioItem');
  }
}
