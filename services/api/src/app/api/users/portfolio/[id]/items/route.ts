import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest, stockUtils } from '@/utils';
import { AddPortfolioItemSchema } from '@/types';
import { logInfo, logError } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/portfolio/[id]/items - 获取投资组合持仓项目列表
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
      return apiResponse.error('无效的投资组合 ID', 400, 'INVALID_PORTFOLIO_ID');
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
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        user_id: dbUser.id,
      },
      select: {
        id: true,
        name: true,
      },
    });
    
    if (!portfolio) {
      return apiResponse.notFound('投资组合不存在');
    }
    
    // 获取持仓项目列表
    const items = await prisma.portfolioItem.findMany({
      where: { portfolio_id: portfolioId },
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
    
    // 计算每个持仓项目的统计信息
    const formattedItems = items.map((item) => {
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
    
    // 计算总体统计信息
    const totalValue = formattedItems.reduce((sum, item) => sum + item.current_value, 0);
    const totalCost = formattedItems.reduce((sum, item) => sum + item.cost_value, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    
    const response = {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
      },
      items: formattedItems,
      stats: {
        total_items: items.length,
        total_value: totalValue,
        total_cost: totalCost,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percent: totalGainLossPercent,
      },
    };
    
    return apiResponse.success(response);
    
  } catch (error) {
    logError('获取投资组合持仓项目失败', error);
    return handleApiError(error, 'GetPortfolioItems');
  }
}

// POST /api/users/portfolio/[id]/items - 添加持仓项目到投资组合
export async function POST(
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
      return apiResponse.error('无效的投资组合 ID', 400, 'INVALID_PORTFOLIO_ID');
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
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        user_id: dbUser.id,
      },
    });
    
    if (!portfolio) {
      return apiResponse.notFound('投资组合不存在');
    }
    
    const body = await request.json();
    
    // 验证请求数据
    const validationResult = validateRequest(AddPortfolioItemSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }
    
    const { stock_code, quantity, average_cost } = validationResult.data;
    
    // 验证股票代码格式
    if (!stockUtils.isValidStockCode(stock_code)) {
      return apiResponse.error('无效的股票代码格式', 400, 'INVALID_STOCK_CODE');
    }
    
    const formattedCode = stockUtils.formatStockCode(stock_code);
    
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
    
    // 验证数量和成本
    if (quantity <= 0) {
      return apiResponse.error('持仓数量必须大于 0', 400, 'INVALID_QUANTITY');
    }
    
    if (average_cost <= 0) {
      return apiResponse.error('平均成本必须大于 0', 400, 'INVALID_AVERAGE_COST');
    }
    
    // 检查是否已经持有该股票
    const existingItem = await prisma.portfolioItem.findFirst({
      where: {
        portfolio_id: portfolioId,
        stock_id: stock.id,
      },
    });
    
    if (existingItem) {
      // 如果已存在，更新持仓数量和平均成本
      const newTotalQuantity = existingItem.quantity + quantity;
      const newTotalCost = (existingItem.quantity * existingItem.average_cost) + (quantity * average_cost);
      const newAverageCost = newTotalCost / newTotalQuantity;
      
      const updatedItem = await prisma.portfolioItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newTotalQuantity,
          average_cost: newAverageCost,
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
      
      // 更新投资组合的更新时间
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { updated_at: new Date() },
      });
      
      const currentValue = updatedItem.quantity * (updatedItem.stock.current_price || 0);
      const cost = updatedItem.quantity * updatedItem.average_cost;
      const gainLoss = currentValue - cost;
      const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
      
      logInfo('投资组合持仓更新成功', {
        userId: dbUser.id,
        portfolioId,
        stockCode: formattedCode,
        oldQuantity: existingItem.quantity,
        newQuantity: updatedItem.quantity,
        addedQuantity: quantity,
      });
      
      const response = {
        id: updatedItem.id,
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
      
      return apiResponse.success(response, '持仓数量更新成功');
    } else {
      // 创建新的持仓项目
      const portfolioItem = await prisma.portfolioItem.create({
        data: {
          portfolio_id: portfolioId,
          stock_id: stock.id,
          quantity,
          average_cost,
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
      
      // 更新投资组合的更新时间
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { updated_at: new Date() },
      });
      
      const currentValue = portfolioItem.quantity * (portfolioItem.stock.current_price || 0);
      const cost = portfolioItem.quantity * portfolioItem.average_cost;
      const gainLoss = currentValue - cost;
      const gainLossPercent = cost > 0 ? (gainLoss / cost) * 100 : 0;
      
      logInfo('投资组合持仓添加成功', {
        userId: dbUser.id,
        portfolioId,
        stockCode: formattedCode,
        quantity,
        averageCost: average_cost,
      });
      
      const response = {
        id: portfolioItem.id,
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
      
      return apiResponse.success(response, '持仓项目添加成功');
    }
    
  } catch (error) {
    logError('添加投资组合持仓项目失败', error);
    return handleApiError(error, 'AddPortfolioItem');
  }
}