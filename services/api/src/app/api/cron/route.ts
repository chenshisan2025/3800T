import { NextRequest } from 'next/server';
import { apiResponse, handleApiError } from '@/utils';
import { createRequestLogger } from '@/lib/logger';
import {
  startMarketScanCron,
  stopMarketScanCron,
  cronScheduler,
  scanMarketAndCheckAlerts,
} from '@/lib/cron';

// GET /api/cron - 获取定时任务状态
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const runningTasks = cronScheduler.getRunningTasks();

    return apiResponse.success({
      runningTasks,
      isMarketScanRunning: runningTasks.includes('market-scan'),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('获取定时任务状态失败', { error });
    return handleApiError(error, 'GetCronStatus');
  }
}

// POST /api/cron - 管理定时任务
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const body = await request.json();
    const { action, task } = body;

    if (!action || !task) {
      return apiResponse.error(
        '请提供 action 和 task 参数',
        400,
        'MISSING_PARAMS'
      );
    }

    switch (action) {
      case 'start':
        if (task === 'market-scan') {
          startMarketScanCron();
          logger.info('市场扫描定时任务已启动', { task, action });
          return apiResponse.success(
            {
              task: 'market-scan',
              action: 'started',
              interval: '5 minutes',
              timestamp: new Date().toISOString(),
            },
            '市场扫描定时任务已启动'
          );
        }
        break;

      case 'stop':
        if (task === 'market-scan') {
          stopMarketScanCron();
          logger.info('市场扫描定时任务已停止', { task, action });
          return apiResponse.success(
            {
              task: 'market-scan',
              action: 'stopped',
              timestamp: new Date().toISOString(),
            },
            '市场扫描定时任务已停止'
          );
        }
        break;

      case 'run-once':
        if (task === 'market-scan') {
          // 立即执行一次市场扫描
          await scanMarketAndCheckAlerts();
          logger.info('市场扫描任务已手动执行一次', { task, action });
          return apiResponse.success(
            {
              task: 'market-scan',
              action: 'executed',
              timestamp: new Date().toISOString(),
            },
            '市场扫描任务已执行完成'
          );
        }
        break;

      default:
        return apiResponse.error('无效的操作类型', 400, 'INVALID_ACTION');
    }

    return apiResponse.error('无效的任务名称', 400, 'INVALID_TASK');
  } catch (error) {
    logger.error('管理定时任务失败', { error });
    return handleApiError(error, 'ManageCronTask');
  }
}
