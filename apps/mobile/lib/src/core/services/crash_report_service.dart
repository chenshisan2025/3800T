import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
// import '../utils/logger.dart';

/// 崩溃报告服务
class CrashReportService {
  static final CrashReportService _instance = CrashReportService._internal();
  factory CrashReportService() => _instance;
  CrashReportService._internal();
  
  static const String _tag = 'CrashReportService';
  bool _isInitialized = false;
  
  /// 初始化崩溃报告服务
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      // 捕获Flutter框架错误
      FlutterError.onError = (FlutterErrorDetails details) {
        _handleFlutterError(details);
      };
      
      // 捕获异步错误
      PlatformDispatcher.instance.onError = (error, stack) {
        _handleAsyncError(error, stack);
        return true;
      };
      
      _isInitialized = true;
      // Logger.info(_tag, 'Crash report service initialized');
    } catch (e, stackTrace) {
      // Logger.error(_tag, 'Failed to initialize crash report service', e, stackTrace);
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
      'version': '1.0.0', // 可以从package_info_plus获取
      'buildNumber': '1',
      'packageName': 'com.example.gulingtong',
    };
  }
  
  /// 报告错误
  void _reportError(Map<String, dynamic> errorReport) {
    try {
      // 记录到本地日志
      // Logger.error(
      //   _tag,
      //   'Crash Report: ${errorReport['error']}',
      //   errorReport['error'],
      //   errorReport['stackTrace'] != null 
      //       ? StackTrace.fromString(errorReport['stackTrace']) 
      //       : null,
      // );
      
      // 在生产环境中，这里可以发送到远程服务器
      if (kReleaseMode) {
        _sendToRemoteService(errorReport);
      }
      
      // 保存到本地存储以便后续上传
      _saveToLocalStorage(errorReport);
    } catch (e) {
      // Logger.error(_tag, 'Failed to report error', e);
    }
  }
  
  /// 发送到远程服务
  Future<void> _sendToRemoteService(Map<String, dynamic> errorReport) async {
    try {
      // 这里可以集成第三方崩溃报告服务
      // 如 Firebase Crashlytics, Sentry 等
      // Logger.info(_tag, 'Sending crash report to remote service');
      
      // 示例：发送到自定义API
      // await http.post(
      //   Uri.parse('https://api.example.com/crash-reports'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: json.encode(errorReport),
      // );
    } catch (e) {
      // Logger.error(_tag, 'Failed to send crash report to remote service', e);
    }
  }
  
  /// 保存到本地存储
  Future<void> _saveToLocalStorage(Map<String, dynamic> errorReport) async {
    try {
      // 这里可以使用shared_preferences或其他本地存储方案
      // Logger.info(_tag, 'Saving crash report to local storage');
    } catch (e) {
      // Logger.error(_tag, 'Failed to save crash report to local storage', e);
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
    try {
      // Logger.info(_tag, 'User Action: $action', parameters);
      
      // 在生产环境中可以发送到分析服务
      if (kReleaseMode) {
        // 发送用户行为数据
      }
    } catch (e) {
      // Logger.error(_tag, 'Failed to record user action', e);
    }
  }
  
  /// 设置用户标识
  void setUserId(String userId) {
    try {
      // Logger.info(_tag, 'Setting user ID: $userId');
      // 设置用户标识以便在崩溃报告中关联用户
    } catch (e) {
      // Logger.error(_tag, 'Failed to set user ID', e);
    }
  }
  
  /// 添加自定义键值对
  void setCustomKey(String key, String value) {
    try {
      // Logger.info(_tag, 'Setting custom key: $key = $value');
      // 添加自定义数据到崩溃报告
    } catch (e) {
      // Logger.error(_tag, 'Failed to set custom key', e);
    }
  }
}