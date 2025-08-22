import 'dart:async';
import 'dart:convert';

import '../../../core/services/cache_service.dart';
import '../../../core/utils/logger.dart';
import '../models/stock_model.dart';
import '../models/stock_quote_model.dart';
import '../models/stock_chart_data_model.dart';

/// 股票数据缓存策略
enum StockCacheStrategy {
  /// 实时数据 - 30秒缓存
  realtime,
  /// 分钟级数据 - 1分钟缓存
  minute,
  /// 小时级数据 - 5分钟缓存
  hourly,
  /// 日级数据 - 30分钟缓存
  daily,
  /// 基础信息 - 1小时缓存
  basic,
  /// 历史数据 - 24小时缓存
  historical,
}

/// 股票数据缓存服务
class StockCacheService {
  final CacheService _cacheService;
  static const String _category = 'stock';
  
  // 缓存策略配置
  static const Map<StockCacheStrategy, Duration> _cacheDurations = {
    StockCacheStrategy.realtime: Duration(seconds: 30),
    StockCacheStrategy.minute: Duration(minutes: 1),
    StockCacheStrategy.hourly: Duration(minutes: 5),
    StockCacheStrategy.daily: Duration(minutes: 30),
    StockCacheStrategy.basic: Duration(hours: 1),
    StockCacheStrategy.historical: Duration(hours: 24),
  };

  StockCacheService(this._cacheService);

  /// 获取缓存TTL
  Duration _getTtl(StockCacheStrategy strategy) {
    return _cacheDurations[strategy] ?? const Duration(minutes: 5);
  }

  /// 生成股票报价缓存键
  String _getQuoteKey(String symbol) => 'quote:$symbol';

  /// 生成股票基础信息缓存键
  String _getStockInfoKey(String symbol) => 'info:$symbol';

  /// 生成图表数据缓存键
  String _getChartDataKey(String symbol, String period, String interval) {
    return 'chart:$symbol:$period:$interval';
  }

  /// 生成股票列表缓存键
  String _getStockListKey(String listType, {Map<String, String>? params}) {
    final paramStr = params?.entries
        .map((e) => '${e.key}=${e.value}')
        .join('&') ?? '';
    return 'list:$listType${paramStr.isNotEmpty ? ':$paramStr' : ''}';
  }

  /// 生成搜索结果缓存键
  String _getSearchKey(String query) => 'search:${query.toLowerCase()}';

  // ==========================================================================
  // 股票报价缓存
  // ==========================================================================

  /// 缓存股票报价
  Future<void> cacheQuote(
    String symbol,
    StockQuoteModel quote, {
    StockCacheStrategy strategy = StockCacheStrategy.realtime,
  }) async {
    try {
      final key = _getQuoteKey(symbol);
      await _cacheService.set(
        key,
        quote.toJson(),
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(quote.toJson()),
      );
      Logger.d('股票报价已缓存: $symbol');
    } catch (e) {
      Logger.e('缓存股票报价失败: $e');
    }
  }

  /// 获取缓存的股票报价
  Future<StockQuoteModel?> getCachedQuote(String symbol) async {
    try {
      final key = _getQuoteKey(symbol);
      final data = await _cacheService.get<Map<String, dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('股票报价缓存命中: $symbol');
        return StockQuoteModel.fromJson(data);
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存股票报价失败: $e');
      return null;
    }
  }

  /// 批量缓存股票报价
  Future<void> cacheMultipleQuotes(
    Map<String, StockQuoteModel> quotes, {
    StockCacheStrategy strategy = StockCacheStrategy.realtime,
  }) async {
    final futures = quotes.entries.map((entry) => 
      cacheQuote(entry.key, entry.value, strategy: strategy)
    );
    await Future.wait(futures);
  }

  /// 批量获取缓存的股票报价
  Future<Map<String, StockQuoteModel?>> getCachedMultipleQuotes(
    List<String> symbols,
  ) async {
    final result = <String, StockQuoteModel?>{};
    
    for (final symbol in symbols) {
      result[symbol] = await getCachedQuote(symbol);
    }
    
    return result;
  }

  // ==========================================================================
  // 股票基础信息缓存
  // ==========================================================================

  /// 缓存股票基础信息
  Future<void> cacheStockInfo(
    String symbol,
    StockModel stock, {
    StockCacheStrategy strategy = StockCacheStrategy.basic,
  }) async {
    try {
      final key = _getStockInfoKey(symbol);
      await _cacheService.set(
        key,
        stock.toJson(),
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(stock.toJson()),
      );
      Logger.d('股票基础信息已缓存: $symbol');
    } catch (e) {
      Logger.e('缓存股票基础信息失败: $e');
    }
  }

  /// 获取缓存的股票基础信息
  Future<StockModel?> getCachedStockInfo(String symbol) async {
    try {
      final key = _getStockInfoKey(symbol);
      final data = await _cacheService.get<Map<String, dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('股票基础信息缓存命中: $symbol');
        return StockModel.fromJson(data);
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存股票基础信息失败: $e');
      return null;
    }
  }

  // ==========================================================================
  // 图表数据缓存
  // ==========================================================================

  /// 缓存图表数据
  Future<void> cacheChartData(
    String symbol,
    String period,
    String interval,
    StockChartDataModel chartData, {
    StockCacheStrategy? strategy,
  }) async {
    try {
      // 根据时间间隔选择缓存策略
      strategy ??= _getChartCacheStrategy(interval);
      
      final key = _getChartDataKey(symbol, period, interval);
      await _cacheService.set(
        key,
        chartData.toJson(),
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(chartData.toJson()),
      );
      Logger.d('图表数据已缓存: $symbol ($period, $interval)');
    } catch (e) {
      Logger.e('缓存图表数据失败: $e');
    }
  }

  /// 获取缓存的图表数据
  Future<StockChartDataModel?> getCachedChartData(
    String symbol,
    String period,
    String interval,
  ) async {
    try {
      final key = _getChartDataKey(symbol, period, interval);
      final data = await _cacheService.get<Map<String, dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('图表数据缓存命中: $symbol ($period, $interval)');
        return StockChartDataModel.fromJson(data);
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存图表数据失败: $e');
      return null;
    }
  }

  /// 根据时间间隔获取图表缓存策略
  StockCacheStrategy _getChartCacheStrategy(String interval) {
    switch (interval.toLowerCase()) {
      case '1m':
      case '5m':
        return StockCacheStrategy.minute;
      case '15m':
      case '30m':
      case '1h':
        return StockCacheStrategy.hourly;
      case '1d':
      case '1w':
        return StockCacheStrategy.daily;
      default:
        return StockCacheStrategy.historical;
    }
  }

  // ==========================================================================
  // 股票列表缓存
  // ==========================================================================

  /// 缓存股票列表
  Future<void> cacheStockList(
    String listType,
    List<StockModel> stocks, {
    Map<String, String>? params,
    StockCacheStrategy strategy = StockCacheStrategy.daily,
  }) async {
    try {
      final key = _getStockListKey(listType, params: params);
      final data = stocks.map((stock) => stock.toJson()).toList();
      
      await _cacheService.set(
        key,
        data,
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(data),
      );
      Logger.d('股票列表已缓存: $listType (${stocks.length}条)');
    } catch (e) {
      Logger.e('缓存股票列表失败: $e');
    }
  }

  /// 获取缓存的股票列表
  Future<List<StockModel>?> getCachedStockList(
    String listType, {
    Map<String, String>? params,
  }) async {
    try {
      final key = _getStockListKey(listType, params: params);
      final data = await _cacheService.get<List<dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('股票列表缓存命中: $listType');
        return data
            .map((item) => StockModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存股票列表失败: $e');
      return null;
    }
  }

  // ==========================================================================
  // 搜索结果缓存
  // ==========================================================================

  /// 缓存搜索结果
  Future<void> cacheSearchResults(
    String query,
    List<StockModel> results, {
    StockCacheStrategy strategy = StockCacheStrategy.hourly,
  }) async {
    try {
      final key = _getSearchKey(query);
      final data = results.map((stock) => stock.toJson()).toList();
      
      await _cacheService.set(
        key,
        data,
        category: _category,
        ttl: _getTtl(strategy),
        etag: _generateEtag(data),
      );
      Logger.d('搜索结果已缓存: $query (${results.length}条)');
    } catch (e) {
      Logger.e('缓存搜索结果失败: $e');
    }
  }

  /// 获取缓存的搜索结果
  Future<List<StockModel>?> getCachedSearchResults(String query) async {
    try {
      final key = _getSearchKey(query);
      final data = await _cacheService.get<List<dynamic>>(
        key,
        category: _category,
      );
      
      if (data != null) {
        Logger.d('搜索结果缓存命中: $query');
        return data
            .map((item) => StockModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      }
      
      return null;
    } catch (e) {
      Logger.e('获取缓存搜索结果失败: $e');
      return null;
    }
  }

  // ==========================================================================
  // 缓存管理
  // ==========================================================================

  /// 预热缓存 - 预加载热门股票数据
  Future<void> warmupCache(List<String> popularSymbols) async {
    try {
      Logger.d('开始预热股票缓存，股票数量: ${popularSymbols.length}');
      
      // 这里可以预加载一些基础数据
      // 实际实现中，可以调用相应的API来获取数据并缓存
      
      Logger.d('股票缓存预热完成');
    } catch (e) {
      Logger.e('股票缓存预热失败: $e');
    }
  }

  /// 清理过期的股票缓存
  Future<void> cleanupExpiredCache() async {
    try {
      // CacheService会自动清理过期缓存
      Logger.d('股票缓存清理完成');
    } catch (e) {
      Logger.e('股票缓存清理失败: $e');
    }
  }

  /// 清空所有股票缓存
  Future<void> clearAllCache() async {
    try {
      await _cacheService.clear(category: _category);
      Logger.d('所有股票缓存已清空');
    } catch (e) {
      Logger.e('清空股票缓存失败: $e');
    }
  }

  /// 清空特定股票的缓存
  Future<void> clearStockCache(String symbol) async {
    try {
      await Future.wait([
        _cacheService.delete(_getQuoteKey(symbol), category: _category),
        _cacheService.delete(_getStockInfoKey(symbol), category: _category),
      ]);
      Logger.d('股票缓存已清空: $symbol');
    } catch (e) {
      Logger.e('清空股票缓存失败: $e');
    }
  }

  /// 获取股票缓存统计信息
  Future<Map<String, dynamic>> getCacheStats() async {
    try {
      final stats = _cacheService.getStats();
      return {
        'category': _category,
        'totalEntries': stats.totalEntries,
        'hitRate': stats.hitRate,
        'totalSize': stats.totalSize,
        'lastCleanup': stats.lastCleanup.toIso8601String(),
      };
    } catch (e) {
      Logger.e('获取股票缓存统计失败: $e');
      return {};
    }
  }

  /// 检查缓存是否存在
  Future<bool> isCached(
    String key, {
    String? symbol,
    String? period,
    String? interval,
  }) async {
    try {
      String cacheKey;
      if (symbol != null && period != null && interval != null) {
        cacheKey = _getChartDataKey(symbol, period, interval);
      } else if (symbol != null) {
        cacheKey = _getQuoteKey(symbol);
      } else {
        cacheKey = key;
      }
      
      return await _cacheService.exists(cacheKey, category: _category);
    } catch (e) {
      Logger.e('检查缓存存在性失败: $e');
      return false;
    }
  }

  /// 生成ETag
  String _generateEtag(dynamic data) {
    try {
      final jsonString = jsonEncode(data);
      return jsonString.hashCode.toString();
    } catch (e) {
      return DateTime.now().millisecondsSinceEpoch.toString();
    }
  }

  /// 获取缓存条目详细信息
  Future<CacheEntry?> getCacheEntry(
    String symbol, {
    String? period,
    String? interval,
  }) async {
    try {
      String key;
      if (period != null && interval != null) {
        key = _getChartDataKey(symbol, period, interval);
      } else {
        key = _getQuoteKey(symbol);
      }
      
      return await _cacheService.getEntry(key, category: _category);
    } catch (e) {
      Logger.e('获取缓存条目失败: $e');
      return null;
    }
  }
}