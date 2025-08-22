import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';

/// 帧率日志配置
class FrameRateLoggerConfig {
  final bool enableDetailedLogging;
  final bool enableJankDetection;
  final bool enableFrameTimeDistribution;
  final Duration logInterval;
  final Duration dataRetentionPeriod;
  final int maxLogEntries;
  final double jankThreshold; // ms
  final double targetFrameRate;
  final bool exportToFile;
  final String? logFilePath;
  
  const FrameRateLoggerConfig({
    this.enableDetailedLogging = true,
    this.enableJankDetection = true,
    this.enableFrameTimeDistribution = true,
    this.logInterval = const Duration(seconds: 1),
    this.dataRetentionPeriod = const Duration(hours: 6),
    this.maxLogEntries = 21600, // 6小时 * 3600秒
    this.jankThreshold = 16.67, // 60fps基准
    this.targetFrameRate = 60.0,
    this.exportToFile = false,
    this.logFilePath,
  });
}

/// 帧率日志条目
class FrameRateLogEntry {
  final DateTime timestamp;
  final double frameRate;
  final Duration averageFrameTime;
  final Duration minFrameTime;
  final Duration maxFrameTime;
  final int totalFrames;
  final int jankFrames;
  final double jankPercentage;
  final List<Duration> frameTimeDistribution;
  final String screenName;
  final Map<String, dynamic> metadata;
  
  const FrameRateLogEntry({
    required this.timestamp,
    required this.frameRate,
    required this.averageFrameTime,
    required this.minFrameTime,
    required this.maxFrameTime,
    required this.totalFrames,
    required this.jankFrames,
    required this.jankPercentage,
    required this.frameTimeDistribution,
    required this.screenName,
    this.metadata = const {},
  });
  
  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'frameRate': frameRate,
    'averageFrameTime': averageFrameTime.inMicroseconds,
    'minFrameTime': minFrameTime.inMicroseconds,
    'maxFrameTime': maxFrameTime.inMicroseconds,
    'totalFrames': totalFrames,
    'jankFrames': jankFrames,
    'jankPercentage': jankPercentage,
    'frameTimeDistribution': frameTimeDistribution.map((d) => d.inMicroseconds).toList(),
    'screenName': screenName,
    'metadata': metadata,
  };
  
  factory FrameRateLogEntry.fromJson(Map<String, dynamic> json) {
    return FrameRateLogEntry(
      timestamp: DateTime.parse(json['timestamp']),
      frameRate: json['frameRate']?.toDouble() ?? 0.0,
      averageFrameTime: Duration(microseconds: json['averageFrameTime'] ?? 0),
      minFrameTime: Duration(microseconds: json['minFrameTime'] ?? 0),
      maxFrameTime: Duration(microseconds: json['maxFrameTime'] ?? 0),
      totalFrames: json['totalFrames'] ?? 0,
      jankFrames: json['jankFrames'] ?? 0,
      jankPercentage: json['jankPercentage']?.toDouble() ?? 0.0,
      frameTimeDistribution: (json['frameTimeDistribution'] as List<dynamic>? ?? [])
          .map((d) => Duration(microseconds: d))
          .toList(),
      screenName: json['screenName'] ?? '',
      metadata: json['metadata'] ?? {},
    );
  }
}

/// Jank事件
class JankEvent {
  final DateTime timestamp;
  final Duration frameTime;
  final double expectedFrameTime;
  final double severity; // 严重程度倍数
  final String screenName;
  final Map<String, dynamic>? context;
  
  const JankEvent({
    required this.timestamp,
    required this.frameTime,
    required this.expectedFrameTime,
    required this.severity,
    required this.screenName,
    this.context,
  });
  
  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'frameTime': frameTime.inMicroseconds,
    'expectedFrameTime': expectedFrameTime,
    'severity': severity,
    'screenName': screenName,
    'context': context,
  };
}

/// 帧率统计摘要
class FrameRateStatsSummary {
  final Duration period;
  final double averageFrameRate;
  final double minFrameRate;
  final double maxFrameRate;
  final double frameRateStdDev;
  final int totalFrames;
  final int totalJankFrames;
  final double overallJankPercentage;
  final List<JankEvent> topJankEvents;
  final Map<String, double> screenFrameRates;
  final Map<String, int> frameTimeDistribution;
  
  const FrameRateStatsSummary({
    required this.period,
    required this.averageFrameRate,
    required this.minFrameRate,
    required this.maxFrameRate,
    required this.frameRateStdDev,
    required this.totalFrames,
    required this.totalJankFrames,
    required this.overallJankPercentage,
    required this.topJankEvents,
    required this.screenFrameRates,
    required this.frameTimeDistribution,
  });
  
  Map<String, dynamic> toJson() => {
    'period': period.inMinutes,
    'averageFrameRate': averageFrameRate,
    'minFrameRate': minFrameRate,
    'maxFrameRate': maxFrameRate,
    'frameRateStdDev': frameRateStdDev,
    'totalFrames': totalFrames,
    'totalJankFrames': totalJankFrames,
    'overallJankPercentage': overallJankPercentage,
    'topJankEvents': topJankEvents.map((e) => e.toJson()).toList(),
    'screenFrameRates': screenFrameRates,
    'frameTimeDistribution': frameTimeDistribution,
  };
}

/// 帧率日志服务
class FrameRateLoggerService {
  static final FrameRateLoggerService _instance = FrameRateLoggerService._internal();
  factory FrameRateLoggerService() => _instance;
  FrameRateLoggerService._internal();
  
  static const String _tag = 'FrameRateLoggerService';
  bool _isInitialized = false;
  
  FrameRateLoggerConfig _config = const FrameRateLoggerConfig();
  
  // 日志数据
  final List<FrameRateLogEntry> _logEntries = [];
  final List<JankEvent> _jankEvents = [];
  
  // 帧率监控
  Timer? _loggingTimer;
  final List<Duration> _frameTimes = [];
  DateTime? _lastFrameTime;
  int _frameCount = 0;
  
  // 当前状态
  String _currentScreenName = '';
  final Map<String, dynamic> _currentMetadata = {};
  
  // 本地存储
  SharedPreferences? _prefs;
  File? _logFile;
  
  /// 初始化帧率日志服务
  Future<void> initialize({FrameRateLoggerConfig? config}) async {
    if (_isInitialized) return;
    
    try {
      _config = config ?? const FrameRateLoggerConfig();
      
      // 初始化本地存储
      _prefs = await SharedPreferences.getInstance();
      
      // 初始化日志文件
      if (_config.exportToFile) {
        await _initializeLogFile();
      }
      
      // 加载历史数据
      await _loadHistoricalData();
      
      // 启动帧率监控
      SchedulerBinding.instance.addPersistentFrameCallback(_onFrame);
      
      // 启动定期日志记录
      _startPeriodicLogging();
      
      // 清理过期数据
      await _cleanupExpiredData();
      
      _isInitialized = true;
      Logger.d('帧率日志服务初始化完成');
      
    } catch (e, stackTrace) {
      Logger.e('帧率日志服务初始化失败: $e', stackTrace: stackTrace);
      rethrow;
    }
  }
  
  /// 初始化日志文件
  Future<void> _initializeLogFile() async {
    try {
      final logPath = _config.logFilePath ?? 'frame_rate_logs.txt';
      _logFile = File(logPath);
      
      if (!await _logFile!.exists()) {
        await _logFile!.create(recursive: true);
        await _logFile!.writeAsString('# Frame Rate Log\n# Started: ${DateTime.now().toIso8601String()}\n\n');
      }
      
      Logger.d('帧率日志文件初始化: ${_logFile!.path}');
    } catch (e) {
      Logger.e('初始化日志文件失败: $e');
    }
  }
  
  /// 加载历史数据
  Future<void> _loadHistoricalData() async {
    if (_prefs == null) return;
    
    try {
      final keys = _prefs!.getKeys().where((key) => key.startsWith('frame_log_')).toList();
      
      for (final key in keys) {
        final dataJson = _prefs!.getString(key);
        if (dataJson != null) {
          final data = json.decode(dataJson) as Map<String, dynamic>;
          final entry = FrameRateLogEntry.fromJson(data);
          _logEntries.add(entry);
        }
      }
      
      // 按时间排序
      _logEntries.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      Logger.d('加载了 ${_logEntries.length} 条帧率日志');
    } catch (e) {
      Logger.e('加载历史帧率日志失败: $e');
    }
  }
  
  /// 启动定期日志记录
  void _startPeriodicLogging() {
    _loggingTimer = Timer.periodic(_config.logInterval, (_) {
      _recordFrameRateLog();
    });
    
    Logger.d('帧率日志定期记录已启动，间隔: ${_config.logInterval}');
  }
  
  /// 帧回调处理
  void _onFrame(Duration timestamp) {
    _frameCount++;
    
    if (_lastFrameTime != null) {
      final now = DateTime.now();
      final frameTime = now.difference(_lastFrameTime!);
      _frameTimes.add(frameTime);
      
      // 检测Jank
      if (_config.enableJankDetection && frameTime.inMilliseconds > _config.jankThreshold) {
        final severity = frameTime.inMilliseconds / _config.jankThreshold;
        final jankEvent = JankEvent(
          timestamp: now,
          frameTime: frameTime,
          expectedFrameTime: _config.jankThreshold,
          severity: severity,
          screenName: _currentScreenName,
          context: Map.from(_currentMetadata),
        );
        _jankEvents.add(jankEvent);
        
        // 限制Jank事件数量
        if (_jankEvents.length > 1000) {
          _jankEvents.removeAt(0);
        }
        
        Logger.w('检测到Jank: ${frameTime.inMilliseconds}ms (${severity.toStringAsFixed(1)}x)');
      }
      
      // 限制帧时间历史记录数量
      if (_frameTimes.length > 1000) {
        _frameTimes.removeAt(0);
      }
    }
    
    _lastFrameTime = DateTime.now();
  }
  
  /// 记录帧率日志
  void _recordFrameRateLog() {
    if (_frameTimes.isEmpty) return;
    
    try {
      final now = DateTime.now();
      
      // 计算帧率指标
      final frameRate = _frameCount / _config.logInterval.inSeconds;
      final avgFrameTime = _frameTimes.reduce((a, b) => a + b) ~/ _frameTimes.length;
      final minFrameTime = _frameTimes.reduce((a, b) => a < b ? a : b);
      final maxFrameTime = _frameTimes.reduce((a, b) => a > b ? a : b);
      
      // 计算Jank统计
      final jankFrames = _frameTimes.where((t) => t.inMilliseconds > _config.jankThreshold).length;
      final jankPercentage = _frameTimes.isNotEmpty ? (jankFrames / _frameTimes.length) * 100 : 0.0;
      
      // 创建日志条目
      final logEntry = FrameRateLogEntry(
        timestamp: now,
        frameRate: frameRate,
        averageFrameTime: avgFrameTime,
        minFrameTime: minFrameTime,
        maxFrameTime: maxFrameTime,
        totalFrames: _frameCount,
        jankFrames: jankFrames,
        jankPercentage: jankPercentage,
        frameTimeDistribution: _config.enableFrameTimeDistribution ? List.from(_frameTimes) : [],
        screenName: _currentScreenName,
        metadata: Map.from(_currentMetadata),
      );
      
      _logEntries.add(logEntry);
      
      // 限制日志条目数量
      if (_logEntries.length > _config.maxLogEntries) {
        _logEntries.removeAt(0);
      }
      
      // 保存到本地存储
      if (_config.enableDetailedLogging) {
        _saveLogEntryToStorage(logEntry);
      }
      
      // 写入日志文件
      if (_config.exportToFile && _logFile != null) {
        _writeToLogFile(logEntry);
      }
      
      // 重置计数器
      _frameCount = 0;
      _frameTimes.clear();
      
    } catch (e) {
      Logger.e('记录帧率日志失败: $e');
    }
  }
  
  /// 保存日志条目到本地存储
  Future<void> _saveLogEntryToStorage(FrameRateLogEntry entry) async {
    if (_prefs == null) return;
    
    try {
      final key = 'frame_log_${entry.timestamp.millisecondsSinceEpoch}';
      final dataJson = json.encode(entry.toJson());
      await _prefs!.setString(key, dataJson);
    } catch (e) {
      Logger.e('保存帧率日志失败: $e');
    }
  }
  
  /// 写入日志文件
  Future<void> _writeToLogFile(FrameRateLogEntry entry) async {
    try {
      final logLine = '${entry.timestamp.toIso8601String()},${entry.frameRate.toStringAsFixed(2)},${entry.averageFrameTime.inMicroseconds},${entry.jankPercentage.toStringAsFixed(2)},${entry.screenName}\n';
      await _logFile!.writeAsString(logLine, mode: FileMode.append);
    } catch (e) {
      Logger.e('写入日志文件失败: $e');
    }
  }
  
  /// 清理过期数据
  Future<void> _cleanupExpiredData() async {
    if (_prefs == null) return;
    
    try {
      final cutoff = DateTime.now().subtract(_config.dataRetentionPeriod);
      final keys = _prefs!.getKeys().where((key) => key.startsWith('frame_log_')).toList();
      
      int removedCount = 0;
      for (final key in keys) {
        final timestampStr = key.replaceFirst('frame_log_', '');
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
      _logEntries.removeWhere((entry) => entry.timestamp.isBefore(cutoff));
      _jankEvents.removeWhere((event) => event.timestamp.isBefore(cutoff));
      
      if (removedCount > 0) {
        Logger.d('清理了 $removedCount 条过期帧率日志');
      }
    } catch (e) {
      Logger.e('清理过期帧率日志失败: $e');
    }
  }
  
  // =============================================================================
  // 公共API
  // =============================================================================
  
  /// 设置当前屏幕名称
  void setCurrentScreen(String screenName) {
    _currentScreenName = screenName;
  }
  
  /// 设置元数据
  void setMetadata(String key, dynamic value) {
    _currentMetadata[key] = value;
  }
  
  /// 清除元数据
  void clearMetadata() {
    _currentMetadata.clear();
  }
  
  /// 获取帧率日志
  List<FrameRateLogEntry> getFrameRateLogs({Duration? period}) {
    if (period == null) return List.from(_logEntries);
    
    final cutoff = DateTime.now().subtract(period);
    return _logEntries.where((entry) => entry.timestamp.isAfter(cutoff)).toList();
  }
  
  /// 获取Jank事件
  List<JankEvent> getJankEvents({Duration? period}) {
    if (period == null) return List.from(_jankEvents);
    
    final cutoff = DateTime.now().subtract(period);
    return _jankEvents.where((event) => event.timestamp.isAfter(cutoff)).toList();
  }
  
  /// 获取帧率统计摘要
  FrameRateStatsSummary getStatsSummary({Duration? period}) {
    final logs = getFrameRateLogs(period: period);
    final jankEvents = getJankEvents(period: period);
    
    if (logs.isEmpty) {
      return FrameRateStatsSummary(
        period: period ?? const Duration(hours: 24),
        averageFrameRate: 0.0,
        minFrameRate: 0.0,
        maxFrameRate: 0.0,
        frameRateStdDev: 0.0,
        totalFrames: 0,
        totalJankFrames: 0,
        overallJankPercentage: 0.0,
        topJankEvents: [],
        screenFrameRates: {},
        frameTimeDistribution: {},
      );
    }
    
    final frameRates = logs.map((l) => l.frameRate).toList();
    final avgFrameRate = frameRates.reduce((a, b) => a + b) / frameRates.length;
    final minFrameRate = frameRates.reduce((a, b) => a < b ? a : b);
    final maxFrameRate = frameRates.reduce((a, b) => a > b ? a : b);
    
    // 计算标准差
    final variance = frameRates.map((fr) => (fr - avgFrameRate) * (fr - avgFrameRate)).reduce((a, b) => a + b) / frameRates.length;
    final stdDev = variance > 0 ? variance.sqrt() : 0.0;
    
    // 按屏幕统计帧率
    final screenFrameRates = <String, List<double>>{};
    for (final log in logs) {
      screenFrameRates.putIfAbsent(log.screenName, () => []).add(log.frameRate);
    }
    final avgScreenFrameRates = screenFrameRates.map((screen, rates) => 
        MapEntry(screen, rates.reduce((a, b) => a + b) / rates.length));
    
    // 帧时间分布
    final frameTimeDistribution = <String, int>{};
    for (final log in logs) {
      for (final frameTime in log.frameTimeDistribution) {
        final bucket = '${(frameTime.inMilliseconds / 5).floor() * 5}-${(frameTime.inMilliseconds / 5).floor() * 5 + 5}ms';
        frameTimeDistribution[bucket] = (frameTimeDistribution[bucket] ?? 0) + 1;
      }
    }
    
    // 顶级Jank事件
    final topJankEvents = List.from(jankEvents)
      ..sort((a, b) => b.severity.compareTo(a.severity))
      ..take(10).toList();
    
    return FrameRateStatsSummary(
      period: period ?? const Duration(hours: 24),
      averageFrameRate: avgFrameRate,
      minFrameRate: minFrameRate,
      maxFrameRate: maxFrameRate,
      frameRateStdDev: stdDev,
      totalFrames: logs.map((l) => l.totalFrames).reduce((a, b) => a + b),
      totalJankFrames: logs.map((l) => l.jankFrames).reduce((a, b) => a + b),
      overallJankPercentage: logs.map((l) => l.jankPercentage).reduce((a, b) => a + b) / logs.length,
      topJankEvents: topJankEvents,
      screenFrameRates: avgScreenFrameRates,
      frameTimeDistribution: frameTimeDistribution,
    );
  }
  
  /// 导出帧率日志
  Future<String> exportFrameRateLogs({
    Duration? period,
    String format = 'json',
  }) async {
    try {
      final logs = getFrameRateLogs(period: period);
      final jankEvents = getJankEvents(period: period);
      final summary = getStatsSummary(period: period);
      
      final export = {
        'exportInfo': {
          'exportTime': DateTime.now().toIso8601String(),
          'period': period?.inMinutes,
          'format': format,
          'logCount': logs.length,
          'jankEventCount': jankEvents.length,
        },
        'config': {
          'jankThreshold': _config.jankThreshold,
          'targetFrameRate': _config.targetFrameRate,
          'logInterval': _config.logInterval.inSeconds,
        },
        'logs': logs.map((l) => l.toJson()).toList(),
        'jankEvents': jankEvents.map((e) => e.toJson()).toList(),
        'summary': summary.toJson(),
      };
      
      switch (format.toLowerCase()) {
        case 'json':
          return json.encode(export);
        case 'csv':
          return _exportLogsToCsv(logs);
        default:
          return json.encode(export);
      }
    } catch (e) {
      Logger.e('导出帧率日志失败: $e');
      rethrow;
    }
  }
  
  /// 导出为CSV格式
  String _exportLogsToCsv(List<FrameRateLogEntry> logs) {
    final buffer = StringBuffer();
    
    // CSV头部
    buffer.writeln('timestamp,frameRate,averageFrameTime,minFrameTime,maxFrameTime,totalFrames,jankFrames,jankPercentage,screenName');
    
    // 数据行
    for (final log in logs) {
      buffer.writeln([
        log.timestamp.toIso8601String(),
        log.frameRate,
        log.averageFrameTime.inMicroseconds,
        log.minFrameTime.inMicroseconds,
        log.maxFrameTime.inMicroseconds,
        log.totalFrames,
        log.jankFrames,
        log.jankPercentage,
        '"${log.screenName}"',
      ].join(','));
    }
    
    return buffer.toString();
  }
  
  /// 清除所有日志数据
  Future<void> clearAllLogs() async {
    try {
      _logEntries.clear();
      _jankEvents.clear();
      _frameTimes.clear();
      _currentMetadata.clear();
      
      if (_prefs != null) {
        final keys = _prefs!.getKeys().where((key) => key.startsWith('frame_log_')).toList();
        for (final key in keys) {
          await _prefs!.remove(key);
        }
      }
      
      if (_logFile != null && await _logFile!.exists()) {
        await _logFile!.delete();
        await _initializeLogFile();
      }
      
      Logger.d('已清除所有帧率日志');
    } catch (e) {
      Logger.e('清除帧率日志失败: $e');
    }
  }
  
  /// 释放资源
  Future<void> dispose() async {
    try {
      _loggingTimer?.cancel();
      _loggingTimer = null;
      
      _logEntries.clear();
      _jankEvents.clear();
      _frameTimes.clear();
      _currentMetadata.clear();
      
      _isInitialized = false;
      Logger.d('帧率日志服务资源已释放');
    } catch (e) {
      Logger.e('释放帧率日志服务资源失败: $e');
    }
  }
}

/// 扩展方法
extension on double {
  double sqrt() {
    if (this < 0) return 0.0;
    double x = this;
    double prev = 0.0;
    while ((x - prev).abs() > 0.0001) {
      prev = x;
      x = (x + this / x) / 2;
    }
    return x;
  }
}