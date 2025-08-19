import 'package:dio/dio.dart';
import 'dart:math';

import '../models/stock_model.dart';

class StockService {
  final Dio _dio = Dio();
  
  // 获取股票详情
  Future<StockModel> getStockDetail(String symbol) async {
    try {
      // 模拟API调用，实际应用中应该调用真实的股票API
      await Future.delayed(const Duration(milliseconds: 500));
      
      // 生成模拟数据
      final random = Random();
      final basePrice = 10 + random.nextDouble() * 90; // 10-100之间的基础价格
      final change = (random.nextDouble() - 0.5) * 2; // -1到1之间的变化
      final changePercent = (change / basePrice) * 100;
      
      return StockModel(
        symbol: symbol,
        name: _getStockName(symbol),
        currentPrice: basePrice + change,
        change: change,
        changePercent: changePercent,
        open: basePrice + (random.nextDouble() - 0.5),
        high: basePrice + random.nextDouble() * 2,
        low: basePrice - random.nextDouble() * 2,
        previousClose: basePrice,
        volume: (random.nextInt(1000000) + 100000),
        marketCap: (basePrice + change) * (random.nextInt(1000000) + 1000000),
        pe: 10 + random.nextDouble() * 20,
        pb: 1 + random.nextDouble() * 3,
        updateTime: DateTime.now().toString(),
      );
    } catch (e) {
      throw Exception('获取股票详情失败: $e');
    }
  }
  
  // 获取K线数据
  Future<List<KLineData>> getKlineData(String symbol, ChartPeriod period) async {
    try {
      await Future.delayed(const Duration(milliseconds: 300));
      
      final random = Random();
      final basePrice = 50.0;
      final dataPoints = _getDataPointsCount(period);
      final klineData = <KLineData>[];
      
      double currentPrice = basePrice;
      
      for (int i = 0; i < dataPoints; i++) {
        final open = currentPrice;
        final change = (random.nextDouble() - 0.5) * 4; // -2到2之间的变化
        final close = open + change;
        final high = [open, close].reduce((a, b) => a > b ? a : b) + random.nextDouble() * 2;
        final low = [open, close].reduce((a, b) => a < b ? a : b) - random.nextDouble() * 2;
        final volume = random.nextInt(1000000) + 100000;
        
        klineData.add(KLineData(
          time: _getTimeForIndex(i, period),
          open: open,
          high: high,
          low: low,
          close: close,
          volume: volume,
        ));
        
        currentPrice = close;
      }
      
      return klineData;
    } catch (e) {
      throw Exception('获取K线数据失败: $e');
    }
  }
  
  // 获取技术指标
  Future<List<TechnicalIndicator>> getTechnicalIndicators(
    String symbol,
    ChartPeriod period,
    List<IndicatorType> indicators,
  ) async {
    try {
      await Future.delayed(const Duration(milliseconds: 200));
      
      final klineData = await getKlineData(symbol, period);
      final result = <TechnicalIndicator>[];
      
      for (final indicator in indicators) {
        switch (indicator) {
          case IndicatorType.ma5:
            result.add(_calculateMA(klineData, 5, indicator));
            break;
          case IndicatorType.ma10:
            result.add(_calculateMA(klineData, 10, indicator));
            break;
          case IndicatorType.ma20:
            result.add(_calculateMA(klineData, 20, indicator));
            break;
          case IndicatorType.ma60:
            result.add(_calculateMA(klineData, 60, indicator));
            break;
          case IndicatorType.macd:
            result.add(_calculateMACD(klineData, indicator));
            break;
          case IndicatorType.kdj:
          case IndicatorType.rsi:
            // 简化实现，实际应用中需要完整的技术指标计算
            result.add(TechnicalIndicator(
              name: indicator.displayName,
              values: List.generate(klineData.length, (i) => 50.0),
              color: indicator.color,
            ));
            break;
        }
      }
      
      return result;
    } catch (e) {
      throw Exception('获取技术指标失败: $e');
    }
  }
  
  // 计算移动平均线
  TechnicalIndicator _calculateMA(List<KLineData> data, int period, IndicatorType type) {
    final values = <double>[];
    
    for (int i = 0; i < data.length; i++) {
      if (i < period - 1) {
        values.add(0); // 数据不足时填充0
      } else {
        double sum = 0;
        for (int j = i - period + 1; j <= i; j++) {
          sum += data[j].close;
        }
        values.add(sum / period);
      }
    }
    
    return TechnicalIndicator(
      name: type.displayName,
      values: values,
      color: type.color,
    );
  }
  
  // 计算MACD（简化版本）
  TechnicalIndicator _calculateMACD(List<KLineData> data, IndicatorType type) {
    // 简化的MACD计算，实际应用中需要更复杂的算法
    final values = data.map((d) => d.close * 0.1).toList().cast<double>();
    
    return TechnicalIndicator(
      name: type.displayName,
      values: values,
      color: type.color,
    );
  }
  
  // 获取股票名称（模拟数据）
  String _getStockName(String symbol) {
    final names = {
      '000001': '平安银行',
      '000002': '万科A',
      '600000': '浦发银行',
      '600036': '招商银行',
      '000858': '五粮液',
      'AAPL': '苹果公司',
      'TSLA': '特斯拉',
      'MSFT': '微软',
    };
    return names[symbol] ?? symbol;
  }
  
  // 获取数据点数量
  int _getDataPointsCount(ChartPeriod period) {
    switch (period) {
      case ChartPeriod.minute:
        return 240; // 4小时的分钟数据
      case ChartPeriod.daily:
        return 120; // 120天的日线数据
      case ChartPeriod.weekly:
        return 52; // 52周的周线数据
      case ChartPeriod.monthly:
        return 24; // 24个月的月线数据
    }
  }
  
  // 根据索引获取时间
  DateTime _getTimeForIndex(int index, ChartPeriod period) {
    final now = DateTime.now();
    
    switch (period) {
      case ChartPeriod.minute:
        return now.subtract(Duration(minutes: 240 - index));
      case ChartPeriod.daily:
        return now.subtract(Duration(days: 120 - index));
      case ChartPeriod.weekly:
        return now.subtract(Duration(days: (52 - index) * 7));
      case ChartPeriod.monthly:
        return DateTime(now.year, now.month - (24 - index), now.day);
    }
  }
}