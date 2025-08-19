import { prisma } from './prisma';
import logger, { logInfo, logError } from './logger';

// 模拟股票价格数据
const mockStockPrices: Record<string, number> = {
  '000001': 12.50,
  '000002': 28.30,
  '600000': 8.90,
  '600036': 35.20,
  '000858': 45.60,
  'AAPL': 175.80,
  'TSLA': 245.30,
  'MSFT': 380.50,
};

// 生成随机价格变动（-5% 到 +5%）
function generateRandomPriceChange(basePrice: number): number {
  const changePercent = (Math.random() - 0.5) * 0.1; // -5% 到 +5%
  const newPrice = basePrice * (1 + changePercent);
  return Math.round(newPrice * 100) / 100; // 保留两位小数
}

// 模拟获取股票实时价格
export async function mockFetchStockPrice(symbol: string): Promise<number | null> {
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    const basePrice = mockStockPrices[symbol];
    if (!basePrice) {
      return null;
    }
    
    return generateRandomPriceChange(basePrice);
  } catch (error) {
    logError(error as Error, `MockFetchStockPrice-${symbol}`);
    return null;
  }
}

// 检查提醒条件是否满足
function checkAlertCondition(currentPrice: number, condition: string, targetPrice: number): boolean {
  switch (condition) {
    case 'gte':
      return currentPrice >= targetPrice;
    case 'lte':
      return currentPrice <= targetPrice;
    default:
      return false;
  }
}

// 创建通知记录
async function createNotification(userId: string, alertId: string, stockSymbol: string, currentPrice: number, condition: string, targetPrice: number, stockName?: string) {
  const conditionText = condition === 'gte' ? '大于等于' : '小于等于';
  const message = `${stockName || stockSymbol} 当前价格 ${currentPrice} 已${conditionText}您设置的目标价格 ${targetPrice}`;
  
  try {
    await prisma.notification.create({
      data: {
        userId: userId,
        alertId: alertId,
        title: '价格提醒',
        message: message,
        type: 'price_alert',
        isRead: false,
      },
    });
    
    logInfo('通知创建成功', {
      userId,
      alertId,
      stockSymbol,
      currentPrice,
      targetPrice,
      condition,
    });
  } catch (error) {
    logError(error as Error, 'CreateNotification');
  }
}

// 扫描行情并检查提醒规则
export async function scanMarketAndCheckAlerts(): Promise<void> {
  try {
    logInfo('开始扫描行情数据', { timestamp: new Date().toISOString() });
    
    // 获取所有活跃的提醒规则
    const activeAlerts = await prisma.alert.findMany({
      where: {
        isActive: true,
      },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
          },
        },
      },
    });
    
    if (activeAlerts.length === 0) {
      logInfo('没有活跃的提醒规则', { count: 0 });
      return;
    }
    
    logInfo('找到活跃提醒规则', { count: activeAlerts.length });
    
    // 按股票代码分组，避免重复获取价格
    const stockSymbols = [...new Set(activeAlerts.map(alert => alert.stockSymbol))];
    const stockPrices: Record<string, number> = {};
    
    // 批量获取股票价格
    for (const symbol of stockSymbols) {
      const price = await mockFetchStockPrice(symbol);
      if (price !== null) {
        stockPrices[symbol] = price;
        
        // 更新数据库中的股票价格
        await prisma.stock.updateMany({
          where: { symbol: symbol },
          data: {
            currentPrice: price,
            updatedAt: new Date(),
          },
        });
      }
    }
    
    logInfo('股票价格更新完成', { 
      updatedCount: Object.keys(stockPrices).length,
      prices: stockPrices 
    });
    
    // 检查每个提醒规则
    let triggeredCount = 0;
    
    for (const alert of activeAlerts) {
      const currentPrice = stockPrices[alert.stockSymbol];
      
      if (currentPrice === undefined) {
        logError(new Error(`无法获取股票 ${alert.stockSymbol} 的价格`), 'ScanMarket');
        continue;
      }
      
      // 检查提醒条件
      const isTriggered = checkAlertCondition(currentPrice, alert.condition, alert.targetPrice);
      
      if (isTriggered) {
        // 创建通知
        await createNotification(
          alert.userId,
          alert.id,
          alert.stockSymbol,
          currentPrice,
          alert.condition,
          alert.targetPrice,
          alert.stock?.name
        );
        
        // 可选：触发后禁用提醒规则（避免重复通知）
        await prisma.alert.update({
          where: { id: alert.id },
          data: { isActive: false },
        });
        
        triggeredCount++;
      }
    }
    
    logInfo('行情扫描完成', {
      totalAlerts: activeAlerts.length,
      triggeredAlerts: triggeredCount,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    logError(error as Error, 'ScanMarketAndCheckAlerts');
  }
}

// 定时任务调度器
class CronScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  // 启动定时任务
  start(name: string, task: () => Promise<void>, intervalMs: number): void {
    if (this.intervals.has(name)) {
      logInfo(`定时任务 ${name} 已在运行，先停止旧任务`);
      this.stop(name);
    }
    
    const interval = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        logError(error as Error, `CronTask-${name}`);
      }
    }, intervalMs);
    
    this.intervals.set(name, interval);
    logInfo(`定时任务 ${name} 已启动`, { intervalMs });
  }
  
  // 停止定时任务
  stop(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
      logInfo(`定时任务 ${name} 已停止`);
    }
  }
  
  // 停止所有定时任务
  stopAll(): void {
    for (const [name] of this.intervals) {
      this.stop(name);
    }
  }
  
  // 获取运行中的任务列表
  getRunningTasks(): string[] {
    return Array.from(this.intervals.keys());
  }
}

// 全局定时任务调度器实例
export const cronScheduler = new CronScheduler();

// 启动市场扫描定时任务（5分钟间隔）
export function startMarketScanCron(): void {
  const FIVE_MINUTES = 5 * 60 * 1000; // 5分钟 = 300000毫秒
  
  cronScheduler.start('market-scan', scanMarketAndCheckAlerts, FIVE_MINUTES);
  
  // 立即执行一次
  scanMarketAndCheckAlerts().catch(error => {
    logError(error as Error, 'InitialMarketScan');
  });
}

// 停止市场扫描定时任务
export function stopMarketScanCron(): void {
  cronScheduler.stop('market-scan');
}