import { NextRequest, NextResponse } from 'next/server';
import { getScanStats } from '@/lib/alert-engine';
import { createRequestLogger } from '@/lib/logger';

/**
 * GET /api/alerts/stats
 * 获取告警引擎扫描统计数据
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  try {
    logger.info('获取扫描统计数据请求');

    const stats = await getScanStats();

    if (!stats) {
      return NextResponse.json(
        { error: '无法获取扫描统计数据' },
        { status: 500 }
      );
    }

    logger.info('扫描统计数据获取成功', {
      totalScans: stats.totalScans,
      successfulScans: stats.successfulScans,
      failedScans: stats.failedScans,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取扫描统计数据失败', { error: error as Error });
    return NextResponse.json(
      { error: '获取扫描统计数据失败' },
      { status: 500 }
    );
  }
}
