import 'dart:convert';
import 'dart:math';

import '../../../core/services/network_service.dart';
import '../../../core/services/storage_service.dart';
import '../models/watchlist_model.dart';
import '../../alerts/models/alert_model.dart';

/// 自选股服务
class WatchlistService {
  final NetworkService _networkService;
  final StorageService _storageService;
  
  static const String _watchlistKey = 'user_watchlist';
  static const String _alertsKey = 'price_alerts';
  
  WatchlistService({
    required NetworkService networkService,
    required StorageService storageService,
  }) : _networkService = networkService,
       _storageService = storageService;

  /// 获取自选股列表
  Future<List<WatchlistItem>> getWatchlist() async {
    try {
      final watchlistJson = await _storageService.getString(_watchlistKey);
      if (watchlistJson == null) return [];
      
      final List<dynamic> watchlistData = json.decode(watchlistJson);
      return watchlistData
          .map((item) => WatchlistItem.fromJson(item))
          .toList();
    } catch (e) {
      throw Exception('获取自选股列表失败: $e');
    }
  }

  /// 添加到自选股
  Future<void> addToWatchlist(WatchlistItem item) async {
    try {
      final watchlist = await getWatchlist();
      
      // 检查是否已存在
      if (watchlist.any((w) => w.symbol == item.symbol)) {
        throw Exception('该股票已在自选股中');
      }
      
      watchlist.add(item);
      await _saveWatchlist(watchlist);
    } catch (e) {
      throw Exception('添加自选股失败: $e');
    }
  }

  /// 从自选股移除
  Future<void> removeFromWatchlist(String symbol) async {
    try {
      final watchlist = await getWatchlist();
      watchlist.removeWhere((item) => item.symbol == symbol);
      await _saveWatchlist(watchlist);
    } catch (e) {
      throw Exception('移除自选股失败: $e');
    }
  }

  /// 批量移除自选股
  Future<void> removeMultipleFromWatchlist(List<String> symbols) async {
    try {
      final watchlist = await getWatchlist();
      watchlist.removeWhere((item) => symbols.contains(item.symbol));
      await _saveWatchlist(watchlist);
    } catch (e) {
      throw Exception('批量移除自选股失败: $e');
    }
  }

  /// 更新自选股排序
  Future<void> updateWatchlistOrder(List<WatchlistItem> orderedList) async {
    try {
      final updatedList = orderedList.asMap().entries.map((entry) {
        return entry.value.copyWith(sortOrder: entry.key);
      }).toList();
      
      await _saveWatchlist(updatedList);
    } catch (e) {
      throw Exception('更新自选股排序失败: $e');
    }
  }

  /// 检查是否在自选股中
  Future<bool> isInWatchlist(String symbol) async {
    try {
      final watchlist = await getWatchlist();
      return watchlist.any((item) => item.symbol == symbol);
    } catch (e) {
      return false;
    }
  }

  /// 获取股票实时报价
  Future<StockQuote> getStockQuote(String symbol) async {
    try {
      // 模拟API调用，实际应用中应该调用真实的股票API
      await Future.delayed(const Duration(milliseconds: 500));
      
      final random = Random();
      final basePrice = 10.0 + random.nextDouble() * 90.0;
      final change = (random.nextDouble() - 0.5) * 2.0;
      final changePercent = (change / basePrice) * 100;
      
      return StockQuote(
        symbol: symbol,
        price: basePrice + change,
        change: change,
        changePercent: changePercent,
        open: basePrice + (random.nextDouble() - 0.5) * 1.0,
        high: basePrice + random.nextDouble() * 2.0,
        low: basePrice - random.nextDouble() * 2.0,
        previousClose: basePrice,
        volume: random.nextInt(1000000) + 100000,
        updateTime: DateTime.now(),
      );
    } catch (e) {
      throw Exception('获取股票报价失败: $e');
    }
  }

  /// 获取多个股票报价
  Future<Map<String, StockQuote>> getMultipleStockQuotes(List<String> symbols) async {
    try {
      final Map<String, StockQuote> quotes = {};
      
      // 并发获取所有股票报价
      final futures = symbols.map((symbol) => getStockQuote(symbol));
      final results = await Future.wait(futures);
      
      for (int i = 0; i < symbols.length; i++) {
        quotes[symbols[i]] = results[i];
      }
      
      return quotes;
    } catch (e) {
      throw Exception('获取股票报价失败: $e');
    }
  }

  /// 获取价格提醒列表
  Future<List<PriceAlert>> getPriceAlerts() async {
    try {
      final alertsJson = await _storageService.getString(_alertsKey);
      if (alertsJson == null) return [];
      
      final List<dynamic> alertsData = json.decode(alertsJson);
      return alertsData
          .map((item) => PriceAlert.fromJson(item))
          .toList();
    } catch (e) {
      throw Exception('获取价格提醒失败: $e');
    }
  }

  /// 添加价格提醒
  Future<void> addPriceAlert(PriceAlert alert) async {
    try {
      final alerts = await getPriceAlerts();
      alerts.add(alert);
      await _savePriceAlerts(alerts);
    } catch (e) {
      throw Exception('添加价格提醒失败: $e');
    }
  }

  /// 删除价格提醒
  Future<void> removePriceAlert(String alertId) async {
    try {
      final alerts = await getPriceAlerts();
      alerts.removeWhere((alert) => alert.id == alertId);
      await _savePriceAlerts(alerts);
    } catch (e) {
      throw Exception('删除价格提醒失败: $e');
    }
  }

  /// 更新价格提醒
  Future<void> updatePriceAlert(PriceAlert updatedAlert) async {
    try {
      final alerts = await getPriceAlerts();
      final index = alerts.indexWhere((alert) => alert.id == updatedAlert.id);
      
      if (index != -1) {
        alerts[index] = updatedAlert;
        await _savePriceAlerts(alerts);
      } else {
        throw Exception('未找到要更新的提醒');
      }
    } catch (e) {
      throw Exception('更新价格提醒失败: $e');
    }
  }

  /// 检查价格提醒
  Future<List<PriceAlert>> checkPriceAlerts() async {
    try {
      final alerts = await getPriceAlerts();
      final activeAlerts = alerts.where((alert) => 
          alert.isEnabled && alert.triggeredAt == null).toList();
      
      if (activeAlerts.isEmpty) return [];
      
      final symbols = activeAlerts.map((alert) => alert.symbol).toSet().toList();
      final quotes = await getMultipleStockQuotes(symbols);
      
      final triggeredAlerts = <PriceAlert>[];
      
      for (final alert in activeAlerts) {
        final quote = quotes[alert.symbol];
        if (quote == null) continue;
        
        bool shouldTrigger = false;
        
        switch (alert.type) {
          case AlertType.priceUp:
            shouldTrigger = quote.price >= alert.targetPrice;
            break;
          case AlertType.priceDown:
            shouldTrigger = quote.price <= alert.targetPrice;
            break;
          case AlertType.changeUp:
            shouldTrigger = quote.changePercent >= alert.targetPrice;
            break;
          case AlertType.changeDown:
            shouldTrigger = quote.changePercent <= -alert.targetPrice;
            break;
        }
        
        if (shouldTrigger) {
          final triggeredAlert = alert.copyWith(
            triggeredAt: DateTime.now(),
            currentPrice: quote.price,
          );
          triggeredAlerts.add(triggeredAlert);
          
          // 更新提醒状态
          await updatePriceAlert(triggeredAlert);
        }
      }
      
      return triggeredAlerts;
    } catch (e) {
      throw Exception('检查价格提醒失败: $e');
    }
  }

  /// 保存自选股列表
  Future<void> _saveWatchlist(List<WatchlistItem> watchlist) async {
    final watchlistJson = json.encode(
      watchlist.map((item) => item.toJson()).toList(),
    );
    await _storageService.setString(_watchlistKey, watchlistJson);
  }

  /// 保存价格提醒列表
  Future<void> _savePriceAlerts(List<PriceAlert> alerts) async {
    final alertsJson = json.encode(
      alerts.map((alert) => alert.toJson()).toList(),
    );
    await _storageService.setString(_alertsKey, alertsJson);
  }
}