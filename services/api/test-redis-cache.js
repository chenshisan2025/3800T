// 使用动态导入来支持TypeScript模块
const {
  StockPriceCache,
  ScanStatsCache,
  HotStocksCache,
  PerformanceCache,
} = require('./src/lib/redis.ts');

async function testRedisCacheFunctions() {
  console.log('🧪 开始测试Redis缓存功能...');

  try {
    // 测试股价缓存
    console.log('\n📈 测试股价缓存功能:');
    await StockPriceCache.set('AAPL', { price: 150.25, timestamp: Date.now() });
    const stockPrice = await StockPriceCache.get('AAPL');
    console.log('✅ 股价缓存设置和获取成功:', stockPrice);

    // 批量设置股价
    const stockPrices = {
      TSLA: { price: 250.5, timestamp: Date.now() },
      GOOGL: { price: 2800.75, timestamp: Date.now() },
      MSFT: { price: 350.3, timestamp: Date.now() },
    };
    await StockPriceCache.setBatch(stockPrices);
    console.log('✅ 批量股价缓存设置成功');

    // 测试扫描统计缓存
    console.log('\n📊 测试扫描统计缓存功能:');
    const scanStats = {
      totalScans: 10,
      successfulScans: 8,
      failedScans: 2,
      lastScanTime: new Date().toISOString(),
    };
    await ScanStatsCache.set('overall', scanStats);
    const retrievedStats = await ScanStatsCache.get('overall');
    console.log('✅ 扫描统计缓存设置和获取成功:', retrievedStats);

    // 测试增量更新
    await ScanStatsCache.increment('overall', 'totalScans', 1);
    await ScanStatsCache.increment('overall', 'successfulScans', 1);
    const updatedStats = await ScanStatsCache.get('overall');
    console.log('✅ 扫描统计增量更新成功:', updatedStats);

    // 测试每日统计
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = {
      date: today,
      totalScans: 5,
      successfulScans: 4,
      failedScans: 1,
    };
    await ScanStatsCache.setDaily(today, dailyStats);
    const retrievedDailyStats = await ScanStatsCache.getDaily(today);
    console.log('✅ 每日统计缓存设置和获取成功:', retrievedDailyStats);

    // 测试热门股票缓存
    console.log('\n🔥 测试热门股票缓存功能:');
    await HotStocksCache.addHotStock('AAPL');
    await HotStocksCache.addHotStock('TSLA');
    await HotStocksCache.addHotStock('GOOGL');
    await HotStocksCache.addHotStock('AAPL'); // 重复添加，应该增加分数
    const hotStocks = await HotStocksCache.getHotStocks(10);
    console.log('✅ 热门股票缓存功能成功:', hotStocks);

    // 测试性能监控缓存
    console.log('\n⚡ 测试性能监控缓存功能:');
    await PerformanceCache.recordMetric('cache_hit_time', 5.2);
    await PerformanceCache.recordMetric('cache_hit_time', 3.8);
    await PerformanceCache.recordMetric('api_call_time', 120.5);
    await PerformanceCache.recordMetric('api_call_time', 95.3);
    await PerformanceCache.recordMetric('scan_duration', 2500);
    await PerformanceCache.recordMetric('match_rate', 0.15);

    const performance = await PerformanceCache.getMetrics();
    console.log('✅ 性能监控缓存功能成功:', performance);

    // 测试获取最近N天的统计
    console.log('\n📅 测试最近N天统计功能:');
    const recentStats = await ScanStatsCache.getRecentDays(7);
    console.log('✅ 最近7天统计获取成功:', recentStats);

    console.log('\n🎉 所有Redis缓存功能测试完成！');
  } catch (error) {
    console.error('❌ Redis缓存功能测试失败:', error.message);
    console.error('错误详情:', error.stack);
    process.exit(1);
  }
}

testRedisCacheFunctions();
