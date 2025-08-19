import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart' as log;

/// 日志工具类
class Logger {
  static late log.Logger _logger;
  static bool _initialized = false;
  
  /// 初始化日志系统
  static void init({log.Level? level}) {
    if (_initialized) return;
    
    _logger = log.Logger(
      filter: kDebugMode ? log.DevelopmentFilter() : log.ProductionFilter(),
      printer: _CustomPrinter(),
      output: _CustomOutput(),
      level: level ?? (kDebugMode ? log.Level.debug : log.Level.info),
    );
    
    _initialized = true;
    i('日志系统初始化完成');
  }
  
  /// 调试日志
  static void d(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _logger.d(message, error: error, stackTrace: stackTrace);
  }
  
  /// 信息日志
  static void i(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _logger.i(message, error: error, stackTrace: stackTrace);
  }
  
  /// 警告日志
  static void w(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _logger.w(message, error: error, stackTrace: stackTrace);
  }
  
  /// 错误日志
  static void e(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _logger.e(message, error: error, stackTrace: stackTrace);
  }
  
  /// 致命错误日志
  static void f(String message, {Object? error, StackTrace? stackTrace}) {
    _ensureInitialized();
    _logger.f(message, error: error, stackTrace: stackTrace);
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
}

/// 自定义日志打印器
class _CustomPrinter extends log.LogPrinter {
  static final _levelEmojis = {
    log.Level.trace: '🔍',
    log.Level.debug: '🐛',
    log.Level.info: 'ℹ️',
    log.Level.warning: '⚠️',
    log.Level.error: '❌',
    log.Level.fatal: '💀',
  };
  
  static final _levelColors = {
    log.Level.trace: '\x1B[37m', // 白色
    log.Level.debug: '\x1B[36m', // 青色
    log.Level.info: '\x1B[32m',  // 绿色
    log.Level.warning: '\x1B[33m', // 黄色
    log.Level.error: '\x1B[31m', // 红色
    log.Level.fatal: '\x1B[35m', // 紫色
  };
  
  static const _resetColor = '\x1B[0m';
  
  @override
  List<String> log(log.LogEvent event) {
    final emoji = _levelEmojis[event.level] ?? '';
    final color = _levelColors[event.level] ?? '';
    final time = DateTime.now().toString().substring(11, 23);
    
    final lines = <String>[];
    
    // 主要消息
    lines.add('$color$emoji [$time] ${event.message}$_resetColor');
    
    // 错误信息
    if (event.error != null) {
      lines.add('$color错误: ${event.error}$_resetColor');
    }
    
    // 堆栈跟踪
    if (event.stackTrace != null && event.level.index >= log.Level.error.index) {
      lines.add('$color堆栈跟踪:$_resetColor');
      lines.addAll(
        event.stackTrace.toString()
            .split('\n')
            .take(10) // 只显示前10行
            .map((line) => '$color  $line$_resetColor'),
      );
    }
    
    return lines;
  }
}

/// 自定义日志输出器
class _CustomOutput extends log.LogOutput {
  @override
  void output(log.OutputEvent event) {
    for (final line in event.lines) {
      if (kDebugMode) {
        // 在调试模式下使用 developer.log
        developer.log(
          line,
          name: 'GulingtongApp',
          level: _getLogLevel(event.level),
        );
      } else {
        // 在生产模式下可以发送到远程日志服务
        // 这里暂时使用 print
        print(line);
      }
    }
  }
  
  int _getLogLevel(log.Level level) {
    switch (level) {
      case log.Level.trace:
        return 500;
      case log.Level.debug:
        return 700;
      case log.Level.info:
        return 800;
      case log.Level.warning:
        return 900;
      case log.Level.error:
        return 1000;
      case log.Level.fatal:
        return 1200;
      default:
        return 800;
    }
  }
}

/// 日志配置
class LogConfig {
  /// 是否启用日志
  static bool enabled = true;
  
  /// 日志级别
  static log.Level level = kDebugMode ? log.Level.debug : log.Level.info;
  
  /// 是否启用网络日志
  static bool networkLogging = kDebugMode;
  
  /// 是否启用性能日志
  static bool performanceLogging = kDebugMode;
  
  /// 是否启用用户行为日志
  static bool userActionLogging = true;
  
  /// 是否启用数据库日志
  static bool databaseLogging = kDebugMode;
  
  /// 是否启用缓存日志
  static bool cacheLogging = kDebugMode;
  
  /// 最大日志文件大小（字节）
  static int maxFileSize = 10 * 1024 * 1024; // 10MB
  
  /// 最大日志文件数量
  static int maxFileCount = 5;
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

/// 日志过滤器
class LogFilter {
  static final Set<String> _ignoredMessages = {};
  static final Set<String> _ignoredTags = {};
  
  /// 添加忽略的消息
  static void ignoreMessage(String message) {
    _ignoredMessages.add(message);
  }
  
  /// 添加忽略的标签
  static void ignoreTag(String tag) {
    _ignoredTags.add(tag);
  }
  
  /// 检查消息是否应该被忽略
  static bool shouldIgnore(String message, {String? tag}) {
    if (_ignoredMessages.contains(message)) return true;
    if (tag != null && _ignoredTags.contains(tag)) return true;
    return false;
  }
  
  /// 清除所有过滤规则
  static void clearFilters() {
    _ignoredMessages.clear();
    _ignoredTags.clear();
  }
}