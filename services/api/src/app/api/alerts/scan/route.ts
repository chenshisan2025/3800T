import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { triggerManualScan, getAlertEngineStatus } from '@/lib/alert-engine';
import { createRequestLogger } from '@/lib/logger';

/**
 * POST /api/alerts/scan
 * 手动触发警报扫描
 */
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份（可选：只允许管理员触发）
    // 临时跳过认证用于测试
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: '未授权访问', code: 'UNAUTHORIZED' },
    //     { status: 401 }
    //   );
    // }

    const userId = 'test-user-123'; // 临时测试用户ID

    // 可选：检查用户权限（如果需要限制只有管理员可以手动触发）
    // const isAdmin = await checkUserIsAdmin(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: '权限不足', code: 'INSUFFICIENT_PERMISSIONS' },
    //     { status: 403 }
    //   );
    // }

    logger.info('收到手动触发扫描请求', {
      userId,
      timestamp: new Date().toISOString(),
    });

    // 检查当前扫描状态
    const engineStatus = getAlertEngineStatus();
    if (engineStatus.isRunning) {
      return NextResponse.json(
        {
          success: false,
          message: '扫描任务正在进行中，请稍后再试',
          code: 'SCAN_IN_PROGRESS',
          status: engineStatus,
        },
        { status: 409 }
      ); // 409 Conflict
    }

    // 触发手动扫描
    const scanResult = await triggerManualScan();

    if (scanResult.success) {
      logger.info('手动扫描触发成功', {
        userId,
        scanId: scanResult.scanId,
        rulesScanned: scanResult.rulesScanned,
        rulesMatched: scanResult.rulesMatched,
        notificationsCreated: scanResult.notificationsCreated,
        duration: scanResult.duration,
      });

      return NextResponse.json({
        success: true,
        message: '扫描任务已成功执行',
        data: {
          scan_id: scanResult.scanId,
          scan_type: 'manual',
          rules_scanned: scanResult.rulesScanned,
          rules_matched: scanResult.rulesMatched,
          notifications_created: scanResult.notificationsCreated,
          duration_ms: scanResult.duration,
          errors: scanResult.errors,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('手动扫描执行失败', {
        userId,
        scanResult,
        error: new Error('手动扫描执行失败'),
      });

      return NextResponse.json(
        {
          success: false,
          message: '扫描任务执行失败',
          code: 'SCAN_EXECUTION_FAILED',
          data: {
            scan_id: scanResult.scanId,
            errors: scanResult.errors,
            duration_ms: scanResult.duration,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('触发扫描时发生未知错误', { error });
    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR',
        message: '触发扫描时发生未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/alerts/scan
 * 获取警报扫描状态和最近的扫描历史
 */
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证用户身份
    // 临时跳过认证用于测试
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: '未授权访问', code: 'UNAUTHORIZED' },
    //     { status: 401 }
    //   );
    // }
    const session = { user: { id: 'test-user-123' } }; // 临时测试会话

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // 最大50条

    // 获取当前引擎状态
    const engineStatus = getAlertEngineStatus();

    // 获取最近的扫描历史（从scan_logs表）
    const { supabase } = await import('@/lib/supabase');
    const { data: scanLogs, error } = await supabase
      .from('scan_logs')
      .select(
        `
        scan_id,
        scan_type,
        status,
        start_time,
        end_time,
        duration,
        rules_scanned,
        rules_matched,
        notifications_created,
        errors,
        metadata
      `
      )
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('获取扫描历史失败', { error: new Error(error.message) });
      return NextResponse.json(
        { error: '获取扫描历史失败', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    // 计算统计信息
    const stats = {
      total_scans: scanLogs?.length || 0,
      successful_scans:
        scanLogs?.filter(log => log.status === 'completed').length || 0,
      failed_scans:
        scanLogs?.filter(log => log.status === 'failed').length || 0,
      running_scans:
        scanLogs?.filter(log => log.status === 'running').length || 0,
      total_rules_scanned:
        scanLogs?.reduce((sum, log) => sum + (log.rules_scanned || 0), 0) || 0,
      total_rules_matched:
        scanLogs?.reduce((sum, log) => sum + (log.rules_matched || 0), 0) || 0,
      total_notifications_created:
        scanLogs?.reduce(
          (sum, log) => sum + (log.notifications_created || 0),
          0
        ) || 0,
      average_duration: scanLogs?.length
        ? Math.round(
            scanLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
              scanLogs.length
          )
        : 0,
    };

    // 获取最近一次扫描信息
    const lastScan = scanLogs?.[0] || null;

    logger.info('查询扫描状态成功', {
      userId: session.user.id,
      totalScans: scanLogs?.length || 0,
      recentScans: scanLogs?.length || 0,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: {
        engine_status: {
          is_scheduled: engineStatus.isScheduled,
          is_running: engineStatus.isRunning,
          schedule: '*/5 * * * *', // 每5分钟
          next_scheduled_run: getNextScheduledRun(),
        },
        last_scan: lastScan,
        recent_scans: scanLogs || [],
        statistics: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('获取扫描状态时发生未知错误', { error });
    return NextResponse.json(
      { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * 计算下次定时扫描时间
 */
function getNextScheduledRun(): string {
  const now = new Date();
  const nextRun = new Date(now);

  // 计算到下一个5分钟整数倍的时间
  const minutes = now.getMinutes();
  const nextMinutes = Math.ceil(minutes / 5) * 5;

  if (nextMinutes >= 60) {
    nextRun.setHours(now.getHours() + 1);
    nextRun.setMinutes(0);
  } else {
    nextRun.setMinutes(nextMinutes);
  }

  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);

  return nextRun.toISOString();
}

/**
 * 检查用户是否为管理员（可选功能）
 */
// async function checkUserIsAdmin(userId: string): Promise<boolean> {
//   try {
//     const { supabase } = await import('@/lib/supabase');
//     const { data, error } = await supabase
//       .from('users')
//       .select('role')
//       .eq('id', userId)
//       .single();

//     if (error) {
//       logError(new Error(error.message), 'CheckUserIsAdmin');
//       return false;
//     }

//     return data?.role === 'admin' || data?.role === 'super_admin';
//   } catch (error) {
//     logError(error as Error, 'CheckUserIsAdmin');
//     return false;
//   }
// }
