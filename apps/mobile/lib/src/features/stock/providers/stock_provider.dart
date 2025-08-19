import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../models/stock_model.dart';
import '../services/stock_service.dart';

// 股票服务提供者
final stockServiceProvider = Provider<StockService>((ref) {
  return StockService();
});

// 股票详情提供者
final stockDetailProvider = FutureProvider.family<StockModel, String>((ref, symbol) async {
  final service = ref.read(stockServiceProvider);
  return await service.getStockDetail(symbol);
});

// K线数据提供者
final klineDataProvider = FutureProvider.family<List<KLineData>, KlineParams>((ref, params) async {
  final service = ref.read(stockServiceProvider);
  return await service.getKlineData(params.symbol, params.period);
});

// 技术指标提供者
final technicalIndicatorProvider = FutureProvider.family<List<TechnicalIndicator>, IndicatorParams>((ref, params) async {
  final service = ref.read(stockServiceProvider);
  return await service.getTechnicalIndicators(params.symbol, params.period, params.indicators);
});

// 自选股列表提供者
final watchlistProvider = StateNotifierProvider<WatchlistNotifier, List<String>>((ref) {
  return WatchlistNotifier();
});

// 自选股状态管理
class WatchlistNotifier extends StateNotifier<List<String>> {
  WatchlistNotifier() : super([]);
  
  void addToWatchlist(String symbol) {
    if (!state.contains(symbol)) {
      state = [...state, symbol];
    }
  }
  
  void removeFromWatchlist(String symbol) {
    state = state.where((s) => s != symbol).toList();
  }
  
  bool isInWatchlist(String symbol) {
    return state.contains(symbol);
  }
}

// 参数类
class KlineParams {
  final String symbol;
  final ChartPeriod period;
  
  KlineParams({required this.symbol, required this.period});
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is KlineParams &&
        other.symbol == symbol &&
        other.period == period;
  }
  
  @override
  int get hashCode => symbol.hashCode ^ period.hashCode;
}

class IndicatorParams {
  final String symbol;
  final ChartPeriod period;
  final List<IndicatorType> indicators;
  
  IndicatorParams({
    required this.symbol,
    required this.period,
    required this.indicators,
  });
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is IndicatorParams &&
        other.symbol == symbol &&
        other.period == period &&
        _listEquals(other.indicators, indicators);
  }
  
  @override
  int get hashCode => symbol.hashCode ^ period.hashCode ^ indicators.hashCode;
  
  bool _listEquals<T>(List<T> a, List<T> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}