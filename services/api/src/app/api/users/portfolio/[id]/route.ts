import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { UpdatePortfolioSchema } from '@/types';
import { createRequestLogger } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/portfolio/[id] - 获取单个投资组合详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error(
        '无效的投资组合 ID',
        400,
        'INVALID_PORTFOLIO_ID'
      );
    }

    const portfolioId = parseInt(id, 10);

    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });

    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }

    // 查询投资组合详情
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        user_id: dbUser.id,
      },
      include: {
        items: {
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
        },
        _count: {
          select: { items: true },
        },
      },
    });

    if (!portfolio) {
      return apiResponse.notFound('投资组合不存在');
    }

    // 计算投资组合统计信息
    const totalValue = portfolio.items.reduce((sum, item) => {
      const currentValue = item.quantity * (item.stock.current_price || 0);
      return sum + currentValue;
    }, 0);

    const totalCost = portfolio.items.reduce((sum, item) => {
      return sum + item.quantity * item.average_cost;
    }, 0);

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent =
      totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // 格式化持仓项目
    const formattedItems = portfolio.items.map(item => {
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
        cost_value: cost,
        gain_loss: gainLoss,
        gain_loss_percent: gainLossPercent,
        added_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    const response = {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      created_at: portfolio.created_at,
      updated_at: portfolio.updated_at,
      items_count: portfolio._count.items,
      stats: {
        total_value: totalValue,
        total_cost: totalCost,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percent: totalGainLossPercent,
      },
      items: formattedItems,
    };

    return apiResponse.success(response);
  } catch (error) {
    logger.error('获取投资组合详情失败', { error });
    return handleApiError(error, 'GetPortfolioDetail');
  }
}

// PUT /api/users/portfolio/[id] - 更新投资组合信息
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error(
        '无效的投资组合 ID',
        400,
        'INVALID_PORTFOLIO_ID'
      );
    }

    const portfolioId = parseInt(id, 10);

    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });

    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }

    // 检查投资组合是否存在且属于当前用户
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        user_id: dbUser.id,
      },
    });

    if (!existingPortfolio) {
      return apiResponse.notFound('投资组合不存在');
    }

    const body = await request.json();

    // 验证请求数据
    const validationResult = validateRequest(UpdatePortfolioSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { name, description } = validationResult.data;

    // 如果更新名称，检查是否与其他投资组合重名
    if (name && name !== existingPortfolio.name) {
      const duplicatePortfolio = await prisma.portfolio.findFirst({
        where: {
          user_id: dbUser.id,
          name,
          id: { not: portfolioId },
        },
      });

      if (duplicatePortfolio) {
        return apiResponse.error(
          '投资组合名称已存在',
          409,
          'PORTFOLIO_NAME_EXISTS'
        );
      }
    }

    // 更新投资组合
    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        name: name || existingPortfolio.name,
        description:
          description !== undefined
            ? description
            : existingPortfolio.description,
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    logger.info('投资组合更新成功', {
      userId: dbUser.id,
      portfolioId,
      portfolioName: updatedPortfolio.name,
    });

    const response = {
      id: updatedPortfolio.id,
      name: updatedPortfolio.name,
      description: updatedPortfolio.description,
      created_at: updatedPortfolio.created_at,
      updated_at: updatedPortfolio.updated_at,
      items_count: updatedPortfolio._count.items,
    };

    return apiResponse.success(response, '投资组合更新成功');
  } catch (error) {
    logger.error('更新投资组合失败', { error });
    return handleApiError(error, 'UpdatePortfolio');
  }
}

// DELETE /api/users/portfolio/[id] - 删除投资组合
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error(
        '无效的投资组合 ID',
        400,
        'INVALID_PORTFOLIO_ID'
      );
    }

    const portfolioId = parseInt(id, 10);

    // 查找用户记录
    const dbUser = await prisma.user.findUnique({
      where: { supabase_id: user.id },
    });

    if (!dbUser) {
      return apiResponse.notFound('用户不存在');
    }

    // 检查投资组合是否存在且属于当前用户
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        user_id: dbUser.id,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existingPortfolio) {
      return apiResponse.notFound('投资组合不存在');
    }

    // 删除投资组合（级联删除相关的持仓项目）
    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    logger.info('投资组合删除成功', {
      userId: dbUser.id,
      portfolioId,
      portfolioName: existingPortfolio.name,
      itemsCount: existingPortfolio._count.items,
    });

    return apiResponse.success(
      {
        id: portfolioId,
        name: existingPortfolio.name,
        items_count: existingPortfolio._count.items,
        deleted_at: new Date(),
      },
      '投资组合删除成功'
    );
  } catch (error) {
    logger.error('删除投资组合失败', { error });
    return handleApiError(error, 'DeletePortfolio');
  }
}
