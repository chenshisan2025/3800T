import logger, { logInfo, logError } from './logger';
import { startMarketScanCron } from './cron';

// 应用启动初始化
export async function initializeApp(): Promise<void> {
  try {
    logInfo('应用启动初始化开始');
    
    // 启动市场扫描定时任务
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      startMarketScanCron();
      logInfo('定时任务已启动');
    } else {
      logInfo('开发环境，跳过定时任务启动（可通过 ENABLE_CRON=true 环境变量启用）');
    }
    
    logInfo('应用启动初始化完成');
    
  } catch (error) {
    logError(error as Error, 'AppInitialization');
  }
}

// 应用关闭清理
export async function cleanupApp(): Promise<void> {
  try {
    logInfo('应用关闭清理开始');
    
    // 停止所有定时任务
    const { cronScheduler } = await import('./cron');
    cronScheduler.stopAll();
    
    logInfo('应用关闭清理完成');
    
  } catch (error) {
    logError(error as Error, 'AppCleanup');
  }
}

// 处理进程退出信号 - Edge Runtime兼容版本
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', async () => {
    logInfo('收到 SIGTERM 信号，开始清理');
    await cleanupApp();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    logInfo('收到 SIGINT 信号，开始清理');
    await cleanupApp();
    process.exit(0);
  });
}