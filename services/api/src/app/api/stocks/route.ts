import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, paginationUtils, handleApiError } from '@/utils';
import { StockQuerySchema } from '@/types';
import { logError } from '@/lib/logger';
import { rateLimitMiddleware } from '@/lib/middleware/rateLimiter';
import { recordError, ErrorType, ErrorSeverity } from '@/lib/errorMonitor';
import { MockDataService } from '@/lib/mockData';
import { getDatabaseBreaker, getRateLimitBreaker } from '@/lib/circuitBreaker';

// GET /api/stocks - 获取股票列表
export async function GET(request: NextRequest) {
  let useMockData = false;
  let degradationNotice = '';
  
  try {
    // 应用速率限制（使用熔断器保护）
    const rateLimitBreaker = getRateLimitBreaker();
    const rateLimitResult = await rateLimitBreaker.execute(async () => {
      const result = await rateLimitMiddleware(request, 'stock_list');
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    }).catch(error => {
      recordError(
        'Rate limit exceeded for stock list API',
        ErrorType.RATE_LIMIT_ERROR,
        ErrorSeverity.MEDIUM,
        'StockListAPI',
        { endpoint: 'GET /api/stocks', error: error.message }
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
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const queryResult = StockQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      market: searchParams.get('market'),
      industry: searchParams.get('industry'),
    });
    
    if (!queryResult.success) {
      const errorMessage = queryResult.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return apiResponse.error(`查询参数错误: ${errorMessage}`, 400, 'INVALID_QUERY_PARAMS');
    }
    
    const { page, limit, search, market, industry } = queryResult.data;
    const { skip, take } = paginationUtils.getSkipTake(page, limit);
    
    // 构建查询条件
    const where: any = {};
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (market) {
      where.market = market;
    }
    
    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }
    
    let stocks, total;
    
    // 使用数据库熔断器保护数据库查询
    const databaseBreaker = getDatabaseBreaker();
    
    try {
      const result = await databaseBreaker.execute(async () => {
        // 尝试从数据库查询股票列表和总数
        const [stocksData, totalCount] = await Promise.all([
          prisma.stock.findMany({
            where,
            skip,
            take,
            orderBy: [
              { code: 'asc' },
            ],
            select: {
              id: true,
              code: true,
              name: true,
              market: true,
              industry: true,
              sector: true,
              created_at: true,
              updated_at: true,
              // 包含最新的股票数据
              stock_data: {
                orderBy: { date: 'desc' },
                take: 1,
                select: {
                  date: true,
                  close_price: true,
                  change_percent: true,
                  volume: true,
                },
              },
            },
          }),
          prisma.stock.count({ where }),
        ]);
        
        return { stocks: stocksData, total: totalCount };
      });
      
      stocks = result.stocks;
      total = result.total;
      
    } catch (dbError) {
      // 记录数据库错误
      recordError(
        dbError instanceof Error ? dbError : 'Database query failed or circuit breaker open',
        ErrorType.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        'StockListAPI',
        { 
          query: 'stock_list', 
          where, 
          skip, 
          take,
          circuitBreakerState: databaseBreaker.getState(),
          isCircuitBreakerError: dbError instanceof Error && dbError.message.includes('Circuit breaker')
        }
      );
      
      // 启用Mock数据降级
      useMockData = true;
      const isCircuitBreakerOpen = dbError instanceof Error && dbError.message.includes('Circuit breaker');
      degradationNotice = isCircuitBreakerOpen 
        ? '数据库服务暂时不可用（熔断保护），已切换至备用数据源。'
        : MockDataService.getDegradationNotice();
      
      const mockResult = MockDataService.getMockStocks({
        page,
        limit,
        search,
        market,
        industry,
      });
      
      stocks = mockResult.data;
      total = mockResult.pagination.total;
    }
    
    // 格式化返回数据
    const formattedStocks = useMockData 
      ? stocks // Mock数据已经格式化
      : stocks.map((stock) => ({
          id: stock.id,
          code: stock.code,
          name: stock.name,
          market: stock.market,
          industry: stock.industry,
          sector: stock.sector,
          created_at: stock.created_at,
          updated_at: stock.updated_at,
          latest_data: stock.stock_data[0] || null,
        }));
    
    const paginatedResponse = useMockData
      ? {
          data: formattedStocks,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            has_next: (page * limit) < total,
            has_prev: page > 1,
          },
        }
      : paginationUtils.createPaginationResponse(
          formattedStocks,
          total,
          page,
          limit
        );
    
    // 添加降级提示
    if (useMockData) {
      paginatedResponse.degradation_notice = degradationNotice;
    }
    
    return apiResponse.success(paginatedResponse);
    
  } catch (error) {
    // 记录API级别的错误
    recordError(
      error instanceof Error ? error : 'Unknown error in stock list API',
      ErrorType.API_ERROR,
      ErrorSeverity.HIGH,
      'StockListAPI'
    );
    
    return handleApiError(error, 'GetStocks');
  }
}

// POST /api/stocks - 创建股票（管理员功能）
export async function POST(request: NextRequest) {
  try {
    // 这里应该添加管理员权限验证
    // const user = await getUser(request);
    // if (!user || !await isAdmin(user.id)) {
    //   return apiResponse.forbidden('需要管理员权限');
    // }
    
    const body = await request.json();
    
    // 验证股票代码格式
    if (!body.code || !/^[0-9]{6}$/.test(body.code)) {
      return apiResponse.error('股票代码必须为6位数字', 400, 'INVALID_STOCK_CODE');
    }
    
    // 检查股票是否已存在
    const existingStock = await prisma.stock.findUnique({
      where: { code: body.code },
    });
    
    if (existingStock) {
      return apiResponse.error('股票代码已存在', 409, 'STOCK_ALREADY_EXISTS');
    }
    
    // 创建股票
    const stock = await prisma.stock.create({
      data: {
        code: body.code,
        name: body.name,
        market: body.market || 'SH',
        industry: body.industry,
        sector: body.sector,
      },
    });
    
    return apiResponse.success(stock, '股票创建成功');
    
  } catch (error) {
    return handleApiError(error, 'CreateStock');
  }
}