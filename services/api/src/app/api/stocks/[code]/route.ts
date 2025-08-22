import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, handleApiError, stockUtils } from '@/utils';
import { createRequestLogger } from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimiter';
import { recordError, ErrorType, ErrorSeverity } from '@/lib/errorMonitor';
import { aiService, AIAnalysisType } from '@/lib/aiService';
import { MockDataService } from '@/lib/mockData';
import {
  getDatabaseBreaker,
  getAIServiceBreaker,
  getRateLimitBreaker,
} from '@/lib/circuitBreaker';

interface RouteParams {
  params: {
    code: string;
  };
}

// GET /api/stocks/[code] - 获取股票详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 应用速率限制（使用熔断器保护）
    const rateLimitBreaker = getRateLimitBreaker();
    const rateLimitResult = await rateLimitBreaker
      .execute(async () => {
        const result = await rateLimitMiddleware(request, 'stock_detail');
        if (!result.success) {
          throw new Error(result.message);
        }
        return result;
      })
      .catch(error => {
        recordError(
          'Rate limit exceeded for stock detail API',
          ErrorType.RATE_LIMIT_ERROR,
          ErrorSeverity.LOW,
          'StockDetailAPI',
          { code: params.code, error: error.message }
        );
        return { success: false, message: error.message };
      });

    if (!rateLimitResult.success) {
      return apiResponse.error(
        rateLimitResult.message,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    const { code } = params;

    // 验证股票代码格式
    if (!stockUtils.isValidStockCode(code)) {
      return apiResponse.error('无效的股票代码格式', 400, 'INVALID_STOCK_CODE');
    }

    const formattedCode = stockUtils.formatStockCode(code);

    let stock;
    let degradationNotice = null;
    let aiReports = [];

    // 使用数据库熔断器保护数据库查询
    const databaseBreaker = getDatabaseBreaker();
    const aiServiceBreaker = getAIServiceBreaker();

    try {
      // 查询股票信息
      stock = await databaseBreaker.execute(async () => {
        const stockData = await prisma.stock.findUnique({
          where: { code: formattedCode },
          include: {
            stock_data: {
              orderBy: { date: 'desc' },
              take: 30, // 最近30天的数据
            },
            ai_reports: {
              orderBy: { created_at: 'desc' },
              take: 5, // 最近5份AI报告
              select: {
                id: true,
                title: true,
                analysis_type: true,
                confidence_score: true,
                created_at: true,
              },
            },
            _count: {
              select: {
                watchlist: true, // 被多少用户关注
                portfolio_items: true, // 被多少投资组合包含
              },
            },
          },
        });

        if (!stockData) {
          throw new Error('股票不存在');
        }

        return stockData;
      });

      // 使用AI服务熔断器保护AI分析调用
      try {
        aiReports = await aiServiceBreaker.execute(async () => {
          const analysisTypes = [
            AIAnalysisType.TECHNICAL,
            AIAnalysisType.FUNDAMENTAL,
            AIAnalysisType.SENTIMENT,
            AIAnalysisType.RISK,
            AIAnalysisType.RECOMMENDATION,
          ];

          return await aiService.generateBatchAnalysis(
            formattedCode,
            analysisTypes,
            { stock_data: stock.stock_data, stock }
          );
        });

        // 检查是否有简版结果或超时提示
        const hasSimplified = aiReports.some(report => report.is_simplified);
        const timeoutNotices = aiReports
          .filter(report => report.timeout_notice)
          .map(report => report.timeout_notice);

        if (hasSimplified || timeoutNotices.length > 0) {
          degradationNotice =
            timeoutNotices.length > 0
              ? timeoutNotices[0]
              : 'AI分析服务部分功能降级，已提供简化版分析结果。';
        }
      } catch (aiError) {
        const isCircuitBreakerOpen =
          aiError instanceof Error &&
          aiError.message.includes('Circuit breaker');

        recordError(
          aiError instanceof Error
            ? aiError
            : 'AI analysis failed or circuit breaker open',
          ErrorType.AI_SERVICE_ERROR,
          ErrorSeverity.MEDIUM,
          'StockDetailAPI.AIAnalysis',
          {
            code: formattedCode,
            circuitBreakerState: aiServiceBreaker.getState(),
            isCircuitBreakerError: isCircuitBreakerOpen,
          }
        );

        // AI服务失败或熔断器打开时，使用数据库中的历史报告
        aiReports = stock.ai_reports || [];
        degradationNotice = isCircuitBreakerOpen
          ? 'AI分析服务暂时不可用（熔断保护），显示历史分析报告。'
          : 'AI分析服务暂时不可用，显示历史分析报告。';
      }
    } catch (dbError) {
      const isCircuitBreakerOpen =
        dbError instanceof Error && dbError.message.includes('Circuit breaker');
      const isNotFound =
        dbError instanceof Error && dbError.message === '股票不存在';

      if (isNotFound && !isCircuitBreakerOpen) {
        return apiResponse.notFound('股票不存在');
      }

      recordError(
        dbError instanceof Error
          ? dbError
          : 'Database query failed or circuit breaker open',
        ErrorType.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        'StockDetailAPI.Database',
        {
          code: formattedCode,
          circuitBreakerState: databaseBreaker.getState(),
          isCircuitBreakerError: isCircuitBreakerOpen,
        }
      );

      // 数据库查询失败或熔断器打开，使用Mock数据
      const mockService = new MockDataService();
      const mockStock = await mockService.getMockStockDetail(formattedCode);

      if (!mockStock) {
        return apiResponse.notFound('股票不存在');
      }

      degradationNotice = isCircuitBreakerOpen
        ? '数据库服务暂时不可用（熔断保护），已切换至备用数据源。'
        : mockService.getDegradationNotice();

      const result = {
        ...mockStock,
        degradation_notice: degradationNotice,
      };

      return apiResponse.success(result, '获取股票详情成功（降级模式）');
    }

    // 计算技术指标
    const stockData = stock.stock_data;
    let technicalIndicators = null;

    if (stockData.length > 0) {
      const latest = stockData[0];
      const previous = stockData[1];

      // 计算简单的技术指标
      const prices = stockData.map(d => d.close_price);
      const volumes = stockData.map(d => d.volume);

      technicalIndicators = {
        current_price: latest.close_price,
        change_amount: previous ? latest.close_price - previous.close_price : 0,
        change_percent: latest.change_percent,
        volume: latest.volume,
        avg_volume_5d:
          volumes.slice(0, 5).reduce((a, b) => a + b, 0) /
          Math.min(5, volumes.length),
        avg_price_5d:
          prices.slice(0, 5).reduce((a, b) => a + b, 0) /
          Math.min(5, prices.length),
        avg_price_20d:
          prices.slice(0, 20).reduce((a, b) => a + b, 0) /
          Math.min(20, prices.length),
        high_52w: Math.max(...stockData.map(d => d.high_price)),
        low_52w: Math.min(...stockData.map(d => d.low_price)),
      };
    }

    // 格式化返回数据
    const response = {
      id: stock.id,
      code: stock.code,
      name: stock.name,
      market: stock.market,
      industry: stock.industry,
      sector: stock.sector,
      created_at: stock.created_at,
      updated_at: stock.updated_at,
      technical_indicators: technicalIndicators,
      recent_data: stockData.slice(0, 10), // 最近10天数据
      ai_reports: aiReports.length > 0 ? aiReports : stock.ai_reports,
      stats: {
        followers_count: stock._count.watchlist,
        portfolio_count: stock._count.portfolio_items,
      },
      degradation_notice: degradationNotice,
    };

    return apiResponse.success(response);
  } catch (error) {
    recordError(
      error instanceof Error ? error : 'Stock detail API failed',
      ErrorType.API_ERROR,
      ErrorSeverity.HIGH,
      'StockDetailAPI',
      { code: params.code }
    );
    return handleApiError(error, 'GetStockDetail');
  }
}

// PUT /api/stocks/[code] - 更新股票信息（管理员功能）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 这里应该添加管理员权限验证
    // const user = await getUser(request);
    // if (!user || !await isAdmin(user.id)) {
    //   return apiResponse.forbidden('需要管理员权限');
    // }

    const { code } = params;

    if (!stockUtils.isValidStockCode(code)) {
      return apiResponse.error('无效的股票代码格式', 400, 'INVALID_STOCK_CODE');
    }

    const formattedCode = stockUtils.formatStockCode(code);
    const body = await request.json();

    // 检查股票是否存在
    const existingStock = await prisma.stock.findUnique({
      where: { code: formattedCode },
    });

    if (!existingStock) {
      return apiResponse.notFound('股票不存在');
    }

    // 更新股票信息
    const updatedStock = await prisma.stock.update({
      where: { code: formattedCode },
      data: {
        name: body.name || existingStock.name,
        market: body.market || existingStock.market,
        industry: body.industry || existingStock.industry,
        sector: body.sector || existingStock.sector,
        updated_at: new Date(),
      },
    });

    return apiResponse.success(updatedStock, '股票信息更新成功');
  } catch (error) {
    return handleApiError(error, 'UpdateStock');
  }
}

// DELETE /api/stocks/[code] - 删除股票（管理员功能）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 这里应该添加管理员权限验证
    // const user = await getUser(request);
    // if (!user || !await isAdmin(user.id)) {
    //   return apiResponse.forbidden('需要管理员权限');
    // }

    const { code } = params;

    if (!stockUtils.isValidStockCode(code)) {
      return apiResponse.error('无效的股票代码格式', 400, 'INVALID_STOCK_CODE');
    }

    const formattedCode = stockUtils.formatStockCode(code);

    // 检查股票是否存在
    const existingStock = await prisma.stock.findUnique({
      where: { code: formattedCode },
    });

    if (!existingStock) {
      return apiResponse.notFound('股票不存在');
    }

    // 删除股票（注意：这会级联删除相关数据）
    await prisma.stock.delete({
      where: { code: formattedCode },
    });

    return apiResponse.success(null, '股票删除成功');
  } catch (error) {
    return handleApiError(error, 'DeleteStock');
  }
}
