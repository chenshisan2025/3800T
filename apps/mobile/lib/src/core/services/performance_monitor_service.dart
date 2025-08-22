import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';
import 'crash_report_service.dart';

/// 性能监控配置
class PerformanceMonitorConfig {
  final bool enableFrameRateMonitoring;
  final bool enableMemoryMonitoring;
  final bool enableCpuMonitoring;
  final bool enableNetworkMonitoring;
  final bool enableBatteryMonitoring;
  final Duration reportInterval;
  final Duration dataRetentionPeriod;
  final int maxDataPoints;
  final double frameRateThreshold;
  final int memoryThreshold; // MB
  final double cpuThreshold; // 百分比
  
  const PerformanceMonitorConfig({
    this.enableFrameRateMonitoring = true,
    this.enableMemoryMonitoring = true,
    this.enableCpuMonitoring = false, // 需要平台特定实现
    this.enableNetworkMonitoring = true,
    this.enableBatteryMonitoring = false, // 需要平台特定实现
    this.reportInterval = const Duration(seconds: 30),
    this.dataRetentionPeriod = const Duration(hours: 24),
    this.maxDataPoints = 2880, // 24小时 * 60分钟 * 2（每30秒一个数据点）
    this.frameRateThreshold = 30.0,
    this.memoryThreshold = 512,
    this.cpuThreshold = 80.0,
  });
}

/// 详细性能指标
class DetailedPerformanceMetrics {
  final double frameRate;
  final Duration averageFrameTime;
  final Duration maxFrameTime;
  final int droppedFrames;
  final int totalFrames;
  final double cpuUsage;
  final int memoryUsage; // bytes
  final int memoryPeak; // bytes
  final double batteryLevel;
  final int networkRequests;
  final int networkErrors;
  final Duration networkLatency;
  final String screenName;
  final DateTime timestamp;
  final Map<String, dynamic> customMetrics;
  
  const DetailedPerformanceMetrics({
    required this.frameRate,
    required this.averageFrameTime,
    required this.maxFrameTime,
    required this.droppedFrames,
    required this.totalFrames,
    required this.cpuUsage,
    required this.memoryUsage,
    required this.memoryPeak,
    required this.batteryLevel,
    required this.networkRequests,
    required this.networkErrors,
    required this.networkLatency,
    required this.screenName,
    required this.timestamp,
    this.customMetrics = const {},
  });
  
  Map<String, dynamic> toJson() => {
    'frameRate': frameRate,
    'averageFrameTime': averageFrameTime.inMicroseconds,
    'maxFrameTime': maxFrameTime.inMicroseconds,
    'droppedFrames': droppedFrames,
    'totalFrames': totalFrames,
    'cpuUsage': cpuUsage,
    'memoryUsage': memoryUsage,
    'memoryPeak': memoryPeak,
    'batteryLevel': batteryLevel,
    'networkRequests': networkRequests,
    'networkErrors': networkErrors,
    'networkLatency': networkLatency.inMilliseconds,
    'screenName': screenName,
    'timestamp': timestamp.toIso8601String(),
    'customMetrics': customMetrics,
  };
  
  factory DetailedPerformanceMetrics.fromJson(Map<String, dynamic> json) {
    return DetailedPerformanceMetrics(
      frameRate: json['frameRate']?.toDouble() ?? 0.0,
      averageFrameTime: Duration(microseconds: json['averageFrameTime'] ?? 0),
      maxFrameTime: Duration(microseconds: json['maxFrameTime'] ?? 0),
      droppedFrames: json['droppedFrames'] ?? 0,
      totalFrames: json['totalFrames'] ?? 0,
      cpuUsage: json['cpuUsage']?.toDouble() ?? 0.0,
      memoryUsage: json['memoryUsage'] ?? 0,
      memoryPeak: json['memoryPeak'] ?? 0,
      batteryLevel: json['batteryLevel']?.toDouble() ?? 0.0,
      networkRequests: json['networkRequests'] ?? 0,
      networkErrors: json['networkErrors'] ?? 0,
      networkLatency: Duration(milliseconds: json['networkLatency'] ?? 0),
      screenName: json['screenName'] ?? '',
      timestamp: DateTime.parse(json['timestamp']),
      customMetrics: json['customMetrics'] ?? {},
    );
  }
}

/// 性能警报
class PerformanceAlert {
  final String type;
  final String message;
  final double value;
  final double threshold;
  final DateTime timestamp;
  final String? screenName;
  final Map<String, dynamic>? context;
  
  const PerformanceAlert({
    required this.type,
    required this.message,
    required this.value,
    required this.threshold,
    required this.timestamp,
    this.screenName,
    this.context,
  });
  
  Map<String, dynamic> toJson() => {
    'type': type,
    'message': message,
    'value': value,
    'threshold': threshold,
    'timestamp': timestamp.toIso8601String(),
    'screenName': screenName,
    'context': context,
  };
}

/// 性能监控服务
class PerformanceMonitorService {
  static final PerformanceMonitorService _instance = PerformanceMonitorService._internal();
  factory PerformanceMonitorService() => _instance;
  PerformanceMonitorService._internal();
  
  static const String _tag = 'PerformanceMonitorService';
  bool _isInitialized = false;
  
  PerformanceMonitorConfig _config = const PerformanceMonitorConfig();
  
  // 监控数据
  final List<DetailedPerformanceMetrics> _performanceHistory = [];
  final List<PerformanceAlert> _alerts = [];
  
  // 帧率监控
  Timer? _monitoringTimer;
  int _frameCount = 0;
  int _droppedFrameCount = 0;
  final List<Duration> _frameTimes = [];
  DateTime? _lastFrameTime;
  
  // 内存监控
  int _currentMemoryUsage = 0;
  int _peakMemoryUsage = 0;
  
  // 网络监控
  int _networkRequestCount = 0;
  int _networkErrorCount = 0;
  final List<Duration> _networkLatencies = [];
  
  // 当前状态
  String _currentScreenName = '';
  final Map<String, dynamic> _customMetrics = {};
  
  // 本地存储
  SharedPreferences? _prefs;
  
  /// 初始化性能监控服务
  Future<void> initialize({PerformanceMonitorConfig? config}) async {
    if (_isInitialized) return;
    
    try {
      _config = config ?? const PerformanceMonitorConfig();
      
      // 初始化本地存储
      _prefs = await SharedPreferences.getInstance();
      
      // 加载历史数据
      await _loadHistoricalData();
      
      // 启动帧率监控
      if (_config.enableFrameRateMonitoring) {
        SchedulerBinding.instance.addPersistentFrameCallback(_onFrame);
      }
      
      // 启动定期数据收集
      _startPeriodicCollection();
      
      // 清理过期数据
      await _cleanupExpiredData();
      
      _isInitialized = true;
      Logger.d('性能监控服务初始化完成');
      
    } catch (e, stackTrace) {
      Logger.e('性能监控服务初始化失败: $e', stackTrace: stackTrace);
      rethrow;
    }
  }
  
  /// 加载历史数据
  Future<void> _loadHistoricalData() async {
    if (_prefs == null) return;
    
    try {
      final keys = _prefs!.getKeys().where((key) => key.startsWith('perf_data_')).toList();
      
      for (final key in keys) {
        final dataJson = _prefs!.getString(key);
        if (dataJson != null) {
          final data = json.decode(dataJson) as Map<String, dynamic>;
          final metrics = DetailedPerformanceMetrics.fromJson(data);
          _performanceHistory.add(metrics);
        }
      }
      
      // 按时间排序
      _performanceHistory.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      Logger.d('加载了 ${_performanceHistory.length} 条历史性能数据');
    } catch (e) {
      Logger.e('加载历史性能数据失败: $e');
    }
  }
  
  /// 启动定期数据收集
  void _startPeriodicCollection() {
    _monitoringTimer = Timer.periodic(_config.reportInterval, (_) {
      _collectPerformanceData();
    });
    
    Logger.d('性能数据定期收集已启动，间隔: ${_config.reportInterval}');
  }
  
  /// 帧回调处理
  void _onFrame(Duration timestamp) {
    _frameCount++;
    
    if (_lastFrameTime != null) {
      final frameTime = timestamp - Duration(microseconds: _lastFrameTime!.microsecondsSinceEpoch);
      _frameTimes.add(frameTime);
      
      // 检测掉帧（假设60fps，每帧16.67ms）
      if (frameTime.inMilliseconds > 16.67 * 2) {
        _droppedFrameCount++;
      }
      
      // 限制帧时间历史记录数量
      if (_frameTimes.length > 1000) {
        _frameTimes.removeAt(0);
      }
    }
    
    _lastFrameTime = DateTime.now();
  }
  
  /// 收集性能数据
  void _collectPerformanceData() {
    try {
      final now = DateTime.now();
      
      // 计算帧率指标
      final frameRate = _frameCount / _config.reportInterval.inSeconds;
      final avgFrameTime = _frameTimes.isNotEmpty 
          ? _frameTimes.reduce((a, b) => a + b) ~/ _frameTimes.length
          : Duration.zero;
      final maxFrameTime = _frameTimes.isNotEmpty 
          ? _frameTimes.reduce((a, b) => a > b ? a : b)
          : Duration.zero;
      
      // 计算网络延迟
      final avgNetworkLatency = _networkLatencies.isNotEmpty
          ? _networkLatencies.reduce((a, b) => a + b) ~/ _networkLatencies.length
          : Duration.zero;
      
      // 创建性能指标
      final metrics = DetailedPerformanceMetrics(
        frameRate: frameRate,
        averageFrameTime: avgFrameTime,
        maxFrameTime: maxFrameTime,
        droppedFrames: _droppedFrameCount,
        totalFrames: _frameCount,
        cpuUsage: _getCpuUsage(),
        memoryUsage: _currentMemoryUsage,
        memoryPeak: _peakMemoryUsage,
        batteryLevel: _getBatteryLevel(),
        networkRequests: _networkRequestCount,
        networkErrors: _networkErrorCount,
        networkLatency: avgNetworkLatency,
        screenName: _currentScreenName,
        timestamp: now,
        customMetrics: Map.from(_customMetrics),
      );
      
      _performanceHistory.add(metrics);
      
      // 限制历史记录数量
      if (_performanceHistory.length > _config.maxDataPoints) {
        _performanceHistory.removeAt(0);
      }
      
      // 保存到本地存储
      _saveMetricsToStorage(metrics);
      
      // 检查性能警报
      _checkPerformanceAlerts(metrics);
      
      // 重置计数器
      _resetCounters();
      
    } catch (e) {
      Logger.e('收集性能数据失败: $e');
    }
  }
  
  /// 获取CPU使用率（占位实现）
  double _getCpuUsage() {
    // 需要平台特定实现
    return 0.0;
  }
  
  /// 获取电池电量（占位实现）
  double _getBatteryLevel() {
    // 需要平台特定实现
    return 100.0;
  }
  
  /// 保存指标到本地存储
  Future<void> _saveMetricsToStorage(DetailedPerformanceMetrics metrics) async {
    if (_prefs == null) return;
    
    try {
      final key = 'perf_data_${metrics.timestamp.millisecondsSinceEpoch}';
      final dataJson = json.encode(metrics.toJson());
      await _prefs!.setString(key, dataJson);
    } catch (e) {
      Logger.e('保存性能数据失败: $e');
    }
  }
  
  /// 检查性能警报
  void _checkPerformanceAlerts(DetailedPerformanceMetrics metrics) {
    // 检查帧率
    if (metrics.frameRate < _config.frameRateThreshold) {
      final alert = PerformanceAlert(
        type: 'frame_rate',
        message: '帧率过低: ${metrics.frameRate.toStringAsFixed(1)} FPS',
        value: metrics.frameRate,
        threshold: _config.frameRateThreshold,
        timestamp: metrics.timestamp,
        screenName: metrics.screenName,
        context: {'droppedFrames': metrics.droppedFrames},
      );
      _addAlert(alert);
    }
    
    // 检查内存使用
    final memoryMB = metrics.memoryUsage / (1024 * 1024);
    if (memoryMB > _config.memoryThreshold) {
      final alert = PerformanceAlert(
        type: 'memory',
        message: '内存使用过高: ${memoryMB.toStringAsFixed(1)} MB',
        value: memoryMB,
        threshold: _config.memoryThreshold.toDouble(),
        timestamp: metrics.timestamp,
        screenName: metrics.screenName,
        context: {'peakMemory': metrics.memoryPeak},
      );
      _addAlert(alert);
    }
    
    // 检查CPU使用率
    if (metrics.cpuUsage > _config.cpuThreshold) {
      final alert = PerformanceAlert(
        type: 'cpu',
        message: 'CPU使用率过高: ${metrics.cpuUsage.toStringAsFixed(1)}%',
        value: metrics.cpuUsage,
        threshold: _config.cpuThreshold,
        timestamp: metrics.timestamp,
        screenName: metrics.screenName,
      );
      _addAlert(alert);
    }
  }
  
  /// 添加警报
  void _addAlert(PerformanceAlert alert) {
    _alerts.add(alert);
    
    // 限制警报数量
    if (_alerts.length > 100) {
      _alerts.removeAt(0);
    }
    
    Logger.w('性能警报: ${alert.message}');
    
    // 发送到崩溃报告服务
    try {
      final crashReportService = CrashReportService();
      crashReportService.recordUserAction('performance_alert', parameters: alert.toJson());
    } catch (e) {
      Logger.e('发送性能警报失败: $e');
    }
  }
  
  /// 重置计数器
  void _resetCounters() {
    _frameCount = 0;
    _droppedFrameCount = 0;
    _frameTimes.clear();
    _networkRequestCount = 0;
    _networkErrorCount = 0;
    _networkLatencies.clear();
  }
  
  /// 清理过期数据
  Future<void> _cleanupExpiredData() async {
    if (_prefs == null) return;
    
    try {
      final cutoff = DateTime.now().subtract(_config.dataRetentionPeriod);
      final keys = _prefs!.getKeys().where((key) => key.startsWith('perf_data_')).toList();
      
      int removedCount = 0;
      for (final key in keys) {
        final timestampStr = key.replaceFirst('perf_data_', '');
        final timestamp = int.tryParse(timestampStr);
        if (timestamp != null) {
          final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
          if (date.isBefore(cutoff)) {
            await _prefs!.remove(key);
            removedCount++;
          }
        }
      }
      
      // 清理内存中的过期数据
      _performanceHistory.removeWhere((metrics) => metrics.timestamp.isBefore(cutoff));
      _alerts.removeWhere((alert) => alert.timestamp.isBefore(cutoff));
      
      if (removedCount > 0) {
        Logger.d('清理了 $removedCount 条过期性能数据');
      }
    } catch (e) {
      Logger.e('清理过期数据失败: $e');
    }
  }
  
  // =============================================================================
  // 公共API
  // =============================================================================
  
  /// 设置当前屏幕名称
  void setCurrentScreen(String screenName) {
    _currentScreenName = screenName;
  }
  
  /// 记录网络请求
  void recordNetworkRequest({Duration? latency, bool isError = false}) {
    _networkRequestCount++;
    if (isError) {
      _networkErrorCount++;
    }
    if (latency != null) {
      _networkLatencies.add(latency);
    }
  }
  
  /// 更新内存使用情况
  void updateMemoryUsage(int bytes) {
    _currentMemoryUsage = bytes;
    if (bytes > _peakMemoryUsage) {
      _peakMemoryUsage = bytes;
    }
  }
  
  /// 添加自定义指标
  void setCustomMetric(String key, dynamic value) {
    _customMetrics[key] = value;
  }
  
  /// 获取性能历史数据
  List<DetailedPerformanceMetrics> getPerformanceHistory({Duration? period}) {
    if (period == null) return List.from(_performanceHistory);
    
    final cutoff = DateTime.now().subtract(period);
    return _performanceHistory.where((m) => m.timestamp.isAfter(cutoff)).toList();
  }
  
  /// 获取性能警报
  List<PerformanceAlert> getAlerts({Duration? period}) {
    if (period == null) return List.from(_alerts);
    
    final cutoff = DateTime.now().subtract(period);
    return _alerts.where((a) => a.timestamp.isAfter(cutoff)).toList();
  }
  
  /// 获取当前性能状态
  Map<String, dynamic> getCurrentPerformanceStatus() {
    final recent = _performanceHistory.isNotEmpty ? _performanceHistory.last : null;
    
    return {
      'isHealthy': recent != null && 
                   recent.frameRate >= _config.frameRateThreshold &&
                   recent.memoryUsage / (1024 * 1024) <= _config.memoryThreshold &&
                   recent.cpuUsage <= _config.cpuThreshold,
      'currentFrameRate': recent?.frameRate ?? 0.0,
      'currentMemoryUsage': recent?.memoryUsage ?? 0,
      'currentCpuUsage': recent?.cpuUsage ?? 0.0,
      'recentAlerts': _alerts.where((a) => 
          a.timestamp.isAfter(DateTime.now().subtract(const Duration(minutes: 5)))
      ).length,
      'dataPoints': _performanceHistory.length,
      'lastUpdate': recent?.timestamp?.toIso8601String(),
    };
  }
  
  /// 导出性能数据
  Future<String> exportPerformanceData({
    Duration? period,
    List<String>? metrics,
    String format = 'json',
  }) async {
    try {
      final data = getPerformanceHistory(period: period);
      final alerts = getAlerts(period: period);
      
      final export = {
        'exportInfo': {
          'exportTime': DateTime.now().toIso8601String(),
          'period': period?.inMinutes,
          'format': format,
          'dataPoints': data.length,
          'alertCount': alerts.length,
        },
        'config': {
          'frameRateThreshold': _config.frameRateThreshold,
          'memoryThreshold': _config.memoryThreshold,
          'cpuThreshold': _config.cpuThreshold,
          'reportInterval': _config.reportInterval.inSeconds,
        },
        'performanceData': data.map((m) => m.toJson()).toList(),
        'alerts': alerts.map((a) => a.toJson()).toList(),
        'summary': _generateSummary(data),
      };
      
      switch (format.toLowerCase()) {
        case 'json':
          return json.encode(export);
        case 'csv':
          return _exportToCsv(data);
        default:
          return json.encode(export);
      }
    } catch (e) {
      Logger.e('导出性能数据失败: $e');
      rethrow;
    }
  }
  
  /// 生成性能摘要
  Map<String, dynamic> _generateSummary(List<DetailedPerformanceMetrics> data) {
    if (data.isEmpty) return {};
    
    final frameRates = data.map((d) => d.frameRate).toList();
    final memoryUsages = data.map((d) => d.memoryUsage / (1024 * 1024)).toList();
    final cpuUsages = data.map((d) => d.cpuUsage).toList();
    
    return {
      'frameRate': {
        'average': frameRates.reduce((a, b) => a + b) / frameRates.length,
        'min': frameRates.reduce((a, b) => a < b ? a : b),
        'max': frameRates.reduce((a, b) => a > b ? a : b),
      },
      'memoryUsage': {
        'average': memoryUsages.reduce((a, b) => a + b) / memoryUsages.length,
        'min': memoryUsages.reduce((a, b) => a < b ? a : b),
        'max': memoryUsages.reduce((a, b) => a > b ? a : b),
      },
      'cpuUsage': {
        'average': cpuUsages.reduce((a, b) => a + b) / cpuUsages.length,
        'min': cpuUsages.reduce((a, b) => a < b ? a : b),
        'max': cpuUsages.reduce((a, b) => a > b ? a : b),
      },
      'totalDroppedFrames': data.map((d) => d.droppedFrames).reduce((a, b) => a + b),
      'totalNetworkRequests': data.map((d) => d.networkRequests).reduce((a, b) => a + b),
      'totalNetworkErrors': data.map((d) => d.networkErrors).reduce((a, b) => a + b),
    };
  }
  
  /// 导出为CSV格式
  String _exportToCsv(List<DetailedPerformanceMetrics> data) {
    final buffer = StringBuffer();
    
    // CSV头部
    buffer.writeln('timestamp,frameRate,averageFrameTime,maxFrameTime,droppedFrames,totalFrames,cpuUsage,memoryUsage,memoryPeak,batteryLevel,networkRequests,networkErrors,networkLatency,screenName');
    
    // 数据行
    for (final metrics in data) {
      buffer.writeln([
        metrics.timestamp.toIso8601String(),
        metrics.frameRate,
        metrics.averageFrameTime.inMicroseconds,
        metrics.maxFrameTime.inMicroseconds,
        metrics.droppedFrames,
        metrics.totalFrames,
        metrics.cpuUsage,
        metrics.memoryUsage,
        metrics.memoryPeak,
        metrics.batteryLevel,
        metrics.networkRequests,
        metrics.networkErrors,
        metrics.networkLatency.inMilliseconds,
        '"${metrics.screenName}"',
      ].join(','));
    }
    
    return buffer.toString();
  }
  
  /// 清除所有性能数据
  Future<void> clearAllData() async {
    try {
      _performanceHistory.clear();
      _alerts.clear();
      _customMetrics.clear();
      
      if (_prefs != null) {
        final keys = _prefs!.getKeys().where((key) => key.startsWith('perf_data_')).toList();
        for (final key in keys) {
          await _prefs!.remove(key);
        }
      }
      
      Logger.d('已清除所有性能数据');
    } catch (e) {
      Logger.e('清除性能数据失败: $e');
    }
  }
  
  /// 释放资源
  Future<void> dispose() async {
    try {
      _monitoringTimer?.cancel();
      _monitoringTimer = null;
      
      _performanceHistory.clear();
      _alerts.clear();
      _frameTimes.clear();
      _networkLatencies.clear();
      _customMetrics.clear();
      
      _isInitialized = false;
      Logger.d('性能监控服务资源已释放');
    } catch (e) {
      Logger.e('释放性能监控服务资源失败: $e');
    }
  }
}