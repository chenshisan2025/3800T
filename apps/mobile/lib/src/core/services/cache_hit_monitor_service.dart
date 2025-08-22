import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';

/// 缓存命中统计
class CacheHitStats {
  final String cacheType;
  final int totalRequests;
  final int hitCount;
  final int missCount;
  final double hitRate;
  final Duration averageResponseTime;
  final int totalDataSize;
  final DateTime lastUpdated;
  final Map<String, int> keyHitCounts;
  final Map<String, Duration> keyResponseTimes;
  
  const CacheHitStats({
    required this.cacheType,
    required this.totalRequests,
    required this.hitCount,
    required this.missCount,
    required this.hitRate,
    required this.averageResponseTime,
    required this.totalDataSize,
    required this.lastUpdated,
    this.keyHitCounts = const {},
    this.keyResponseTimes = const {},
  });
  
  Map<String, dynamic> toJson() => {
    'cacheType': cacheType,
    'totalRequests': totalRequests,
    'hitCount': hitCount,
    'missCount': missCount,
    'hitRate': hitRate,
    'averageResponseTime': averageResponseTime.inMilliseconds,
    'totalDataSize': totalDataSize,
    'lastUpdated': lastUpdated.toIso8601String(),
    'keyHitCounts': keyHitCounts,
    'keyResponseTimes': keyResponseTimes.map((k, v) => MapEntry(k, v.inMilliseconds)),
  };
  
  factory CacheHitStats.fromJson(Map<String, dynamic> json) {
    return CacheHitStats(
      cacheType: json['cacheType'] ?? '',
      totalRequests: json['totalRequests'] ?? 0,
      hitCount: json['hitCount'] ?? 0,
      missCount: json['missCount'] ?? 0,
      hitRate: json['hitRate']?.toDouble() ?? 0.0,
      averageResponseTime: Duration(milliseconds: json['averageResponseTime'] ?? 0),
      totalDataSize: json['totalDataSize'] ?? 0,
      lastUpdated: DateTime.parse(json['lastUpdated']),
      keyHitCounts: Map<String, int>.from(json['keyHitCounts'] ?? {}),
      keyResponseTimes: (json['keyResponseTimes'] as Map<String, dynamic>? ?? {})
          .map((k, v) => MapEntry(k, Duration(milliseconds: v))),
    );
  }
}

/// 缓存使用模式
class CacheUsagePattern {
  final String pattern;
  final String description;
  final double frequency;
  final List<String> affectedKeys;
  final DateTime detectedAt;
  final Map<String, dynamic> metadata;
  
  const CacheUsagePattern({
    required this.pattern,
    required this.description,
    required this.frequency,
    required this.affectedKeys,
    required this.detectedAt,
    this.metadata = const {},
  });
  
  Map<String, dynamic> toJson() => {
    'pattern': pattern,
    'description': description,
    'frequency': frequency,
    'affectedKeys': affectedKeys,
    'detectedAt': detectedAt.toIso8601String(),
    'metadata': metadata,
  };
}

/// 缓存优化建议
class CacheOptimizationRecommendation {
  final String type;
  final String title;
  final String description;
  final String action;
  final double impact;
  final int priority;
  final Map<String, dynamic> parameters;
  final DateTime createdAt;
  
  const CacheOptimizationRecommendation({
    required this.type,
    required this.title,
    required this.description,
    required this.action,
    required this.impact,
    required this.priority,
    this.parameters = const {},
    required this.createdAt,
  });
  
  Map<String, dynamic> toJson() => {
    'type': type,
    'title': title,
    'description': description,
    'action': action,
    'impact': impact,
    'priority': priority,
    'parameters': parameters,
    'createdAt': createdAt.toIso8601String(),
  };
}

/// 缓存请求记录
class CacheRequestRecord {
  final String key;
  final String cacheType;
  final bool isHit;
  final Duration responseTime;
  final int dataSize;
  final DateTime timestamp;
  final String? source;
  final Map<String, dynamic>? context;
  
  const CacheRequestRecord({
    required this.key,
    required this.cacheType,
    required this.isHit,
    required this.responseTime,
    required this.dataSize,
    required this.timestamp,
    this.source,
    this.context,
  });
  
  Map<String, dynamic> toJson() => {
    'key': key,
    'cacheType': cacheType,
    'isHit': isHit,
    'responseTime': responseTime.inMilliseconds,
    'dataSize': dataSize,
    'timestamp': timestamp.toIso8601String(),
    'source': source,
    'context': context,
  };
}

/// 缓存命中率监控服务
class CacheHitMonitorService {
  static final CacheHitMonitorService _instance = CacheHitMonitorService._internal();
  factory CacheHitMonitorService() => _instance;
  CacheHitMonitorService._internal();
  
  static const String _tag = 'CacheHitMonitorService';
  bool _isInitialized = false;
  
  // 配置
  Duration _reportInterval = const Duration(minutes: 5);
  Duration _dataRetentionPeriod = const Duration(days: 7);
  int _maxRecords = 10000;
  
  // 统计数据
  final Map<String, CacheHitStats> _cacheStats = {};
  final List<CacheRequestRecord> _requestHistory = [];
  final List<CacheUsagePattern> _usagePatterns = [];
  final List<CacheOptimizationRecommendation> _recommendations = [];
  
  // 实时统计
  final Map<String, int> _hitCounts = {};
  final Map<String, int> _missCounts = {};
  final Map<String, List<Duration>> _responseTimes = {};
  final Map<String, int> _dataSizes = {};
  final Map<String, Map<String, int>> _keyHitCounts = {};
  final Map<String, Map<String, List<Duration>>> _keyResponseTimes = {};
  
  // 定时器
  Timer? _reportTimer;
  Timer? _analysisTimer;
  
  // 本地存储
  SharedPreferences? _prefs;
  
  /// 初始化监控服务
  Future<void> initialize({
    Duration? reportInterval,
    Duration? dataRetentionPeriod,
    int? maxRecords,
  }) async {
    if (_isInitialized) return;
    
    try {
      _reportInterval = reportInterval ?? _reportInterval;
      _dataRetentionPeriod = dataRetentionPeriod ?? _dataRetentionPeriod;
      _maxRecords = maxRecords ?? _maxRecords;
      
      // 初始化本地存储
      _prefs = await SharedPreferences.getInstance();
      
      // 加载历史数据
      await _loadHistoricalData();
      
      // 启动定期报告
      _startPeriodicReporting();
      
      // 启动模式分析
      _startPatternAnalysis();
      
      // 清理过期数据
      await _cleanupExpiredData();
      
      _isInitialized = true;
      Logger.d('缓存命中率监控服务初始化完成');
      
    } catch (e, stackTrace) {
      Logger.e('缓存命中率监控服务初始化失败: $e', stackTrace: stackTrace);
      rethrow;
    }
  }
  
  /// 加载历史数据
  Future<void> _loadHistoricalData() async {
    if (_prefs == null) return;
    
    try {
      // 加载缓存统计
      final statsKeys = _prefs!.getKeys().where((key) => key.startsWith('cache_stats_')).toList();
      for (final key in statsKeys) {
        final statsJson = _prefs!.getString(key);
        if (statsJson != null) {
          final stats = CacheHitStats.fromJson(json.decode(statsJson));
          _cacheStats[stats.cacheType] = stats;
        }
      }
      
      // 加载请求历史
      final historyKeys = _prefs!.getKeys().where((key) => key.startsWith('cache_request_')).toList();
      for (final key in historyKeys) {
        final recordJson = _prefs!.getString(key);
        if (recordJson != null) {
          final record = CacheRequestRecord(
            key: json.decode(recordJson)['key'],
            cacheType: json.decode(recordJson)['cacheType'],
            isHit: json.decode(recordJson)['isHit'],
            responseTime: Duration(milliseconds: json.decode(recordJson)['responseTime']),
            dataSize: json.decode(recordJson)['dataSize'],
            timestamp: DateTime.parse(json.decode(recordJson)['timestamp']),
            source: json.decode(recordJson)['source'],
            context: json.decode(recordJson)['context'],
          );
          _requestHistory.add(record);
        }
      }
      
      // 按时间排序
      _requestHistory.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      Logger.d('加载了 ${_cacheStats.length} 个缓存统计和 ${_requestHistory.length} 条请求记录');
    } catch (e) {
      Logger.e('加载历史数据失败: $e');
    }
  }
  
  /// 启动定期报告
  void _startPeriodicReporting() {
    _reportTimer = Timer.periodic(_reportInterval, (_) {
      _generateReport();
    });
    
    Logger.d('缓存命中率定期报告已启动，间隔: $_reportInterval');
  }
  
  /// 启动模式分析
  void _startPatternAnalysis() {
    _analysisTimer = Timer.periodic(const Duration(hours: 1), (_) {
      _analyzeUsagePatterns();
      _generateRecommendations();
    });
    
    Logger.d('缓存使用模式分析已启动');
  }
  
  /// 生成报告
  void _generateReport() {
    try {
      final now = DateTime.now();
      
      for (final cacheType in _hitCounts.keys) {
        final hitCount = _hitCounts[cacheType] ?? 0;
        final missCount = _missCounts[cacheType] ?? 0;
        final totalRequests = hitCount + missCount;
        
        if (totalRequests == 0) continue;
        
        final hitRate = hitCount / totalRequests;
        final responseTimes = _responseTimes[cacheType] ?? [];
        final averageResponseTime = responseTimes.isNotEmpty
            ? responseTimes.reduce((a, b) => a + b) ~/ responseTimes.length
            : Duration.zero;
        
        final keyHitCounts = _keyHitCounts[cacheType] ?? {};
        final keyResponseTimes = _keyResponseTimes[cacheType]?.map(
          (key, times) => MapEntry(key, times.isNotEmpty 
              ? times.reduce((a, b) => a + b) ~/ times.length 
              : Duration.zero)
        ) ?? <String, Duration>{};
        
        final stats = CacheHitStats(
          cacheType: cacheType,
          totalRequests: totalRequests,
          hitCount: hitCount,
          missCount: missCount,
          hitRate: hitRate,
          averageResponseTime: averageResponseTime,
          totalDataSize: _dataSizes[cacheType] ?? 0,
          lastUpdated: now,
          keyHitCounts: keyHitCounts,
          keyResponseTimes: keyResponseTimes,
        );
        
        _cacheStats[cacheType] = stats;
        
        // 保存到本地存储
        _saveStatsToStorage(stats);
      }
      
      // 重置计数器
      _resetCounters();
      
      Logger.d('缓存命中率报告已生成');
    } catch (e) {
      Logger.e('生成缓存命中率报告失败: $e');
    }
  }
  
  /// 分析使用模式
  void _analyzeUsagePatterns() {
    try {
      final now = DateTime.now();
      final recentRequests = _requestHistory.where(
        (r) => r.timestamp.isAfter(now.subtract(const Duration(hours: 24)))
      ).toList();
      
      if (recentRequests.isEmpty) return;
      
      // 分析热点数据
      final keyFrequency = <String, int>{};
      for (final request in recentRequests) {
        keyFrequency[request.key] = (keyFrequency[request.key] ?? 0) + 1;
      }
      
      final hotKeys = keyFrequency.entries
          .where((e) => e.value > recentRequests.length * 0.1) // 超过10%的请求
          .map((e) => e.key)
          .toList();
      
      if (hotKeys.isNotEmpty) {
        final pattern = CacheUsagePattern(
          pattern: 'hot_data',
          description: '检测到热点数据访问模式',
          frequency: hotKeys.length / keyFrequency.length,
          affectedKeys: hotKeys,
          detectedAt: now,
          metadata: {
            'totalKeys': keyFrequency.length,
            'hotKeyCount': hotKeys.length,
            'averageHitRate': hotKeys.map((k) => 
                recentRequests.where((r) => r.key == k && r.isHit).length /
                recentRequests.where((r) => r.key == k).length
            ).reduce((a, b) => a + b) / hotKeys.length,
          },
        );
        
        _usagePatterns.add(pattern);
      }
      
      // 分析时间模式
      final hourlyRequests = <int, int>{};
      for (final request in recentRequests) {
        final hour = request.timestamp.hour;
        hourlyRequests[hour] = (hourlyRequests[hour] ?? 0) + 1;
      }
      
      final peakHours = hourlyRequests.entries
          .where((e) => e.value > recentRequests.length / 24 * 2) // 超过平均值2倍
          .map((e) => e.key)
          .toList();
      
      if (peakHours.isNotEmpty) {
        final pattern = CacheUsagePattern(
          pattern: 'time_based',
          description: '检测到基于时间的访问模式',
          frequency: peakHours.length / 24,
          affectedKeys: [],
          detectedAt: now,
          metadata: {
            'peakHours': peakHours,
            'peakRequestCount': peakHours.map((h) => hourlyRequests[h] ?? 0).reduce((a, b) => a + b),
            'averageHourlyRequests': recentRequests.length / 24,
          },
        );
        
        _usagePatterns.add(pattern);
      }
      
      // 限制模式数量
      if (_usagePatterns.length > 50) {
        _usagePatterns.removeRange(0, _usagePatterns.length - 50);
      }
      
      Logger.d('分析了 ${recentRequests.length} 条请求，发现 ${_usagePatterns.length} 个使用模式');
    } catch (e) {
      Logger.e('分析使用模式失败: $e');
    }
  }
  
  /// 生成优化建议
  void _generateRecommendations() {
    try {
      final now = DateTime.now();
      _recommendations.clear();
      
      for (final stats in _cacheStats.values) {
        // 低命中率建议
        if (stats.hitRate < 0.5) {
          _recommendations.add(CacheOptimizationRecommendation(
            type: 'low_hit_rate',
            title: '${stats.cacheType} 缓存命中率过低',
            description: '当前命中率为 ${(stats.hitRate * 100).toStringAsFixed(1)}%，建议优化缓存策略',
            action: 'increase_cache_size_or_ttl',
            impact: (0.5 - stats.hitRate) * 100,
            priority: stats.hitRate < 0.3 ? 1 : 2,
            parameters: {
              'currentHitRate': stats.hitRate,
              'targetHitRate': 0.8,
              'cacheType': stats.cacheType,
            },
            createdAt: now,
          ));
        }
        
        // 响应时间过长建议
        if (stats.averageResponseTime.inMilliseconds > 1000) {
          _recommendations.add(CacheOptimizationRecommendation(
            type: 'slow_response',
            title: '${stats.cacheType} 缓存响应时间过长',
            description: '平均响应时间为 ${stats.averageResponseTime.inMilliseconds}ms，建议优化存储方式',
            action: 'optimize_storage_or_indexing',
            impact: stats.averageResponseTime.inMilliseconds / 10.0,
            priority: stats.averageResponseTime.inMilliseconds > 2000 ? 1 : 2,
            parameters: {
              'currentResponseTime': stats.averageResponseTime.inMilliseconds,
              'targetResponseTime': 500,
              'cacheType': stats.cacheType,
            },
            createdAt: now,
          ));
        }
        
        // 内存使用过高建议
        if (stats.totalDataSize > 100 * 1024 * 1024) { // 100MB
          _recommendations.add(CacheOptimizationRecommendation(
            type: 'high_memory_usage',
            title: '${stats.cacheType} 缓存内存使用过高',
            description: '当前使用 ${(stats.totalDataSize / (1024 * 1024)).toStringAsFixed(1)}MB，建议清理或压缩',
            action: 'cleanup_or_compress',
            impact: stats.totalDataSize / (1024 * 1024),
            priority: stats.totalDataSize > 200 * 1024 * 1024 ? 1 : 2,
            parameters: {
              'currentSize': stats.totalDataSize,
              'targetSize': 50 * 1024 * 1024,
              'cacheType': stats.cacheType,
            },
            createdAt: now,
          ));
        }
      }
      
      // 基于使用模式的建议
      for (final pattern in _usagePatterns) {
        if (pattern.pattern == 'hot_data' && pattern.frequency > 0.3) {
          _recommendations.add(CacheOptimizationRecommendation(
            type: 'hot_data_optimization',
            title: '热点数据优化机会',
            description: '检测到 ${pattern.affectedKeys.length} 个热点数据，建议增加缓存时间',
            action: 'increase_hot_data_ttl',
            impact: pattern.frequency * 50,
            priority: 2,
            parameters: {
              'hotKeys': pattern.affectedKeys,
              'frequency': pattern.frequency,
              'suggestedTtl': '1h',
            },
            createdAt: now,
          ));
        }
        
        if (pattern.pattern == 'time_based') {
          _recommendations.add(CacheOptimizationRecommendation(
            type: 'time_based_preloading',
            title: '基于时间的预加载优化',
            description: '检测到时间相关的访问模式，建议在高峰期前预加载数据',
            action: 'implement_preloading',
            impact: pattern.frequency * 30,
            priority: 3,
            parameters: {
              'peakHours': pattern.metadata['peakHours'],
              'preloadTime': '30min_before_peak',
            },
            createdAt: now,
          ));
        }
      }
      
      // 按优先级和影响排序
      _recommendations.sort((a, b) {
        final priorityCompare = a.priority.compareTo(b.priority);
        if (priorityCompare != 0) return priorityCompare;
        return b.impact.compareTo(a.impact);
      });
      
      // 限制建议数量
      if (_recommendations.length > 20) {
        _recommendations.removeRange(20, _recommendations.length);
      }
      
      Logger.d('生成了 ${_recommendations.length} 条优化建议');
    } catch (e) {
      Logger.e('生成优化建议失败: $e');
    }
  }
  
  /// 保存统计到本地存储
  Future<void> _saveStatsToStorage(CacheHitStats stats) async {
    if (_prefs == null) return;
    
    try {
      final key = 'cache_stats_${stats.cacheType}';
      final statsJson = json.encode(stats.toJson());
      await _prefs!.setString(key, statsJson);
    } catch (e) {
      Logger.e('保存缓存统计失败: $e');
    }
  }
  
  /// 重置计数器
  void _resetCounters() {
    _hitCounts.clear();
    _missCounts.clear();
    _responseTimes.clear();
    _dataSizes.clear();
    _keyHitCounts.clear();
    _keyResponseTimes.clear();
  }
  
  /// 清理过期数据
  Future<void> _cleanupExpiredData() async {
    if (_prefs == null) return;
    
    try {
      final cutoff = DateTime.now().subtract(_dataRetentionPeriod);
      
      // 清理请求历史
      _requestHistory.removeWhere((record) => record.timestamp.isBefore(cutoff));
      
      // 清理使用模式
      _usagePatterns.removeWhere((pattern) => pattern.detectedAt.isBefore(cutoff));
      
      // 清理本地存储中的过期数据
      final keys = _prefs!.getKeys().where((key) => key.startsWith('cache_request_')).toList();
      int removedCount = 0;
      
      for (final key in keys) {
        final timestampStr = key.replaceFirst('cache_request_', '');
        final timestamp = int.tryParse(timestampStr);
        if (timestamp != null) {
          final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
          if (date.isBefore(cutoff)) {
            await _prefs!.remove(key);
            removedCount++;
          }
        }
      }
      
      if (removedCount > 0) {
        Logger.d('清理了 $removedCount 条过期缓存监控数据');
      }
    } catch (e) {
      Logger.e('清理过期数据失败: $e');
    }
  }
  
  // =============================================================================
  // 公共API
  // =============================================================================
  
  /// 记录缓存请求
  void recordCacheRequest({
    required String key,
    required String cacheType,
    required bool isHit,
    required Duration responseTime,
    int dataSize = 0,
    String? source,
    Map<String, dynamic>? context,
  }) {
    try {
      final now = DateTime.now();
      
      // 更新实时统计
      if (isHit) {
        _hitCounts[cacheType] = (_hitCounts[cacheType] ?? 0) + 1;
        _keyHitCounts.putIfAbsent(cacheType, () => {})[key] = 
            (_keyHitCounts[cacheType]?[key] ?? 0) + 1;
      } else {
        _missCounts[cacheType] = (_missCounts[cacheType] ?? 0) + 1;
      }
      
      _responseTimes.putIfAbsent(cacheType, () => []).add(responseTime);
      _keyResponseTimes.putIfAbsent(cacheType, () => {})
          .putIfAbsent(key, () => []).add(responseTime);
      
      if (dataSize > 0) {
        _dataSizes[cacheType] = (_dataSizes[cacheType] ?? 0) + dataSize;
      }
      
      // 创建请求记录
      final record = CacheRequestRecord(
        key: key,
        cacheType: cacheType,
        isHit: isHit,
        responseTime: responseTime,
        dataSize: dataSize,
        timestamp: now,
        source: source,
        context: context,
      );
      
      _requestHistory.add(record);
      
      // 限制历史记录数量
      if (_requestHistory.length > _maxRecords) {
        _requestHistory.removeAt(0);
      }
      
      // 异步保存到本地存储
      _saveRequestToStorage(record);
      
    } catch (e) {
      Logger.e('记录缓存请求失败: $e');
    }
  }
  
  /// 保存请求到本地存储
  Future<void> _saveRequestToStorage(CacheRequestRecord record) async {
    if (_prefs == null) return;
    
    try {
      final key = 'cache_request_${record.timestamp.millisecondsSinceEpoch}';
      final recordJson = json.encode(record.toJson());
      await _prefs!.setString(key, recordJson);
    } catch (e) {
      Logger.e('保存缓存请求记录失败: $e');
    }
  }
  
  /// 获取缓存统计
  Map<String, CacheHitStats> getCacheStats() {
    return Map.from(_cacheStats);
  }
  
  /// 获取特定缓存类型的统计
  CacheHitStats? getCacheStatsForType(String cacheType) {
    return _cacheStats[cacheType];
  }
  
  /// 获取使用模式
  List<CacheUsagePattern> getUsagePatterns({Duration? period}) {
    if (period == null) return List.from(_usagePatterns);
    
    final cutoff = DateTime.now().subtract(period);
    return _usagePatterns.where((p) => p.detectedAt.isAfter(cutoff)).toList();
  }
  
  /// 获取优化建议
  List<CacheOptimizationRecommendation> getOptimizationRecommendations() {
    return List.from(_recommendations);
  }
  
  /// 获取请求历史
  List<CacheRequestRecord> getRequestHistory({Duration? period, String? cacheType}) {
    var history = _requestHistory.asMap().values;
    
    if (period != null) {
      final cutoff = DateTime.now().subtract(period);
      history = history.where((r) => r.timestamp.isAfter(cutoff));
    }
    
    if (cacheType != null) {
      history = history.where((r) => r.cacheType == cacheType);
    }
    
    return history.toList();
  }
  
  /// 获取总体统计摘要
  Map<String, dynamic> getOverallSummary() {
    final totalRequests = _cacheStats.values.fold(0, (sum, stats) => sum + stats.totalRequests);
    final totalHits = _cacheStats.values.fold(0, (sum, stats) => sum + stats.hitCount);
    final totalMisses = _cacheStats.values.fold(0, (sum, stats) => sum + stats.missCount);
    final overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0.0;
    
    final avgResponseTime = _cacheStats.values.isNotEmpty
        ? _cacheStats.values.map((s) => s.averageResponseTime.inMilliseconds).reduce((a, b) => a + b) / _cacheStats.length
        : 0.0;
    
    final totalDataSize = _cacheStats.values.fold(0, (sum, stats) => sum + stats.totalDataSize);
    
    return {
      'totalRequests': totalRequests,
      'totalHits': totalHits,
      'totalMisses': totalMisses,
      'overallHitRate': overallHitRate,
      'averageResponseTime': avgResponseTime,
      'totalDataSize': totalDataSize,
      'cacheTypes': _cacheStats.keys.toList(),
      'activePatterns': _usagePatterns.length,
      'pendingRecommendations': _recommendations.length,
      'lastUpdated': _cacheStats.values.isNotEmpty
          ? _cacheStats.values.map((s) => s.lastUpdated).reduce((a, b) => a.isAfter(b) ? a : b).toIso8601String()
          : null,
    };
  }
  
  /// 清除所有数据
  Future<void> clearAllData() async {
    try {
      _cacheStats.clear();
      _requestHistory.clear();
      _usagePatterns.clear();
      _recommendations.clear();
      _resetCounters();
      
      if (_prefs != null) {
        final keys = _prefs!.getKeys().where((key) => 
            key.startsWith('cache_stats_') || key.startsWith('cache_request_')
        ).toList();
        
        for (final key in keys) {
          await _prefs!.remove(key);
        }
      }
      
      Logger.d('已清除所有缓存监控数据');
    } catch (e) {
      Logger.e('清除缓存监控数据失败: $e');
    }
  }
  
  /// 释放资源
  Future<void> dispose() async {
    try {
      _reportTimer?.cancel();
      _analysisTimer?.cancel();
      
      _reportTimer = null;
      _analysisTimer = null;
      
      _cacheStats.clear();
      _requestHistory.clear();
      _usagePatterns.clear();
      _recommendations.clear();
      _resetCounters();
      
      _isInitialized = false;
      Logger.d('缓存命中率监控服务资源已释放');
    } catch (e) {
      Logger.e('释放缓存命中率监控服务资源失败: $e');
    }
  }
}