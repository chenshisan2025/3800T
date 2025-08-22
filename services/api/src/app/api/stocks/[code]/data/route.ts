import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, handleApiError, stockUtils, dateUtils } from '@/utils';
import { StockDataQuerySchema } from '@/types';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimiter';

interface RouteParams {
  params: {
    code: string;
  };
}

// GET /api/stocks/[code]/data - 获取股票历史数据
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 应用速率限制
    const rateLimitResult = await rateLimitMiddleware(request, 'stock_data');
    if (!rateLimitResult.success) {
      return apiResponse.error(
        rateLimitResult.message,
        429,
        'RATE_LIMIT_EXCEEDED',
        {
          retryAfter: rateLimitResult.retryAfter,
          remaining: rateLimitResult.remaining,
        }
      );
    }

    const { code } = params;
    const { searchParams } = new URL(request.url);

    // 验证股票代码格式
    if (!stockUtils.isValidStockCode(code)) {
      return apiResponse.error('无效的股票代码格式', 400, 'INVALID_STOCK_CODE');
    }

    const formattedCode = stockUtils.formatStockCode(code);

    // 解析查询参数
    const queryResult = StockDataQuerySchema.safeParse({
      stock_code: formattedCode,
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      limit: searchParams.get('limit'),
    });

    if (!queryResult.success) {
      const errorMessage = queryResult.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return apiResponse.error(
        `查询参数错误: ${errorMessage}`,
        400,
        'INVALID_QUERY_PARAMS'
      );
    }

    const { start_date, end_date, limit } = queryResult.data;

    // 验证日期范围
    if (
      start_date &&
      end_date &&
      !dateUtils.isValidDateRange(start_date, end_date)
    ) {
      return apiResponse.error(
        '开始日期不能晚于结束日期',
        400,
        'INVALID_DATE_RANGE'
      );
    }

    // 检查股票是否存在
    const stock = await prisma.stock.findUnique({
      where: { code: formattedCode },
      select: { id: true, code: true, name: true },
    });

    if (!stock) {
      return apiResponse.notFound('股票不存在');
    }

    // 构建查询条件
    const where: any = {
      stock_id: stock.id,
    };

    if (start_date || end_date) {
      where.date = {};
      if (start_date) {
        where.date.gte = new Date(start_date);
      }
      if (end_date) {
        where.date.lte = new Date(end_date);
      }
    }

    // 查询股票数据
    const stockData = await prisma.stockData.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true,
        date: true,
        open_price: true,
        close_price: true,
        high_price: true,
        low_price: true,
        volume: true,
        turnover: true,
        change_percent: true,
        created_at: true,
      },
    });

    // 计算统计信息
    const stats =
      stockData.length > 0
        ? {
            total_records: stockData.length,
            date_range: {
              start: stockData[stockData.length - 1]?.date,
              end: stockData[0]?.date,
            },
            price_range: {
              highest: Math.max(...stockData.map(d => d.high_price)),
              lowest: Math.min(...stockData.map(d => d.low_price)),
            },
            volume_stats: {
              max: Math.max(...stockData.map(d => d.volume)),
              min: Math.min(...stockData.map(d => d.volume)),
              avg:
                stockData.reduce((sum, d) => sum + d.volume, 0) /
                stockData.length,
            },
          }
        : null;

    const response = {
      stock: {
        code: stock.code,
        name: stock.name,
      },
      data: stockData,
      stats,
      query: {
        start_date,
        end_date,
        limit,
      },
    };

    return apiResponse.success(response);
  } catch (error) {
    return handleApiError(error, 'GetStockData');
  }
}

// POST /api/stocks/[code]/data - 添加股票数据（管理员功能或数据同步服务）
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 这里应该添加管理员权限验证或API密钥验证
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
    const stock = await prisma.stock.findUnique({
      where: { code: formattedCode },
      select: { id: true },
    });

    if (!stock) {
      return apiResponse.notFound('股票不存在');
    }

    const body = await request.json();

    // 验证必需字段
    const requiredFields = [
      'date',
      'open_price',
      'close_price',
      'high_price',
      'low_price',
      'volume',
    ];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return apiResponse.error(
          `缺少必需字段: ${field}`,
          400,
          'MISSING_REQUIRED_FIELD'
        );
      }
    }

    // 验证价格数据的合理性
    const { open_price, close_price, high_price, low_price, volume } = body;

    if (high_price < Math.max(open_price, close_price, low_price)) {
      return apiResponse.error(
        '最高价不能低于开盘价、收盘价或最低价',
        400,
        'INVALID_PRICE_DATA'
      );
    }

    if (low_price > Math.min(open_price, close_price, high_price)) {
      return apiResponse.error(
        '最低价不能高于开盘价、收盘价或最高价',
        400,
        'INVALID_PRICE_DATA'
      );
    }

    if (volume < 0) {
      return apiResponse.error('成交量不能为负数', 400, 'INVALID_VOLUME');
    }

    // 计算涨跌幅
    const change_percent =
      body.change_percent || ((close_price - open_price) / open_price) * 100;

    // 检查是否已存在该日期的数据
    const existingData = await prisma.stockData.findFirst({
      where: {
        stock_id: stock.id,
        date: new Date(body.date),
      },
    });

    if (existingData) {
      // 更新现有数据
      const updatedData = await prisma.stockData.update({
        where: { id: existingData.id },
        data: {
          open_price,
          close_price,
          high_price,
          low_price,
          volume,
          turnover: body.turnover || 0,
          change_percent,
        },
      });

      return apiResponse.success(updatedData, '股票数据更新成功');
    } else {
      // 创建新数据
      const newData = await prisma.stockData.create({
        data: {
          stock_id: stock.id,
          date: new Date(body.date),
          open_price,
          close_price,
          high_price,
          low_price,
          volume,
          turnover: body.turnover || 0,
          change_percent,
        },
      });

      return apiResponse.success(newData, '股票数据添加成功');
    }
  } catch (error) {
    return handleApiError(error, 'AddStockData');
  }
}
