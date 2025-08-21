import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

/// 日志工具类
class Logger {
  static bool _initialized = false;
  
  /// 初始化日志系统
  static void init() {
    if (_initialized) return;
    _initialized = true;
    i('日志系统初始化完成');
  }
  
  /// 调试日志
  static void d(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _log('DEBUG', message, error: error, stackTrace: stackTrace);
  }
  
  /// 信息日志
  static void i(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _log('INFO', message, error: error, stackTrace: stackTrace);
  }
  
  /// 警告日志
  static void w(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _log('WARN', message, error: error, stackTrace: stackTrace);
  }
  
  /// 错误日志
  static void e(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _log('ERROR', message, error: error, stackTrace: stackTrace);
  }
  
  /// 致命错误日志
  static void f(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _log('FATAL', message, error: error, stackTrace: stackTrace);
  }
  
  /// 网络请求日志
  static void network(String method, String url, {Map<String, dynamic>? data}) {
    if (kDebugMode) {
      d('🌐 $method $url${data != null ? '\n数据: $data' : ''}');
    }
  }
  
  /// 网络响应日志
  static void networkResponse(int statusCode, String url, {dynamic data}) {
    if (kDebugMode) {
      final emoji = statusCode >= 200 && statusCode < 300 ? '✅' : '❌';
      d('$emoji $statusCode $url${data != null ? '\n响应: $data' : ''}');
    }
  }
  
  /// 用户行为日志
  static void userAction(String action, {Map<String, dynamic>? params}) {
    i('👤 用户操作: $action${params != null ? ' - $params' : ''}');
  }
  
  /// 性能日志
  static void performance(String operation, Duration duration) {
    d('⚡ 性能: $operation 耗时 ${duration.inMilliseconds}ms');
  }
  
  /// 数据库操作日志
  static void database(String operation, {String? table, Map<String, dynamic>? data}) {
    d('🗄️ 数据库: $operation${table != null ? ' - $table' : ''}${data != null ? ' - $data' : ''}');
  }
  
  /// 缓存操作日志
  static void cache(String operation, String key, {dynamic data}) {
    d('💾 缓存: $operation - $key${data != null ? ' - $data' : ''}');
  }
  
  /// 认证相关日志
  static void auth(String operation, {String? userId}) {
    i('🔐 认证: $operation${userId != null ? ' - 用户: $userId' : ''}');
  }
  
  /// 业务逻辑日志
  static void business(String operation, {Map<String, dynamic>? context}) {
    i('💼 业务: $operation${context != null ? ' - $context' : ''}');
  }
  
  /// 确保日志系统已初始化
  static void _ensureInitialized() {
    if (!_initialized) {
      init();
    }
  }
  
  /// 内部日志方法
  static void _log(String level, String message, {Object? error, StackTrace? stackTrace}) {
    final time = DateTime.now().toString().substring(11, 23);
    final logMessage = '[$time] $level: $message';
    
    if (kDebugMode) {
      developer.log(
        logMessage,
        name: 'GulingtongApp',
        error: error,
        stackTrace: stackTrace,
      );
    } else {
      print(logMessage);
      if (error != null) {
        print('错误: $error');
      }
      if (stackTrace != null) {
        print('堆栈跟踪: $stackTrace');
      }
    }
  }
}

/// 性能监控工具
class PerformanceLogger {
  static final Map<String, Stopwatch> _stopwatches = {};
  
  /// 开始性能监控
  static void start(String operation) {
    _stopwatches[operation] = Stopwatch()..start();
  }
  
  /// 结束性能监控并记录日志
  static void end(String operation) {
    final stopwatch = _stopwatches.remove(operation);
    if (stopwatch != null) {
      stopwatch.stop();
      Logger.performance(operation, stopwatch.elapsed);
    }
  }
  
  /// 测量代码块执行时间
  static Future<T> measure<T>(String operation, Future<T> Function() block) async {
    start(operation);
    try {
      final result = await block();
      end(operation);
      return result;
    } catch (e) {
      end(operation);
      rethrow;
    }
  }
  
  /// 测量同步代码块执行时间
  static T measureSync<T>(String operation, T Function() block) {
    start(operation);
    try {
      final result = block();
      end(operation);
      return result;
    } catch (e) {
      end(operation);
      rethrow;
    }
  }
}