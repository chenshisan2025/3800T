import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/supabase';
import { apiResponse, handleApiError, validateRequest } from '@/utils';
import { UpdateAiReportSchema } from '@/types';
import { createRequestLogger } from '@/lib/logger';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/ai/reports/[id] - 获取单个 AI 报告详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    const { id } = params;

    // 验证 ID 格式
    if (!id || isNaN(Number(id))) {
      return apiResponse.error('无效的报告 ID', 400, 'INVALID_REPORT_ID');
    }

    const reportId = parseInt(id, 10);

    // 查询报告详情
    const report = await prisma.aiReport.findUnique({
      where: { id: reportId },
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

    if (!report) {
      return apiResponse.notFound('AI 报告不存在');
    }

    // 记录访问日志
    logger.info('AI报告详情查询', {
      reportId,
      stockCode: report.stock.code,
      reportType: report.report_type,
    });

    return apiResponse.success(report);
  } catch (error) {
    logger.error('获取AI报告详情失败', { error });
    return handleApiError(error, 'GetAiReportDetail');
  }
}

// PUT /api/ai/reports/[id] - 更新 AI 报告（管理员功能）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    // 这里应该验证管理员权限
    // const isAdminUser = await isAdmin(user.id);
    // if (!isAdminUser) {
    //   return apiResponse.forbidden('需要管理员权限');
    // }

    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error('无效的报告 ID', 400, 'INVALID_REPORT_ID');
    }

    const reportId = parseInt(id, 10);

    // 检查报告是否存在
    const existingReport = await prisma.aiReport.findUnique({
      where: { id: reportId },
      select: { id: true, stock_id: true },
    });

    if (!existingReport) {
      return apiResponse.notFound('AI 报告不存在');
    }

    const body = await request.json();

    // 验证请求数据
    const validationResult = validateRequest(UpdateAiReportSchema, body);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const updateData = validationResult.data;

    // 更新报告
    const updatedReport = await prisma.aiReport.update({
      where: { id: reportId },
      data: {
        ...updateData,
        updated_at: new Date(),
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

    logger.info('AI报告更新成功', {
      reportId,
      userId: user.id,
      updatedFields: Object.keys(updateData),
    });

    return apiResponse.success(updatedReport, 'AI 报告更新成功');
  } catch (error) {
    logger.error('更新AI报告失败', { error });
    return handleApiError(error, 'UpdateAiReport');
  }
}

// DELETE /api/ai/reports/[id] - 删除 AI 报告（管理员功能）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    const user = await getUser(request);
    if (!user) {
      return apiResponse.unauthorized('请先登录');
    }

    // 这里应该验证管理员权限
    // const isAdminUser = await isAdmin(user.id);
    // if (!isAdminUser) {
    //   return apiResponse.forbidden('需要管理员权限');
    // }

    const { id } = params;

    if (!id || isNaN(Number(id))) {
      return apiResponse.error('无效的报告 ID', 400, 'INVALID_REPORT_ID');
    }

    const reportId = parseInt(id, 10);

    // 检查报告是否存在
    const existingReport = await prisma.aiReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        title: true,
        stock: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!existingReport) {
      return apiResponse.notFound('AI 报告不存在');
    }

    // 删除报告
    await prisma.aiReport.delete({
      where: { id: reportId },
    });

    logger.info('AI报告删除成功', {
      reportId,
      reportTitle: existingReport.title,
      stockCode: existingReport.stock.code,
      userId: user.id,
    });

    return apiResponse.success(
      {
        id: reportId,
        title: existingReport.title,
        stock: existingReport.stock,
      },
      'AI 报告删除成功'
    );
  } catch (error) {
    logger.error('删除AI报告失败', { error });
    return handleApiError(error, 'DeleteAiReport');
  }
}
