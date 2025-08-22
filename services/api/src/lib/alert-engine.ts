import { supabase } from './supabase';
import logger from './logger';
import * as cron from 'node-cron';
import {
  StockPriceCache,
  ScanStatsCache,
  HotStocksCache,
  PerformanceCache,
} from './redis';

// 警报规则类型定义
interface AlertRule {
  id: string;
  user_id: string;
  symbol: string;
  rule_type: 'price_above' | 'price_below' | 'price_change';
  threshold: number;
  change_percent?: number;
  enabled: boolean;
  message?: string;
  created_at: string;
  updated_at: string;
}

// 扫描日志类型定义
interface ScanLog {
  scan_id: string;
  scan_type: 'scheduled' | 'manual';
  status: 'running' | 'completed' | 'failed';
  start_time: Date;
  end_time?: Date;
  duration?: number;
  rules_scanned: number;
  rules_matched: number;
  notifications_created: number;
  errors?: string[];
  metadata?: any;
}

// Redis缓存TTL配置
const CACHE_TTL = 60 * 1000; // 1分钟缓存（用于兼容性检查）

// 模拟股票价格数据（实际应该从ProviderX API获取）
const mockStockPrices: Record<string, number> = {
  AAPL: 175.8,
  GOOGL: 2850.3,
  TSLA: 245.3,
  MSFT: 380.5,
  NVDA: 720.15,
  AMZN: 145.6,
  META: 485.2,
  NFLX: 425.8,
};

/**
 * 生成扫描ID
 */
export function generateScanId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const randomStr = Math.random().toString(16).slice(2, 10);
  return `scan_${dateStr}_${timeStr}_${randomStr}`;
}

/**
 * 生成幂等键
 */
export function generateIdempotencyKey(
  userId: string,
  symbol: string,
  ruleId: string,
  date: string = new Date().toISOString().split('T')[0]
): string {
  const dateStr = date.replace(/-/g, '');
  return `${userId}_${symbol}_${ruleId}_${dateStr}`;
}

/**
 * 获取股票价格（带Redis缓存）
 */
export async function getStockPrice(symbol: string): Promise<number | null> {
  const startTime = Date.now();

  try {
    // 检查Redis缓存
    const cached = await StockPriceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // 记录缓存命中性能指标
      await PerformanceCache.recordMetric(
        'cache_hit_time',
        Date.now() - startTime
      );
      return cached.price;
    }

    // 模拟API调用延迟（测试环境中跳过）
    if (process.env.NODE_ENV !== 'test') {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }

    // 模拟价格波动（实际应该调用ProviderX API）
    const basePrice = mockStockPrices[symbol];
    if (!basePrice) {
      logger.error('Unknown symbol', {
        symbol,
        error: new Error(`Unknown symbol: ${symbol}`),
      });
      return null;
    }

    // 生成-3%到+3%的随机波动
    const changePercent = (Math.random() - 0.5) * 0.06;
    const currentPrice =
      Math.round(basePrice * (1 + changePercent) * 100) / 100;

    // 更新Redis缓存
    await StockPriceCache.set(symbol, currentPrice);

    // 添加到热门股票列表
    await HotStocksCache.addHotStock(symbol);

    // 记录API调用性能指标
    await PerformanceCache.recordMetric(
      'api_call_time',
      Date.now() - startTime
    );

    return currentPrice;
  } catch (error) {
    logger.error('获取股票价格失败', { symbol, error: error as Error });
    // 记录错误性能指标
    await PerformanceCache.recordMetric(
      'api_error_time',
      Date.now() - startTime
    );
    return null;
  }
}

/**
 * 检查规则是否匹配
 */
export function checkRuleMatch(
  rule: AlertRule,
  currentPrice: number,
  previousPrice?: number
): { matched: boolean; message: string } {
  switch (rule.rule_type) {
    case 'price_above':
      const aboveMatched = currentPrice > rule.threshold;
      return {
        matched: aboveMatched,
        message: aboveMatched
          ? generateNotificationMessage(rule, currentPrice, previousPrice)
          : '',
      };

    case 'price_below':
      const belowMatched = currentPrice < rule.threshold;
      return {
        matched: belowMatched,
        message: belowMatched
          ? generateNotificationMessage(rule, currentPrice, previousPrice)
          : '',
      };

    case 'price_change':
      if (!rule.change_percent) {
        return { matched: false, message: '' };
      }
      // 如果没有提供previousPrice，使用模拟的基准价格（当前价格的95%作为基准）
      const basePrice =
        previousPrice !== undefined ? previousPrice : currentPrice / 1.05;

      // 处理除零情况
      if (basePrice === 0) {
        // 如果基准价格为0，任何非零的当前价格都是无限大的变化
        const changeMatched = currentPrice !== 0;
        return {
          matched: changeMatched,
          message: changeMatched
            ? generateNotificationMessage(rule, currentPrice, basePrice)
            : '',
        };
      }

      const changePercent = ((currentPrice - basePrice) / basePrice) * 100;
      const changeMatched = Math.abs(changePercent) >= rule.change_percent;
      return {
        matched: changeMatched,
        message: changeMatched
          ? generateNotificationMessage(rule, currentPrice, basePrice)
          : '',
      };

    default:
      return { matched: false, message: '' };
  }
}

/**
 * 生成通知消息
 */
function generateNotificationMessage(
  rule: AlertRule,
  currentPrice: number,
  previousPrice?: number
): string {
  if (rule.message) {
    return rule.message
      .replace('{symbol}', rule.symbol)
      .replace('{current_price}', currentPrice.toString())
      .replace('{threshold}', rule.threshold.toString());
  }

  switch (rule.rule_type) {
    case 'price_above':
      return `${rule.symbol} 股价已突破 ${rule.threshold}，当前价格 ${currentPrice}`;

    case 'price_below':
      return `${rule.symbol} 股价已跌破 ${rule.threshold}，当前价格 ${currentPrice}`;

    case 'price_change':
      if (previousPrice !== undefined) {
        if (previousPrice === 0) {
          return `${rule.symbol} price increased from $0 to $${currentPrice}`;
        }
        const changePercent =
          ((currentPrice - previousPrice) / previousPrice) * 100;
        const direction = changePercent > 0 ? 'increased' : 'decreased';
        return `${rule.symbol} price ${direction} ${changePercent.toFixed(2)}% to $${currentPrice}`;
      }
      return `${rule.symbol} price changed significantly to $${currentPrice}`;

    default:
      return `${rule.symbol} 触发警报，当前价格 ${currentPrice}`;
  }
}

/**
 * 创建扫描日志
 */
async function createScanLog(scanLog: Partial<ScanLog>): Promise<void> {
  try {
    const { error } = await supabase.from('scan_logs').insert({
      scan_id: scanLog.scan_id,
      scan_type: scanLog.scan_type || 'scheduled',
      status: scanLog.status || 'running',
      start_time: scanLog.start_time || new Date(),
      end_time: scanLog.end_time,
      duration: scanLog.duration,
      rules_scanned: scanLog.rules_scanned || 0,
      rules_matched: scanLog.rules_matched || 0,
      notifications_created: scanLog.notifications_created || 0,
      errors: scanLog.errors,
      metadata: scanLog.metadata,
    });

    if (error) {
      logger.error('创建扫描日志失败', { error: new Error(error.message) });
    }
  } catch (error) {
    logger.error('创建扫描日志失败', { error: error as Error });
  }
}

/**
 * 更新扫描日志
 */
async function updateScanLog(
  scanId: string,
  updates: Partial<ScanLog>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('scan_logs')
      .update({
        status: updates.status,
        end_time: updates.end_time,
        duration: updates.duration,
        rules_scanned: updates.rules_scanned,
        rules_matched: updates.rules_matched,
        notifications_created: updates.notifications_created,
        errors: updates.errors,
        metadata: updates.metadata,
      })
      .eq('scan_id', scanId);

    if (error) {
      logger.error('更新扫描日志失败', { error: new Error(error.message) });
    }
  } catch (error) {
    logger.error('更新扫描日志失败', { error: error as Error });
  }
}

/**
 * 获取活跃的警报规则
 */
async function getActiveAlertRules(): Promise<AlertRule[]> {
  try {
    const { data, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('获取活跃警报规则失败', { error: new Error(error.message) });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('获取活跃警报规则失败', { error: error as Error });
    return [];
  }
}

/**
 * 创建通知（带幂等检查）
 */
export async function createNotificationWithIdempotency(
  userId: string,
  ruleId: string,
  symbol: string,
  ruleType: string,
  triggerPrice: number,
  currentPrice: number,
  title: string,
  message: string
): Promise<{
  success: boolean;
  notificationId: string | null;
  wasDuplicate: boolean;
  error?: string;
}> {
  const today = new Date().toISOString().split('T')[0];
  const idempotencyKey = generateIdempotencyKey(userId, symbol, ruleId, today);

  try {
    // 使用存储过程创建通知和幂等记录
    const { data, error } = await supabase.rpc(
      'create_notification_with_idempotency',
      {
        p_user_id: userId,
        p_rule_id: ruleId,
        p_symbol: symbol,
        p_rule_type: ruleType,
        p_trigger_price: triggerPrice,
        p_current_price: currentPrice,
        p_title: title,
        p_message: message,
        p_notification_date: today,
      }
    );

    if (error) {
      if (
        error.message.includes('unique_violation') ||
        error.message.includes('duplicate')
      ) {
        // 幂等检查：今日已通知，跳过
        return { success: true, notificationId: null, wasDuplicate: true };
      }
      logger.error('创建通知失败', {
        error: new Error(error.message),
        userId,
        ruleId,
        symbol,
      });
      return {
        success: false,
        notificationId: null,
        wasDuplicate: false,
        error: error.message,
      };
    }

    // 检查返回的数据结构
    if (data && typeof data === 'object') {
      const result = data as any;
      if (result.success && result.notification_id) {
        logger.info('通知创建成功', {
          userId,
          ruleId,
          symbol,
          ruleType,
          currentPrice,
          triggerPrice,
          idempotencyKey,
          notificationId: result.notification_id,
        });
        return {
          success: true,
          notificationId: result.notification_id,
          wasDuplicate: result.was_duplicate || false,
        };
      } else if (result.was_duplicate) {
        return { success: true, notificationId: null, wasDuplicate: true };
      }
    }

    // 如果返回的是UUID字符串，说明创建成功
    if (typeof data === 'string') {
      logger.info('通知创建成功', {
        userId,
        ruleId,
        symbol,
        ruleType,
        currentPrice,
        triggerPrice,
        idempotencyKey,
        notificationId: data,
      });
      return { success: true, notificationId: data, wasDuplicate: false };
    }

    return {
      success: false,
      notificationId: null,
      wasDuplicate: false,
      error: 'Unexpected response format',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('创建通知失败', {
      error: error as Error,
      userId,
      ruleId,
      symbol,
    });
    return {
      success: false,
      notificationId: null,
      wasDuplicate: false,
      error: errorMessage,
    };
  }
}

/**
 * 更新周期性统计数据
 */
async function updatePeriodStats(scanData: {
  scanId: string;
  scanType: 'scheduled' | 'manual';
  rulesScanned: number;
  rulesMatched: number;
  notificationsCreated: number;
  duration: number;
  success: boolean;
  symbolsProcessed: number;
}): Promise<void> {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekStr = getWeekString(now); // YYYY-WW
    const monthStr = now.toISOString().substring(0, 7); // YYYY-MM

    // 更新每日统计
    const dailyStats = (await ScanStatsCache.getDailyStats(dateStr)) || {
      date: dateStr,
      totalScans: 0,
      totalRulesScanned: 0,
      totalRulesMatched: 0,
      totalNotificationsCreated: 0,
      totalDuration: 0,
      successfulScans: 0,
      failedScans: 0,
      totalSymbolsProcessed: 0,
    };

    const updatedDailyStats = {
      ...dailyStats,
      totalScans: dailyStats.totalScans + 1,
      totalRulesScanned: dailyStats.totalRulesScanned + scanData.rulesScanned,
      totalRulesMatched: dailyStats.totalRulesMatched + scanData.rulesMatched,
      totalNotificationsCreated:
        dailyStats.totalNotificationsCreated + scanData.notificationsCreated,
      totalDuration: dailyStats.totalDuration + scanData.duration,
      successfulScans: dailyStats.successfulScans + (scanData.success ? 1 : 0),
      failedScans: dailyStats.failedScans + (scanData.success ? 0 : 1),
      totalSymbolsProcessed:
        dailyStats.totalSymbolsProcessed + scanData.symbolsProcessed,
      averageDuration: Math.round(
        (dailyStats.totalDuration + scanData.duration) /
          (dailyStats.totalScans + 1)
      ),
    };

    await ScanStatsCache.setDailyStats(dateStr, updatedDailyStats);

    // 更新每周统计
    const weeklyStats = (await ScanStatsCache.getWeeklyStats(weekStr)) || {
      week: weekStr,
      totalScans: 0,
      totalRulesScanned: 0,
      totalRulesMatched: 0,
      totalNotificationsCreated: 0,
      totalDuration: 0,
      successfulScans: 0,
      failedScans: 0,
      totalSymbolsProcessed: 0,
    };

    const updatedWeeklyStats = {
      ...weeklyStats,
      totalScans: weeklyStats.totalScans + 1,
      totalRulesScanned: weeklyStats.totalRulesScanned + scanData.rulesScanned,
      totalRulesMatched: weeklyStats.totalRulesMatched + scanData.rulesMatched,
      totalNotificationsCreated:
        weeklyStats.totalNotificationsCreated + scanData.notificationsCreated,
      totalDuration: weeklyStats.totalDuration + scanData.duration,
      successfulScans: weeklyStats.successfulScans + (scanData.success ? 1 : 0),
      failedScans: weeklyStats.failedScans + (scanData.success ? 0 : 1),
      totalSymbolsProcessed:
        weeklyStats.totalSymbolsProcessed + scanData.symbolsProcessed,
      averageDuration: Math.round(
        (weeklyStats.totalDuration + scanData.duration) /
          (weeklyStats.totalScans + 1)
      ),
    };

    await ScanStatsCache.setWeeklyStats(weekStr, updatedWeeklyStats);

    // 更新每月统计
    const monthlyStats = (await ScanStatsCache.getMonthlyStats(monthStr)) || {
      month: monthStr,
      totalScans: 0,
      totalRulesScanned: 0,
      totalRulesMatched: 0,
      totalNotificationsCreated: 0,
      totalDuration: 0,
      successfulScans: 0,
      failedScans: 0,
      totalSymbolsProcessed: 0,
    };

    const updatedMonthlyStats = {
      ...monthlyStats,
      totalScans: monthlyStats.totalScans + 1,
      totalRulesScanned: monthlyStats.totalRulesScanned + scanData.rulesScanned,
      totalRulesMatched: monthlyStats.totalRulesMatched + scanData.rulesMatched,
      totalNotificationsCreated:
        monthlyStats.totalNotificationsCreated + scanData.notificationsCreated,
      totalDuration: monthlyStats.totalDuration + scanData.duration,
      successfulScans:
        monthlyStats.successfulScans + (scanData.success ? 1 : 0),
      failedScans: monthlyStats.failedScans + (scanData.success ? 0 : 1),
      totalSymbolsProcessed:
        monthlyStats.totalSymbolsProcessed + scanData.symbolsProcessed,
      averageDuration: Math.round(
        (monthlyStats.totalDuration + scanData.duration) /
          (monthlyStats.totalScans + 1)
      ),
    };

    await ScanStatsCache.setMonthlyStats(monthStr, updatedMonthlyStats);

    logger.info('周期性统计数据已更新', {
      date: dateStr,
      week: weekStr,
      month: monthStr,
      scanId: scanData.scanId,
    });
  } catch (error) {
    logger.error('更新周期性统计数据失败', { error: error as Error });
  }
}

/**
 * 获取周字符串 (YYYY-WW格式)
 */
function getWeekString(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
  );
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * 更新扫描统计缓存
 */
async function updateScanStatsCache(scanData: {
  scanId: string;
  scanType: 'scheduled' | 'manual';
  rulesScanned: number;
  rulesMatched: number;
  notificationsCreated: number;
  duration: number;
  success: boolean;
  symbolsProcessed: number;
}): Promise<void> {
  try {
    // 获取当前统计数据
    const currentStats = (await ScanStatsCache.get()) || {
      totalScans: 0,
      totalRulesScanned: 0,
      totalRulesMatched: 0,
      totalNotificationsCreated: 0,
      averageDuration: 0,
      lastScanTime: 0,
      successfulScans: 0,
      failedScans: 0,
      totalSymbolsProcessed: 0,
    };

    // 更新统计数据
    const newStats = {
      totalScans: currentStats.totalScans + 1,
      totalRulesScanned: currentStats.totalRulesScanned + scanData.rulesScanned,
      totalRulesMatched: currentStats.totalRulesMatched + scanData.rulesMatched,
      totalNotificationsCreated:
        currentStats.totalNotificationsCreated + scanData.notificationsCreated,
      averageDuration: Math.round(
        (currentStats.averageDuration * currentStats.totalScans +
          scanData.duration) /
          (currentStats.totalScans + 1)
      ),
      lastScanTime: Date.now(),
      successfulScans:
        currentStats.successfulScans + (scanData.success ? 1 : 0),
      failedScans: currentStats.failedScans + (scanData.success ? 0 : 1),
      totalSymbolsProcessed:
        currentStats.totalSymbolsProcessed + scanData.symbolsProcessed,
      lastScanId: scanData.scanId,
      lastScanType: scanData.scanType,
    };

    // 保存到Redis缓存
    await ScanStatsCache.set(newStats);

    // 更新每日、每周、每月统计
    await updatePeriodStats(scanData);

    // 记录性能指标
    await PerformanceCache.recordMetric('scan_duration', scanData.duration);
    await PerformanceCache.recordMetric(
      'rules_scanned_per_scan',
      scanData.rulesScanned
    );
    await PerformanceCache.recordMetric(
      'match_rate',
      scanData.rulesScanned > 0
        ? (scanData.rulesMatched / scanData.rulesScanned) * 100
        : 0
    );

    logger.info('扫描统计缓存已更新', {
      scanId: scanData.scanId,
      totalScans: newStats.totalScans,
      successRate:
        ((newStats.successfulScans / newStats.totalScans) * 100).toFixed(2) +
        '%',
    });
  } catch (error) {
    logger.error('更新扫描统计缓存失败', { error: error as Error });
  }
}

/**
 * 获取扫描统计数据
 */
export async function getScanStats(): Promise<any> {
  try {
    const stats = await ScanStatsCache.get();
    const hotStocks = await HotStocksCache.getHotStocks(10);
    const cacheHitTime = await PerformanceCache.getMetric('cache_hit_time');
    const apiCallTime = await PerformanceCache.getMetric('api_call_time');
    const scanDuration = await PerformanceCache.getMetric('scan_duration');
    const matchRate = await PerformanceCache.getMetric('match_rate');

    // 获取最近7天的每日统计
    const recentDailyStats = await ScanStatsCache.getRecentDailyStats(7);

    // 获取当前周和月的统计
    const now = new Date();
    const currentWeek = getWeekString(now);
    const currentMonth = now.toISOString().substring(0, 7);
    const weeklyStats = await ScanStatsCache.getWeeklyStats(currentWeek);
    const monthlyStats = await ScanStatsCache.getMonthlyStats(currentMonth);

    return {
      overall: stats,
      daily: recentDailyStats,
      weekly: weeklyStats,
      monthly: monthlyStats,
      hotStocks,
      performance: {
        averageCacheHitTime: cacheHitTime?.value || 0,
        averageApiCallTime: apiCallTime?.value || 0,
        averageScanDuration: scanDuration?.value || 0,
        averageMatchRate: matchRate?.value || 0,
      },
    };
  } catch (error) {
    logger.error('获取扫描统计数据失败', { error: error as Error });
    return null;
  }
}

/**
 * 执行警报扫描
 */
export async function executeAlertScan(
  scanType: 'scheduled' | 'manual' = 'scheduled'
): Promise<{
  success: boolean;
  scanId: string;
  rulesScanned: number;
  rulesMatched: number;
  notificationsCreated: number;
  duration: number;
  errors: string[];
}> {
  const scanId = generateScanId();
  const startTime = new Date();
  const errors: string[] = [];

  let rulesScanned = 0;
  let rulesMatched = 0;
  let notificationsCreated = 0;

  try {
    logger.info('开始执行警报扫描', { scanId, scanType, startTime });

    // 创建扫描日志
    await createScanLog({
      scan_id: scanId,
      scan_type: scanType,
      status: 'running',
      start_time: startTime,
    });

    // 获取所有活跃的警报规则
    const activeRules = await getActiveAlertRules();
    rulesScanned = activeRules.length;

    if (activeRules.length === 0) {
      logger.info('没有找到活跃的警报规则', { scanId });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      await updateScanLog(scanId, {
        status: 'completed',
        end_time: endTime,
        duration,
        rules_scanned: 0,
        rules_matched: 0,
        notifications_created: 0,
      });

      return {
        success: true,
        scanId,
        rulesScanned: 0,
        rulesMatched: 0,
        notificationsCreated: 0,
        duration,
        errors: [],
      };
    }

    logger.info('找到活跃警报规则', { scanId, count: activeRules.length });

    // 按股票代码分组，减少API调用
    const symbolGroups = activeRules.reduce(
      (groups, rule) => {
        if (!groups[rule.symbol]) {
          groups[rule.symbol] = [];
        }
        groups[rule.symbol].push(rule);
        return groups;
      },
      {} as Record<string, AlertRule[]>
    );

    const symbols = Object.keys(symbolGroups);
    logger.info('需要获取股价的股票', {
      scanId,
      symbols,
      count: symbols.length,
    });

    // 遍历每个股票代码
    for (const symbol of symbols) {
      try {
        // 获取当前股价
        const currentPrice = await getStockPrice(symbol);

        if (currentPrice === null) {
          const error = `无法获取股票 ${symbol} 的价格`;
          errors.push(error);
          logger.error('执行警报扫描失败', {
            error: new Error(error),
            scanId,
            symbol,
          });
          continue;
        }

        // 检查该股票的所有规则
        const rules = symbolGroups[symbol];

        for (const rule of rules) {
          try {
            // 检查规则是否匹配
            const matchResult = checkRuleMatch(rule, currentPrice);

            if (matchResult.matched) {
              rulesMatched++;

              // 创建通知（带幂等检查）
              const result = await createNotificationWithIdempotency(
                rule.user_id,
                rule.id,
                rule.symbol,
                rule.rule_type,
                rule.threshold,
                currentPrice,
                `股价提醒 - ${rule.symbol}`,
                matchResult.message
              );

              if (result.success && !result.wasDuplicate) {
                notificationsCreated++;
              }
            }
          } catch (error) {
            const errorMsg = `处理规则 ${rule.id} 时出错: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            logger.error('处理规则时出错', {
              error: error as Error,
              scanId,
              ruleId: rule.id,
            });
          }
        }
      } catch (error) {
        const errorMsg = `处理股票 ${symbol} 时出错: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        logger.error('处理股票时出错', {
          error: error as Error,
          scanId,
          symbol,
        });
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const success = errors.length === 0;

    // 更新扫描日志
    await updateScanLog(scanId, {
      status: success ? 'completed' : 'failed',
      end_time: endTime,
      duration,
      rules_scanned: rulesScanned,
      rules_matched: rulesMatched,
      notifications_created: notificationsCreated,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        symbolsProcessed: symbols.length,
        hotStocks: await HotStocksCache.getHotStocks(5),
      },
    });

    // 更新扫描统计缓存
    await updateScanStatsCache({
      scanId,
      scanType,
      rulesScanned,
      rulesMatched,
      notificationsCreated,
      duration,
      success,
      symbolsProcessed: symbols.length,
    });

    logger.info('警报扫描完成', {
      scanId,
      scanType,
      duration,
      rulesScanned,
      rulesMatched,
      notificationsCreated,
      errorsCount: errors.length,
      success,
    });

    return {
      success,
      scanId,
      rulesScanned,
      rulesMatched,
      notificationsCreated,
      duration,
      errors,
    };
  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const errorMsg = `扫描过程中发生严重错误: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(errorMsg);

    logger.error('扫描过程中发生严重错误', { error: error as Error, scanId });

    // 更新扫描日志为失败状态
    await updateScanLog(scanId, {
      status: 'failed',
      end_time: endTime,
      duration,
      rules_scanned: rulesScanned,
      rules_matched: rulesMatched,
      notifications_created: notificationsCreated,
      errors,
    });

    // 更新扫描统计缓存（失败情况）
    await updateScanStatsCache({
      scanId,
      scanType,
      rulesScanned,
      rulesMatched,
      notificationsCreated,
      duration,
      success: false,
      symbolsProcessed: 0,
    });

    return {
      success: false,
      scanId,
      rulesScanned,
      rulesMatched,
      notificationsCreated,
      duration,
      errors,
    };
  }
}

/**
 * 警报引擎调度器
 */
class AlertEngineScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  /**
   * 启动定时扫描任务（每5分钟执行一次）
   */
  start(): void {
    if (this.cronJob) {
      logger.info('警报引擎定时任务已在运行，先停止旧任务');
      this.stop();
    }

    // 每5分钟执行一次：'*/5 * * * *'
    this.cronJob = cron.schedule(
      '*/5 * * * *',
      async () => {
        if (this.isRunning) {
          logger.info('上一次扫描仍在进行中，跳过本次扫描');
          return;
        }

        this.isRunning = true;
        try {
          await executeAlertScan('scheduled');
        } catch (error) {
          logger.error('警报引擎调度器错误', { error: error as Error });
        } finally {
          this.isRunning = false;
        }
      },
      {
        scheduled: false as any, // 不立即启动，需要手动调用start
      }
    );

    this.cronJob.start();
    logger.info('警报引擎定时任务已启动', { schedule: '*/5 * * * *' });

    // 立即执行一次扫描
    this.executeImmediately();
  }

  /**
   * 停止定时扫描任务
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
      logger.info('警报引擎定时任务已停止');
    }
  }

  /**
   * 立即执行一次扫描
   */
  async executeImmediately(): Promise<any> {
    if (this.isRunning) {
      logger.info('扫描任务正在进行中，无法立即执行');
      return { success: false, message: '扫描任务正在进行中' };
    }

    this.isRunning = true;
    try {
      const result = await executeAlertScan('manual');
      return result;
    } catch (error) {
      logger.error('立即执行扫描时发生错误', { error: error as Error });
      return { success: false, message: '执行扫描时发生错误' };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 获取调度器状态
   */
  getStatus(): { isScheduled: boolean; isRunning: boolean } {
    return {
      isScheduled: this.cronJob !== null,
      isRunning: this.isRunning,
    };
  }
}

// 全局警报引擎调度器实例
export const alertEngineScheduler = new AlertEngineScheduler();

/**
 * 启动警报引擎
 */
export function startAlertEngine(): void {
  alertEngineScheduler.start();
}

/**
 * 停止警报引擎
 */
export function stopAlertEngine(): void {
  alertEngineScheduler.stop();
}

/**
 * 手动触发扫描
 */
export async function triggerManualScan(): Promise<any> {
  return await alertEngineScheduler.executeImmediately();
}

/**
 * 获取警报引擎状态
 */
export function getAlertEngineStatus(): {
  isScheduled: boolean;
  isRunning: boolean;
} {
  return alertEngineScheduler.getStatus();
}
