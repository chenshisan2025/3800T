import logger from './logger';
import { startMarketScanCron } from './cron';
import { startAlertEngine } from './alert-engine';

export async function initializeServices() {
  const startupLogger = logger.child({ module: 'startup' });

  try {
    startupLogger.info('开始初始化服务...');

    // 启动定时任务
    await startMarketScanCron();
    startupLogger.info('市场扫描定时任务已启动');

    // 启动告警引擎
    await startAlertEngine();
    startupLogger.info('告警引擎已启动');

    startupLogger.info('所有服务初始化完成');
  } catch (error) {
    startupLogger.error('服务初始化失败', error);
    throw error;
  }
}

// 应用启动初始化
export async function initializeApp(): Promise<void> {
  const appLogger = logger.child({ module: 'app-init' });

  try {
    appLogger.info('应用启动初始化开始');

    // 启动新的警报引擎定时任务
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.ENABLE_CRON === 'true'
    ) {
      startAlertEngine();
      appLogger.info('警报引擎定时任务已启动');
    } else {
      appLogger.info(
        '开发环境，跳过警报引擎启动（可通过 ENABLE_CRON=true 环境变量启用）'
      );
    }

    appLogger.info('应用启动初始化完成');
  } catch (error) {
    appLogger.error('应用初始化失败', error);
  }
}

// 应用关闭清理
export async function cleanupApp(): Promise<void> {
  const cleanupLogger = logger.child({ module: 'app-cleanup' });

  try {
    cleanupLogger.info('应用关闭清理开始');

    // 停止所有定时任务
    const { cronScheduler } = await import('./cron');
    cronScheduler.stopAll();

    cleanupLogger.info('应用关闭清理完成');
  } catch (error) {
    cleanupLogger.error('应用清理失败', error);
  }
}

// 处理进程退出信号 - Edge Runtime兼容版本
if (typeof process !== 'undefined' && process.on) {
  const processLogger = logger.child({ module: 'process-signals' });

  process.on('SIGTERM', async () => {
    processLogger.info('收到 SIGTERM 信号，开始清理');
    await cleanupApp();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    processLogger.info('收到 SIGINT 信号，开始清理');
    await cleanupApp();
    process.exit(0);
  });
}
