import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter/scheduler.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';

/// 崩溃报告配置
class CrashReportConfig {
  final bool enableCrashlytics;
  final bool enableSentry;
  final bool enableLocalStorage;
  final bool enablePerformanceMonitoring;
  final bool enableUserTracking;
  final String? sentryDsn;
  final Duration performanceReportInterval;
  final int maxLocalReports;
  
  const CrashReportConfig({
    this.enableCrashlytics = true,
    this.enableSentry = false,
    this.enableLocalStorage = true,
    this.enablePerformanceMonitoring = true,
    this.enableUserTracking = true,
    this.sentryDsn,
    this.performanceReportInterval = const Duration(minutes: 5),
    this.maxLocalReports = 100,
  });
}

/// 性能指标
class PerformanceMetrics {
  final double frameRate;
  final Duration frameTime;
  final int droppedFrames;
  final double cpuUsage;
  final int memoryUsage;
  final DateTime timestamp;
  
  const PerformanceMetrics({
    required this.frameRate,
    required this.frameTime,
    required this.droppedFrames,
    required this.cpuUsage,
    required this.memoryUsage,
    required this.timestamp,
  });
  
  Map<String, dynamic> toJson() => {
    'frameRate': frameRate,
    'frameTime': frameTime.inMicroseconds,
    'droppedFrames': droppedFrames,
    'cpuUsage': cpuUsage,
    'memoryUsage': memoryUsage,
    'timestamp': timestamp.toIso8601String(),
  };
}

/// 用户行为事件
class UserActionEvent {
  final String action;
  final Map<String, dynamic>? parameters;
  final DateTime timestamp;
  final String? screenName;
  
  const UserActionEvent({
    required this.action,
    this.parameters,
    required this.timestamp,
    this.screenName,
  });
  
  Map<String, dynamic> toJson() => {
    'action': action,
    'parameters': parameters,
    'timestamp': timestamp.toIso8601String(),
    'screenName': screenName,
  };
}

/// 崩溃报告服务
class CrashReportService {
  static final CrashReportService _instance = CrashReportService._internal();
  factory CrashReportService() => _instance;
  CrashReportService._internal();
  
  static const String _tag = 'CrashReportService';
  bool _isInitialized = false;
  
  CrashReportConfig _config = const CrashReportConfig();
  
  // 性能监控相关
  Timer? _performanceTimer;
  final List<PerformanceMetrics> _performanceHistory = [];
  int _frameCount = 0;
  int _droppedFrameCount = 0;
  DateTime? _lastFrameTime;
  
  // 用户行为追踪
  final List<UserActionEvent> _userActions = [];
  String? _currentUserId;
  String? _currentScreenName;
  final Map<String, String> _customKeys = {};
  
  // 设备和应用信息缓存
  Map<String, dynamic>? _deviceInfo;
  PackageInfo? _packageInfo;
  
  // 本地存储
  SharedPreferences? _prefs;
  
  /// 初始化崩溃报告服务
  Future<void> initialize({CrashReportConfig? config}) async {
    if (_isInitialized) return;
    
    try {
      _config = config ?? const CrashReportConfig();
      
      // 初始化本地存储
      if (_config.enableLocalStorage) {
        _prefs = await SharedPreferences.getInstance();
      }
      
      // 获取设备和应用信息
      await _initializeDeviceInfo();
      
      // 初始化Firebase Crashlytics
      if (_config.enableCrashlytics) {
        await _initializeCrashlytics();
      }
      
      // 初始化Sentry
      if (_config.enableSentry && _config.sentryDsn != null) {
        await _initializeSentry();
      }
      
      // 捕获Flutter框架错误
      FlutterError.onError = (FlutterErrorDetails details) {
        _handleFlutterError(details);
      };
      
      // 捕获异步错误
      PlatformDispatcher.instance.onError = (error, stack) {
        _handleAsyncError(error, stack);
        return true;
      };
      
      // 启动性能监控
      if (_config.enablePerformanceMonitoring) {
        _startPerformanceMonitoring();
      }
      
      // 清理旧的本地报告
      await _cleanupOldReports();
      
      _isInitialized = true;
      Logger.d('崩溃报告服务初始化完成');
      
    } catch (e, stackTrace) {
      Logger.e('崩溃报告服务初始化失败: $e', stackTrace: stackTrace);
      rethrow;
    }
  }
  
  /// 初始化设备信息
  Future<void> _initializeDeviceInfo() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      _packageInfo = await PackageInfo.fromPlatform();
      
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        _deviceInfo = {
          'platform': 'android',
          'model': androidInfo.model,
          'manufacturer': androidInfo.manufacturer,
          'version': androidInfo.version.release,
          'sdkInt': androidInfo.version.sdkInt,
          'brand': androidInfo.brand,
          'device': androidInfo.device,
          'hardware': androidInfo.hardware,
        };
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        _deviceInfo = {
          'platform': 'ios',
          'model': iosInfo.model,
          'name': iosInfo.name,
          'systemName': iosInfo.systemName,
          'systemVersion': iosInfo.systemVersion,
          'identifierForVendor': iosInfo.identifierForVendor,
          'isPhysicalDevice': iosInfo.isPhysicalDevice,
        };
      }
    } catch (e) {
      Logger.e('获取设备信息失败: $e');
    }
  }
  
  /// 初始化Firebase Crashlytics
  Future<void> _initializeCrashlytics() async {
    try {
      // 注意：这里需要添加firebase_crashlytics依赖
      // await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
      Logger.d('Firebase Crashlytics初始化完成（占位实现）');
    } catch (e) {
      Logger.e('Firebase Crashlytics初始化失败: $e');
    }
  }
  
  /// 初始化Sentry
  Future<void> _initializeSentry() async {
    try {
      // 注意：这里需要添加sentry_flutter依赖
      // await SentryFlutter.init(
      //   (options) {
      //     options.dsn = _config.sentryDsn;
      //     options.tracesSampleRate = 1.0;
      //   },
      // );
      Logger.d('Sentry初始化完成（占位实现）');
    } catch (e) {
      Logger.e('Sentry初始化失败: $e');
    }
  }
  
  /// 启动性能监控
  void _startPerformanceMonitoring() {
    // 监听帧率
    SchedulerBinding.instance.addPersistentFrameCallback(_onFrame);
    
    // 定期收集性能数据
    _performanceTimer = Timer.periodic(_config.performanceReportInterval, (_) {
      _collectPerformanceMetrics();
    });
    
    Logger.d('性能监控已启动');
  }
  
  /// 帧回调处理
  void _onFrame(Duration timestamp) {
    _frameCount++;
    
    if (_lastFrameTime != null) {
      final frameDuration = timestamp - Duration(microseconds: _lastFrameTime!.microsecondsSinceEpoch);
      
      // 检测掉帧（假设60fps，每帧16.67ms）
      if (frameDuration.inMilliseconds > 16.67 * 2) {
        _droppedFrameCount++;
      }
    }
    
    _lastFrameTime = DateTime.now();
  }
  
  /// 收集性能指标
  void _collectPerformanceMetrics() {
    try {
      final now = DateTime.now();
      final frameRate = _frameCount / _config.performanceReportInterval.inSeconds;
      final avgFrameTime = _config.performanceReportInterval ~/ _frameCount;
      
      final metrics = PerformanceMetrics(
        frameRate: frameRate,
        frameTime: avgFrameTime,
        droppedFrames: _droppedFrameCount,
        cpuUsage: 0.0, // 需要平台特定实现
        memoryUsage: 0, // 需要平台特定实现
        timestamp: now,
      );
      
      _performanceHistory.add(metrics);
      
      // 限制历史记录数量
      if (_performanceHistory.length > 100) {
        _performanceHistory.removeAt(0);
      }
      
      // 重置计数器
      _frameCount = 0;
      _droppedFrameCount = 0;
      
      // 如果性能异常，记录警告
      if (frameRate < 30 || _droppedFrameCount > 10) {
        Logger.w('性能异常检测: FPS=$frameRate, 掉帧=$_droppedFrameCount');
        _reportPerformanceIssue(metrics);
      }
      
    } catch (e) {
      Logger.e('收集性能指标失败: $e');
    }
  }
  
  /// 报告性能问题
  void _reportPerformanceIssue(PerformanceMetrics metrics) {
    final report = {
      'type': 'performance_issue',
      'metrics': metrics.toJson(),
      'userActions': _userActions.take(10).map((e) => e.toJson()).toList(),
      'customKeys': _customKeys,
      'timestamp': DateTime.now().toIso8601String(),
    };
    
    _reportToServices(report);
  }
  
  /// 清理旧报告
  Future<void> _cleanupOldReports() async {
    if (_prefs == null) return;
    
    try {
      final keys = _prefs!.getKeys().where((key) => key.startsWith('crash_report_')).toList();
      
      if (keys.length > _config.maxLocalReports) {
        // 删除最旧的报告
        keys.sort();
        final toRemove = keys.take(keys.length - _config.maxLocalReports);
        for (final key in toRemove) {
          await _prefs!.remove(key);
        }
        Logger.d('清理了 ${toRemove.length} 个旧的崩溃报告');
      }
    } catch (e) {
      Logger.e('清理旧报告失败: $e');
    }
  }
  
  /// 处理Flutter框架错误
  void _handleFlutterError(FlutterErrorDetails details) {
    try {
      final errorReport = _createErrorReport(
        error: details.exception,
        stackTrace: details.stack,
        context: details.context?.toString(),
        library: details.library,
        informationCollector: details.informationCollector?.call().map((e) => e.toString()),
      );
      
      _reportError(errorReport);
      
      // 在调试模式下也打印到控制台
      if (kDebugMode) {
        FlutterError.presentError(details);
      }
    } catch (e) {
      // Logger.error(_tag, 'Error handling Flutter error', e);
    }
  }
  
  /// 处理异步错误
  void _handleAsyncError(Object error, StackTrace stackTrace) {
    try {
      final errorReport = _createErrorReport(
        error: error,
        stackTrace: stackTrace,
        context: 'Async Error',
      );
      
      _reportError(errorReport);
    } catch (e) {
      // Logger.error(_tag, 'Error handling async error', e);
    }
  }
  
  /// 创建错误报告
  Map<String, dynamic> _createErrorReport({
    required Object error,
    StackTrace? stackTrace,
    String? context,
    String? library,
    Iterable<String>? informationCollector,
  }) {
    return {
      'timestamp': DateTime.now().toIso8601String(),
      'error': error.toString(),
      'stackTrace': stackTrace?.toString(),
      'context': context,
      'library': library,
      'informationCollector': informationCollector?.join('\n'),
      'platform': _getPlatformInfo(),
      'appInfo': _getAppInfo(),
    };
  }
  
  /// 获取平台信息
  Map<String, dynamic> _getPlatformInfo() {
    return {
      'operatingSystem': Platform.operatingSystem,
      'operatingSystemVersion': Platform.operatingSystemVersion,
      'isAndroid': Platform.isAndroid,
      'isIOS': Platform.isIOS,
      'isWeb': kIsWeb,
      'isDebugMode': kDebugMode,
      'isProfileMode': kProfileMode,
      'isReleaseMode': kReleaseMode,
    };
  }
  
  /// 获取应用信息
  Map<String, dynamic> _getAppInfo() {
    return {
      'version': _packageInfo?.version ?? 'unknown',
      'buildNumber': _packageInfo?.buildNumber ?? 'unknown',
      'packageName': _packageInfo?.packageName ?? 'unknown',
      'appName': _packageInfo?.appName ?? 'unknown',
    };
  }
  
  /// 获取设备信息
  Map<String, dynamic> _getDeviceInfo() {
    return _deviceInfo ?? {
      'platform': Platform.operatingSystem,
      'version': Platform.operatingSystemVersion,
    };
  }
  
  /// 报告错误
  void _reportError(Map<String, dynamic> errorReport) {
    try {
      // 添加设备和用户信息
      errorReport['deviceInfo'] = _getDeviceInfo();
      errorReport['userId'] = _currentUserId;
      errorReport['screenName'] = _currentScreenName;
      errorReport['customKeys'] = Map.from(_customKeys);
      errorReport['recentUserActions'] = _userActions.take(10).map((e) => e.toJson()).toList();
      errorReport['performanceMetrics'] = _performanceHistory.take(5).map((e) => e.toJson()).toList();
      
      // 记录到本地日志
      Logger.e(
        '崩溃报告: ${errorReport['error']}',
        stackTrace: errorReport['stackTrace'] != null 
            ? StackTrace.fromString(errorReport['stackTrace']) 
            : null,
      );
      
      // 发送到各个服务
      _reportToServices(errorReport);
      
      // 保存到本地存储
      if (_config.enableLocalStorage) {
        _saveToLocalStorage(errorReport);
      }
      
    } catch (e) {
      Logger.e('报告错误失败: $e');
    }
  }
  
  /// 发送到各个监控服务
  void _reportToServices(Map<String, dynamic> report) {
    // Firebase Crashlytics
    if (_config.enableCrashlytics) {
      _sendToCrashlytics(report);
    }
    
    // Sentry
    if (_config.enableSentry) {
      _sendToSentry(report);
    }
    
    // 自定义远程服务
    if (kReleaseMode) {
      _sendToRemoteService(report);
    }
  }
  
  /// 发送到Firebase Crashlytics
  void _sendToCrashlytics(Map<String, dynamic> report) {
    try {
      // 实际实现需要firebase_crashlytics依赖
      // FirebaseCrashlytics.instance.recordError(
      //   report['error'],
      //   report['stackTrace'] != null ? StackTrace.fromString(report['stackTrace']) : null,
      //   fatal: true,
      // );
      Logger.d('已发送到Firebase Crashlytics（占位实现）');
    } catch (e) {
      Logger.e('发送到Firebase Crashlytics失败: $e');
    }
  }
  
  /// 发送到Sentry
  void _sendToSentry(Map<String, dynamic> report) {
    try {
      // 实际实现需要sentry_flutter依赖
      // Sentry.captureException(
      //   report['error'],
      //   stackTrace: report['stackTrace'] != null ? StackTrace.fromString(report['stackTrace']) : null,
      // );
      Logger.d('已发送到Sentry（占位实现）');
    } catch (e) {
      Logger.e('发送到Sentry失败: $e');
    }
  }
  
  /// 发送到远程服务
  Future<void> _sendToRemoteService(Map<String, dynamic> errorReport) async {
    try {
      Logger.d('发送崩溃报告到远程服务');
      
      // 示例：发送到自定义API
      // final response = await http.post(
      //   Uri.parse('https://api.gulingtong.com/crash-reports'),
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': 'Bearer YOUR_API_TOKEN',
      //   },
      //   body: json.encode(errorReport),
      // );
      // 
      // if (response.statusCode == 200) {
      //   Logger.d('崩溃报告发送成功');
      // } else {
      //   Logger.e('崩溃报告发送失败: ${response.statusCode}');
      // }
      
    } catch (e) {
      Logger.e('发送崩溃报告到远程服务失败: $e');
    }
  }
  
  /// 保存到本地存储
  Future<void> _saveToLocalStorage(Map<String, dynamic> errorReport) async {
    if (_prefs == null) return;
    
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final key = 'crash_report_$timestamp';
      final reportJson = json.encode(errorReport);
      
      await _prefs!.setString(key, reportJson);
      Logger.d('崩溃报告已保存到本地存储: $key');
      
    } catch (e) {
      Logger.e('保存崩溃报告到本地存储失败: $e');
    }
  }
  
  /// 手动报告错误
  void reportError(Object error, StackTrace? stackTrace, {String? context}) {
    try {
      final errorReport = _createErrorReport(
        error: error,
        stackTrace: stackTrace,
        context: context ?? 'Manual Report',
      );
      
      _reportError(errorReport);
    } catch (e) {
      // Logger.error(_tag, 'Failed to manually report error', e);
    }
  }
  
  /// 记录用户操作
  void recordUserAction(String action, {Map<String, dynamic>? parameters}) {
    if (!_config.enableUserTracking) return;
    
    try {
      final event = UserActionEvent(
        action: action,
        parameters: parameters,
        timestamp: DateTime.now(),
        screenName: _currentScreenName,
      );
      
      _userActions.add(event);
      
      // 限制用户行为历史记录数量
      if (_userActions.length > 50) {
        _userActions.removeAt(0);
      }
      
      Logger.d('用户操作记录: $action');
      
      // 在生产环境中发送到分析服务
      if (kReleaseMode) {
        _sendUserActionToAnalytics(event);
      }
      
    } catch (e) {
      Logger.e('记录用户操作失败: $e');
    }
  }
  
  /// 发送用户行为到分析服务
  void _sendUserActionToAnalytics(UserActionEvent event) {
    try {
      // Firebase Analytics
      // FirebaseAnalytics.instance.logEvent(
      //   name: event.action,
      //   parameters: event.parameters,
      // );
      
      // 自定义分析服务
      // AnalyticsService.instance.track(event.action, event.parameters);
      
      Logger.d('用户行为已发送到分析服务（占位实现）');
    } catch (e) {
      Logger.e('发送用户行为到分析服务失败: $e');
    }
  }
  
  /// 设置用户标识
  void setUserId(String userId) {
    try {
      _currentUserId = userId;
      
      // Firebase Crashlytics
      if (_config.enableCrashlytics) {
        // FirebaseCrashlytics.instance.setUserIdentifier(userId);
      }
      
      // Sentry
      if (_config.enableSentry) {
        // Sentry.configureScope((scope) => scope.user = SentryUser(id: userId));
      }
      
      Logger.d('用户ID已设置: $userId');
    } catch (e) {
      Logger.e('设置用户ID失败: $e');
    }
  }
  
  /// 设置当前屏幕名称
  void setCurrentScreen(String screenName) {
    try {
      _currentScreenName = screenName;
      Logger.d('当前屏幕: $screenName');
    } catch (e) {
      Logger.e('设置当前屏幕失败: $e');
    }
  }
  
  /// 添加自定义键值对
  void setCustomKey(String key, String value) {
    try {
      _customKeys[key] = value;
      
      // Firebase Crashlytics
      if (_config.enableCrashlytics) {
        // FirebaseCrashlytics.instance.setCustomKey(key, value);
      }
      
      // Sentry
      if (_config.enableSentry) {
        // Sentry.configureScope((scope) => scope.setTag(key, value));
      }
      
      Logger.d('自定义键值对已设置: $key = $value');
    } catch (e) {
      Logger.e('设置自定义键值对失败: $e');
    }
  }
  
  /// 获取性能历史数据
  List<PerformanceMetrics> getPerformanceHistory({Duration? period}) {
    if (period == null) return List.from(_performanceHistory);
    
    final cutoff = DateTime.now().subtract(period);
    return _performanceHistory.where((m) => m.timestamp.isAfter(cutoff)).toList();
  }
  
  /// 获取用户行为历史
  List<UserActionEvent> getUserActionHistory({Duration? period}) {
    if (period == null) return List.from(_userActions);
    
    final cutoff = DateTime.now().subtract(period);
    return _userActions.where((a) => a.timestamp.isAfter(cutoff)).toList();
  }
  
  /// 导出性能数据
  Future<String> exportPerformanceData({Duration? period}) async {
    try {
      final data = getPerformanceHistory(period: period);
      final export = {
        'exportTime': DateTime.now().toIso8601String(),
        'period': period?.inMinutes,
        'deviceInfo': _getDeviceInfo(),
        'appInfo': _getAppInfo(),
        'performanceData': data.map((m) => m.toJson()).toList(),
      };
      
      return json.encode(export);
    } catch (e) {
      Logger.e('导出性能数据失败: $e');
      rethrow;
    }
  }
  
  /// 获取本地存储的崩溃报告
  Future<List<Map<String, dynamic>>> getLocalCrashReports() async {
    if (_prefs == null) return [];
    
    try {
      final keys = _prefs!.getKeys().where((key) => key.startsWith('crash_report_')).toList();
      final reports = <Map<String, dynamic>>[];
      
      for (final key in keys) {
        final reportJson = _prefs!.getString(key);
        if (reportJson != null) {
          final report = json.decode(reportJson) as Map<String, dynamic>;
          reports.add(report);
        }
      }
      
      // 按时间戳排序
      reports.sort((a, b) => (b['timestamp'] as String).compareTo(a['timestamp'] as String));
      
      return reports;
    } catch (e) {
      Logger.e('获取本地崩溃报告失败: $e');
      return [];
    }
  }
  
  /// 清除所有本地崩溃报告
  Future<void> clearLocalCrashReports() async {
    if (_prefs == null) return;
    
    try {
      final keys = _prefs!.getKeys().where((key) => key.startsWith('crash_report_')).toList();
      
      for (final key in keys) {
        await _prefs!.remove(key);
      }
      
      Logger.d('已清除 ${keys.length} 个本地崩溃报告');
    } catch (e) {
      Logger.e('清除本地崩溃报告失败: $e');
    }
  }
  
  /// 释放资源
  Future<void> dispose() async {
    try {
      _performanceTimer?.cancel();
      _performanceTimer = null;
      
      _performanceHistory.clear();
      _userActions.clear();
      _customKeys.clear();
      
      _isInitialized = false;
      Logger.d('崩溃报告服务资源已释放');
    } catch (e) {
      Logger.e('释放崩溃报告服务资源失败: $e');
    }
  }
}