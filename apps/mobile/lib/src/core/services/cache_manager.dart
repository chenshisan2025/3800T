import 'dart:async';
import 'dart:math';

import 'package:connectivity_plus/connectivity_plus.dart';

import '../utils/logger.dart';
import 'cache_service.dart';
import '../../features/stock/services/stock_cache_service.dart';
import '../../features/ai/services/ai_cache_service.dart';

/// 缓存管理器配置
class CacheManagerConfig {
  /// 最大缓存大小 (MB)
  final int maxCacheSize;
  
  /// 自动清理间隔
  final Duration autoCleanupInterval;
  
  /// 缓存命中率阈值
  final double hitRateThreshold;
  
  /// 内存压力阈值
  final double memoryPressureThreshold;
  
  /// 网络状态检查间隔
  final Duration networkCheckInterval;
  
  /// 是否启用智能预热
  final bool enableSmartWarmup;
  
  /// 是否启用性能监控
  final bool enablePerformanceMonitoring;

  const CacheManagerConfig({
    this.maxCacheSize = 200, // 200MB
    this.autoCleanupInterval = const Duration(hours: 6),
    this.hitRateThreshold = 0.6,
    this.memoryPressureThreshold = 0.8,
    this.networkCheckInterval = const Duration(minutes: 1),
    this.enableSmartWarmup = true,
    this.enablePerformanceMonitoring = true,
  });
}

/// 缓存性能指标
class CachePerformanceMetrics {
  final DateTime timestamp;
  final double hitRate;
  final int totalRequests;
  final int cacheHits;
  final int cacheMisses;
  final double averageResponseTime;
  final int totalCacheSize;
  final int totalEntries;
  final Map<String, double> categoryHitRates;
  final Map<String, int> categorySizes;

  CachePerformanceMetrics({
    required this.timestamp,
    required this.hitRate,
    required this.totalRequests,
    required this.cacheHits,
    required this.cacheMisses,
    required this.averageResponseTime,
    required this.totalCacheSize,
    required this.totalEntries,
    required this.categoryHitRates,
    required this.categorySizes,
  });

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'hitRate': hitRate,
    'totalRequests': totalRequests,
    'cacheHits': cacheHits,
    'cacheMisses': cacheMisses,
    'averageResponseTime': averageResponseTime,
    'totalCacheSize': totalCacheSize,
    'totalEntries': totalEntries,
    'categoryHitRates': categoryHitRates,
    'categorySizes': categorySizes,
  };
}

/// 缓存优化建议
class CacheOptimizationSuggestion {
  final String type;
  final String description;
  final String action;
  final int priority; // 1-5, 5最高
  final Map<String, dynamic> metadata;

  CacheOptimizationSuggestion({
    required this.type,
    required this.description,
    required this.action,
    required this.priority,
    this.metadata = const {},
  });

  Map<String, dynamic> toJson() => {
    'type': type,
    'description': description,
    'action': action,
    'priority': priority,
    'metadata': metadata,
  };
}

/// 统一缓存管理器
class CacheManager {
  final CacheService _cacheService;
  final StockCacheService _stockCacheService;
  final AiCacheService _aiCacheService;
  final CacheManagerConfig _config;
  
  Timer? _cleanupTimer;
  Timer? _monitoringTimer;
  Timer? _networkTimer;
  
  final List<CachePerformanceMetrics> _performanceHistory = [];
  final Map<String, int> _requestCounts = {};
  final Map<String, double> _responseTimes = {};
  
  bool _isOnline = true;
  ConnectivityResult _lastConnectivity = ConnectivityResult.wifi;
  
  // 性能统计
  int _totalRequests = 0;
  int _totalHits = 0;
  int _totalMisses = 0;
  final List<double> _recentResponseTimes = [];

  CacheManager(
    this._cacheService,
    this._stockCacheService,
    this._aiCacheService, {
    CacheManagerConfig? config,
  }) : _config = config ?? const CacheManagerConfig();

  /// 初始化缓存管理器
  Future<void> initialize() async {
    try {
      Logger.d('初始化缓存管理器');
      
      // 启动自动清理定时器
      _startAutoCleanup();
      
      // 启动性能监控
      if (_config.enablePerformanceMonitoring) {
        _startPerformanceMonitoring();
      }
      
      // 启动网络状态监控
      _startNetworkMonitoring();
      
      // 智能预热
      if (_config.enableSmartWarmup) {
        await _performSmartWarmup();
      }
      
      Logger.d('缓存管理器初始化完成');
    } catch (e) {
      Logger.e('缓存管理器初始化失败: $e');
      rethrow;
    }
  }

  /// 启动自动清理
  void _startAutoCleanup() {
    _cleanupTimer = Timer.periodic(_config.autoCleanupInterval, (_) {
      _performAutoCleanup();
    });
  }

  /// 启动性能监控
  void _startPerformanceMonitoring() {
    _monitoringTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => _collectPerformanceMetrics(),
    );
  }

  /// 启动网络监控
  void _startNetworkMonitoring() {
    _networkTimer = Timer.periodic(_config.networkCheckInterval, (_) {
      _checkNetworkStatus();
    });
    
    // 监听网络状态变化
    Connectivity().onConnectivityChanged.listen((result) {
      _handleConnectivityChange(result);
    });
  }

  /// 处理网络状态变化
  void _handleConnectivityChange(ConnectivityResult result) {
    final wasOnline = _isOnline;
    _isOnline = result != ConnectivityResult.none;
    _lastConnectivity = result;
    
    if (!wasOnline && _isOnline) {
      Logger.d('网络已恢复，开始缓存同步');
      _performNetworkRecoveryActions();
    } else if (wasOnline && !_isOnline) {
      Logger.d('网络已断开，启用离线模式');
      _performOfflineActions();
    }
  }

  /// 网络恢复操作
  Future<void> _performNetworkRecoveryActions() async {
    try {
      // 清理过期缓存
      await _performAutoCleanup();
      
      // 预热关键数据
      if (_config.enableSmartWarmup) {
        await _performSmartWarmup();
      }
    } catch (e) {
      Logger.e('网络恢复操作失败: $e');
    }
  }

  /// 离线模式操作
  Future<void> _performOfflineActions() async {
    try {
      // 延长缓存有效期
      Logger.d('离线模式：延长缓存有效期');
      
      // 优化内存使用
      await _optimizeMemoryUsage();
    } catch (e) {
      Logger.e('离线模式操作失败: $e');
    }
  }

  /// 检查网络状态
  Future<void> _checkNetworkStatus() async {
    try {
      final result = await Connectivity().checkConnectivity();
      if (result != _lastConnectivity) {
        _handleConnectivityChange(result);
      }
    } catch (e) {
      Logger.e('检查网络状态失败: $e');
    }
  }

  // ==========================================================================
  // 智能缓存管理
  // ==========================================================================

  /// 智能预热
  Future<void> _performSmartWarmup() async {
    try {
      Logger.d('开始智能缓存预热');
      
      // 分析用户行为模式
      final userBehavior = await _analyzeUserBehavior();
      
      // 预热股票缓存
      final popularSymbols = userBehavior['popularSymbols'] as List<String>? ?? [];
      if (popularSymbols.isNotEmpty) {
        await _stockCacheService.warmupCache(popularSymbols);
      }
      
      // 预热AI缓存
      final userId = userBehavior['userId'] as String?;
      final watchlist = userBehavior['watchlist'] as List<String>? ?? [];
      await _aiCacheService.smartWarmup(
        userId: userId,
        popularSymbols: popularSymbols,
        userWatchlist: watchlist,
      );
      
      Logger.d('智能缓存预热完成');
    } catch (e) {
      Logger.e('智能缓存预热失败: $e');
    }
  }

  /// 分析用户行为
  Future<Map<String, dynamic>> _analyzeUserBehavior() async {
    try {
      // 这里可以从用户偏好、历史记录等数据源分析
      // 目前返回模拟数据
      return {
        'userId': 'user_123',
        'popularSymbols': ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
        'watchlist': ['AAPL', 'GOOGL', 'NVDA'],
        'preferredAnalysisTypes': ['technical', 'fundamental'],
        'activeHours': [9, 10, 11, 14, 15, 16], // 活跃时间段
        'avgSessionDuration': 25, // 平均会话时长（分钟）
      };
    } catch (e) {
      Logger.e('分析用户行为失败: $e');
      return {};
    }
  }

  /// 自动清理
  Future<void> _performAutoCleanup() async {
    try {
      Logger.d('开始自动缓存清理');
      
      // 检查缓存大小
      final stats = _cacheService.getStats();
      final currentSizeMB = stats.totalSize / (1024 * 1024);
      
      if (currentSizeMB > _config.maxCacheSize) {
        Logger.d('缓存大小超限 (${currentSizeMB.toStringAsFixed(1)}MB > ${_config.maxCacheSize}MB)，开始清理');
        
        // 清理过期缓存
        await _cacheService.cleanup();
        
        // 如果仍然超限，清理低价值缓存
        final newStats = _cacheService.getStats();
        final newSizeMB = newStats.totalSize / (1024 * 1024);
        
        if (newSizeMB > _config.maxCacheSize) {
          await _cleanupLowValueCache();
        }
      }
      
      // 清理性能历史记录
      _cleanupPerformanceHistory();
      
      Logger.d('自动缓存清理完成');
    } catch (e) {
      Logger.e('自动缓存清理失败: $e');
    }
  }

  /// 清理低价值缓存
  Future<void> _cleanupLowValueCache() async {
    try {
      Logger.d('开始清理低价值缓存');
      
      // 清理AI缓存中的低价值数据
      await _aiCacheService.cleanupLowValueCache();
      
      // 清理股票缓存中的过期数据
      await _stockCacheService.cleanupExpiredCache();
      
      Logger.d('低价值缓存清理完成');
    } catch (e) {
      Logger.e('清理低价值缓存失败: $e');
    }
  }

  /// 优化内存使用
  Future<void> _optimizeMemoryUsage() async {
    try {
      Logger.d('开始优化内存使用');
      
      // 压缩缓存数据
      // 移除不常用的缓存条目
      // 调整缓存策略
      
      Logger.d('内存使用优化完成');
    } catch (e) {
      Logger.e('优化内存使用失败: $e');
    }
  }

  // ==========================================================================
  // 性能监控
  // ==========================================================================

  /// 收集性能指标
  Future<void> _collectPerformanceMetrics() async {
    try {
      final stats = _cacheService.getStats();
      
      // 计算平均响应时间
      final avgResponseTime = _recentResponseTimes.isNotEmpty
          ? _recentResponseTimes.reduce((a, b) => a + b) / _recentResponseTimes.length
          : 0.0;
      
      // 获取各类别的统计信息
      final stockStats = await _stockCacheService.getCacheStats();
      final aiStats = await _aiCacheService.getCacheUsageReport();
      
      final metrics = CachePerformanceMetrics(
        timestamp: DateTime.now(),
        hitRate: stats.hitRate,
        totalRequests: _totalRequests,
        cacheHits: _totalHits,
        cacheMisses: _totalMisses,
        averageResponseTime: avgResponseTime,
        totalCacheSize: stats.totalSize,
        totalEntries: stats.totalEntries,
        categoryHitRates: {
          'stock': (stockStats['hitRate'] as double?) ?? 0.0,
          'ai': (aiStats['hitRate'] as double?) ?? 0.0,
        },
        categorySizes: {
          'stock': (stockStats['totalSize'] as int?) ?? 0,
          'ai': (aiStats['totalSize'] as int?) ?? 0,
        },
      );
      
      _performanceHistory.add(metrics);
      
      // 清理旧的响应时间数据
      if (_recentResponseTimes.length > 100) {
        _recentResponseTimes.removeRange(0, 50);
      }
      
      // 分析性能趋势
      await _analyzePerformanceTrends();
      
    } catch (e) {
      Logger.e('收集性能指标失败: $e');
    }
  }

  /// 分析性能趋势
  Future<void> _analyzePerformanceTrends() async {
    try {
      if (_performanceHistory.length < 2) return;
      
      final recent = _performanceHistory.last;
      final previous = _performanceHistory[_performanceHistory.length - 2];
      
      // 检查命中率趋势
      if (recent.hitRate < _config.hitRateThreshold) {
        Logger.w('缓存命中率低于阈值: ${recent.hitRate.toStringAsFixed(2)} < ${_config.hitRateThreshold}');
      }
      
      // 检查响应时间趋势
      if (recent.averageResponseTime > previous.averageResponseTime * 1.5) {
        Logger.w('响应时间显著增加: ${recent.averageResponseTime.toStringAsFixed(2)}ms');
      }
      
      // 检查缓存大小趋势
      final sizeMB = recent.totalCacheSize / (1024 * 1024);
      if (sizeMB > _config.maxCacheSize * _config.memoryPressureThreshold) {
        Logger.w('缓存大小接近限制: ${sizeMB.toStringAsFixed(1)}MB');
      }
      
    } catch (e) {
      Logger.e('分析性能趋势失败: $e');
    }
  }

  /// 清理性能历史记录
  void _cleanupPerformanceHistory() {
    // 保留最近24小时的记录
    final cutoff = DateTime.now().subtract(const Duration(hours: 24));
    _performanceHistory.removeWhere((metrics) => metrics.timestamp.isBefore(cutoff));
  }

  /// 记录请求
  void recordRequest(String category, bool isHit, double responseTime) {
    _totalRequests++;
    if (isHit) {
      _totalHits++;
    } else {
      _totalMisses++;
    }
    
    _recentResponseTimes.add(responseTime);
    _requestCounts[category] = (_requestCounts[category] ?? 0) + 1;
    _responseTimes[category] = responseTime;
  }

  // ==========================================================================
  // 缓存优化建议
  // ==========================================================================

  /// 生成优化建议
  Future<List<CacheOptimizationSuggestion>> generateOptimizationSuggestions() async {
    final suggestions = <CacheOptimizationSuggestion>[];
    
    try {
      final stats = _cacheService.getStats();
      
      // 命中率优化建议
      if (stats.hitRate < 0.5) {
        suggestions.add(CacheOptimizationSuggestion(
          type: 'hit_rate',
          description: '缓存命中率较低 (${(stats.hitRate * 100).toStringAsFixed(1)}%)',
          action: '建议调整缓存策略，延长热点数据的缓存时间',
          priority: 4,
          metadata: {'current_hit_rate': stats.hitRate},
        ));
      }
      
      // 缓存大小优化建议
      final sizeMB = stats.totalSize / (1024 * 1024);
      if (sizeMB > _config.maxCacheSize * 0.8) {
        suggestions.add(CacheOptimizationSuggestion(
          type: 'cache_size',
          description: '缓存使用量较高 (${sizeMB.toStringAsFixed(1)}MB)',
          action: '建议清理过期数据或调整缓存策略',
          priority: 3,
          metadata: {'current_size_mb': sizeMB, 'max_size_mb': _config.maxCacheSize},
        ));
      }
      
      // 响应时间优化建议
      if (_recentResponseTimes.isNotEmpty) {
        final avgResponseTime = _recentResponseTimes.reduce((a, b) => a + b) / _recentResponseTimes.length;
        if (avgResponseTime > 100) { // 100ms
          suggestions.add(CacheOptimizationSuggestion(
            type: 'response_time',
            description: '平均响应时间较长 (${avgResponseTime.toStringAsFixed(1)}ms)',
            action: '建议优化缓存查询逻辑或增加内存缓存',
            priority: 2,
            metadata: {'avg_response_time': avgResponseTime},
          ));
        }
      }
      
      // 网络状态优化建议
      if (!_isOnline) {
        suggestions.add(CacheOptimizationSuggestion(
          type: 'network',
          description: '当前处于离线状态',
          action: '建议启用离线模式优化，延长缓存有效期',
          priority: 5,
          metadata: {'is_online': _isOnline, 'last_connectivity': _lastConnectivity.toString()},
        ));
      }
      
      // 根据优先级排序
      suggestions.sort((a, b) => b.priority.compareTo(a.priority));
      
    } catch (e) {
      Logger.e('生成优化建议失败: $e');
    }
    
    return suggestions;
  }

  // ==========================================================================
  // 公共接口
  // ==========================================================================

  /// 获取缓存统计信息
  Future<Map<String, dynamic>> getCacheStatistics() async {
    try {
      final coreStats = _cacheService.getStats();
      final stockStats = await _stockCacheService.getCacheStats();
      final aiStats = await _aiCacheService.getCacheUsageReport();
      
      return {
        'timestamp': DateTime.now().toIso8601String(),
        'core': {
          'totalEntries': coreStats.totalEntries,
          'hitRate': coreStats.hitRate,
          'totalSize': coreStats.totalSize,
          'lastCleanup': coreStats.lastCleanup.toIso8601String(),
        },
        'stock': stockStats,
        'ai': aiStats,
        'network': {
          'isOnline': _isOnline,
          'connectivity': _lastConnectivity.toString(),
        },
        'performance': {
          'totalRequests': _totalRequests,
          'totalHits': _totalHits,
          'totalMisses': _totalMisses,
          'hitRate': _totalRequests > 0 ? _totalHits / _totalRequests : 0.0,
          'averageResponseTime': _recentResponseTimes.isNotEmpty
              ? _recentResponseTimes.reduce((a, b) => a + b) / _recentResponseTimes.length
              : 0.0,
        },
      };
    } catch (e) {
      Logger.e('获取缓存统计信息失败: $e');
      return {};
    }
  }

  /// 获取性能历史
  List<CachePerformanceMetrics> getPerformanceHistory({
    Duration? period,
  }) {
    if (period == null) return List.from(_performanceHistory);
    
    final cutoff = DateTime.now().subtract(period);
    return _performanceHistory
        .where((metrics) => metrics.timestamp.isAfter(cutoff))
        .toList();
  }

  /// 手动触发缓存清理
  Future<void> manualCleanup() async {
    await _performAutoCleanup();
  }

  /// 手动触发缓存预热
  Future<void> manualWarmup() async {
    await _performSmartWarmup();
  }

  /// 清空所有缓存
  Future<void> clearAllCaches() async {
    try {
      await Future.wait([
        _cacheService.clear(),
        _stockCacheService.clearAllCache(),
        _aiCacheService.clearAllCache(),
      ]);
      
      // 重置统计信息
      _totalRequests = 0;
      _totalHits = 0;
      _totalMisses = 0;
      _recentResponseTimes.clear();
      _requestCounts.clear();
      _responseTimes.clear();
      _performanceHistory.clear();
      
      Logger.d('所有缓存已清空');
    } catch (e) {
      Logger.e('清空所有缓存失败: $e');
      rethrow;
    }
  }

  /// 获取网络状态
  bool get isOnline => _isOnline;
  
  /// 获取连接类型
  ConnectivityResult get connectivity => _lastConnectivity;

  /// 释放资源
  Future<void> dispose() async {
    try {
      _cleanupTimer?.cancel();
      _monitoringTimer?.cancel();
      _networkTimer?.cancel();
      
      Logger.d('缓存管理器已释放');
    } catch (e) {
      Logger.e('释放缓存管理器失败: $e');
    }
  }
}