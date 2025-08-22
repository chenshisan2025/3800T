import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import {
  apiResponse,
  handleApiError,
  validateRequest,
  paginationUtils,
} from '@/utils';
import { AiReportQuerySchema, CreateAiReportSchema } from '@/types';
import { createRequestLogger } from '@/lib/logger';
import {
  captureException,
  setRequestContext,
  addBreadcrumb,
} from '@/lib/sentry';

// GET /api/ai/reports - 获取 AI 报告列表
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 设置Sentry请求上下文
    setRequestContext(request, {
      endpoint: '/api/ai/reports',
      method: 'GET',
    });

    addBreadcrumb({
      message: 'AI报告列表查询开始',
      category: 'api.ai.reports',
      level: 'info',
    });

    const { searchParams } = new URL(request.url);

    // 解析查询参数
    const queryResult = AiReportQuerySchema.safeParse({
      stock_code: searchParams.get('stock_code'),
      report_type: searchParams.get('report_type'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    if (!queryResult.success) {
      const errorMessage = queryResult.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      logger.warn('AI报告查询参数验证失败', {
        errors: queryResult.error.errors,
        rawParams: Object.fromEntries(searchParams.entries()),
      });

      return apiResponse.error(
        `查询参数错误: ${errorMessage}`,
        400,
        'INVALID_QUERY_PARAMS'
      );
    }

    const { stock_code, report_type, page, limit } = queryResult.data;
    const { skip, take } = paginationUtils.getPaginationParams(page, limit);

    // 构建查询条件
    const where: any = {};

    if (stock_code) {
      // 查找股票 ID
      const stock = await prisma.stock.findUnique({
        where: { code: stock_code },
        select: { id: true },
      });

      if (!stock) {
        return apiResponse.notFound('股票不存在');
      }

      where.stock_id = stock.id;
    }

    if (report_type) {
      where.report_type = report_type;
    }

    // 查询报告总数
    const total = await prisma.aiReport.count({ where });

    // 查询报告列表
    const reports = await prisma.aiReport.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        stock: {
          select: {
            code: true,
            name: true,
            market: true,
          },
        },
      },
    });

    const pagination = paginationUtils.createPaginationMeta(total, page, limit);

    logger.info('AI报告列表查询成功', {
      query: queryResult.data,
      total,
      returned: reports.length,
      pagination,
    });

    addBreadcrumb({
      message: `AI报告列表查询完成，返回${reports.length}条记录`,
      category: 'api.ai.reports',
      level: 'info',
      data: { total, returned: reports.length },
    });

    return apiResponse.success({
      reports,
      pagination,
    });
  } catch (error) {
    logger.error('获取AI报告列表失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    captureException(error, {
      tags: {
        endpoint: '/api/ai/reports',
        method: 'GET',
        operation: 'GetAiReports',
      },
      extra: {
        url: request.url,
        userAgent: request.headers.get('user-agent'),
      },
    });

    return handleApiError(error, 'GetAiReports');
  }
}

// POST /api/ai/reports - 创建 AI 报告（管理员功能）
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 设置Sentry请求上下文
    setRequestContext(request, {
      endpoint: '/api/ai/reports',
      method: 'POST',
    });

    addBreadcrumb({
      message: 'AI报告创建请求开始',
      category: 'api.ai.reports',
      level: 'info',
    });

    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      logger.warn('AI报告创建失败：用户未登录');
      return apiResponse.unauthorized('请先登录');
    }

    // 这里应该验证管理员权限
    // const isAdminUser = await isAdmin(user.id);
    // if (!isAdminUser) {
    //   return apiResponse.forbidden('需要管理员权限');
    // }

    const body = await request.json();

    // 验证请求数据
    const validationResult = validateRequest(CreateAiReportSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const {
      stock_code,
      report_type,
      title,
      content,
      summary,
      confidence_score,
      tags,
    } = validationResult.data;

    // 查找股票
    const stock = await prisma.stock.findUnique({
      where: { code: stock_code },
      select: { id: true, name: true },
    });

    if (!stock) {
      return apiResponse.notFound('股票不存在');
    }

    // 创建 AI 报告
    const report = await prisma.aiReport.create({
      data: {
        stock_id: stock.id,
        report_type,
        title,
        content,
        summary,
        confidence_score,
        tags: tags || [],
        generated_by: 'admin', // 或者使用具体的 AI 模型名称
      },
      include: {
        stock: {
          select: {
            code: true,
            name: true,
            market: true,
          },
        },
      },
    });

    logger.info('AI报告创建成功', {
      reportId: report.id,
      stockCode: stock_code,
      reportType: report_type,
      userId: user.id,
      stockId: stock.id,
      title,
    });

    addBreadcrumb({
      message: `AI报告创建成功: ${title}`,
      category: 'api.ai.reports',
      level: 'info',
      data: {
        reportId: report.id,
        stockCode: stock_code,
        reportType: report_type,
      },
    });

    return apiResponse.success(report, 'AI 报告创建成功');
  } catch (error) {
    logger.error('创建AI报告失败', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    captureException(error, {
      tags: {
        endpoint: '/api/ai/reports',
        method: 'POST',
        operation: 'CreateAiReport',
      },
      extra: {
        url: request.url,
        userAgent: request.headers.get('user-agent'),
      },
    });

    return handleApiError(error, 'CreateAiReport');
  }
}
