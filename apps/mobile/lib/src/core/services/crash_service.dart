import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import '../utils/logger.dart';
import '../config/app_config.dart';
import '../storage/storage_service.dart';

/// 崩溃信息模型
class CrashInfo {
  final String id;
  final DateTime timestamp;
  final String error;
  final String? stackTrace;
  final Map<String, dynamic> deviceInfo;
  final Map<String, dynamic> appInfo;
  final bool isFatal;
  
  CrashInfo({
    required this.id,
    required this.timestamp,
    required this.error,
    this.stackTrace,
    required this.deviceInfo,
    required this.appInfo,
    this.isFatal = true,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'timestamp': timestamp.toIso8601String(),
      'error': error,
      'stackTrace': stackTrace,
      'deviceInfo': deviceInfo,
      'appInfo': appInfo,
      'isFatal': isFatal,
    };
  }
  
  factory CrashInfo.fromJson(Map<String, dynamic> json) {
    return CrashInfo(
      id: json['id'],
      timestamp: DateTime.parse(json['timestamp']),
      error: json['error'],
      stackTrace: json['stackTrace'],
      deviceInfo: Map<String, dynamic>.from(json['deviceInfo']),
      appInfo: Map<String, dynamic>.from(json['appInfo']),
      isFatal: json['isFatal'] ?? true,
    );
  }
}

/// 崩溃日志收集服务
class CrashService {
  static const String _crashLogsKey = 'crash_logs';
  static const int _maxCrashLogs = 50; // 最多保存50条崩溃日志
  
  final StorageService _storageService;
  bool _isInitialized = false;
  
  CrashService(this._storageService);
  
  /// 初始化崩溃日志收集
  Future<void> initialize() async {
    if (_isInitialized || !AppConfig.enableCrashReporting) {
      return;
    }
    
    try {
      // 设置Flutter错误处理
      FlutterError.onError = (FlutterErrorDetails details) {
        _handleFlutterError(details);
      };
      
      // 设置平台错误处理
      PlatformDispatcher.instance.onError = (error, stack) {
        _handlePlatformError(error, stack);
        return true;
      };
      
      // 设置Zone错误处理
      runZonedGuarded(() {
        // 应用启动代码将在这个Zone中运行
      }, (error, stack) {
        _handleZoneError(error, stack);
      });
      
      _isInitialized = true;
      Logger.i('崩溃日志收集服务已初始化');
      
      // 上报之前未上报的崩溃日志
      await _uploadPendingCrashLogs();
    } catch (e) {
      Logger.e('初始化崩溃日志收集服务失败', error: e);
    }
  }
  
  /// 处理Flutter错误
  void _handleFlutterError(FlutterErrorDetails details) {
    try {
      final crashInfo = CrashInfo(
        id: _generateCrashId(),
        timestamp: DateTime.now(),
        error: details.exception.toString(),
        stackTrace: details.stack?.toString(),
        deviceInfo: _getDeviceInfo(),
        appInfo: _getAppInfo(),
        isFatal: details.fatal,
      );
      
      _saveCrashLog(crashInfo);
      
      // 在调试模式下打印错误信息
      if (kDebugMode) {
        FlutterError.presentError(details);
      }
    } catch (e) {
      Logger.e('处理Flutter错误失败', error: e);
    }
  }
  
  /// 处理平台错误
  void _handlePlatformError(Object error, StackTrace stack) {
    try {
      final crashInfo = CrashInfo(
        id: _generateCrashId(),
        timestamp: DateTime.now(),
        error: error.toString(),
        stackTrace: stack.toString(),
        deviceInfo: _getDeviceInfo(),
        appInfo: _getAppInfo(),
        isFatal: true,
      );
      
      _saveCrashLog(crashInfo);
    } catch (e) {
      Logger.e('处理平台错误失败', error: e);
    }
  }
  
  /// 处理Zone错误
  void _handleZoneError(Object error, StackTrace stack) {
    try {
      final crashInfo = CrashInfo(
        id: _generateCrashId(),
        timestamp: DateTime.now(),
        error: error.toString(),
        stackTrace: stack.toString(),
        deviceInfo: _getDeviceInfo(),
        appInfo: _getAppInfo(),
        isFatal: true,
      );
      
      _saveCrashLog(crashInfo);
    } catch (e) {
      Logger.e('处理Zone错误失败', error: e);
    }
  }
  
  /// 手动记录非致命错误
  Future<void> recordError({
    required Object error,
    StackTrace? stackTrace,
    Map<String, dynamic>? context,
    bool isFatal = false,
  }) async {
    try {
      final crashInfo = CrashInfo(
        id: _generateCrashId(),
        timestamp: DateTime.now(),
        error: error.toString(),
        stackTrace: stackTrace?.toString(),
        deviceInfo: {
          ..._getDeviceInfo(),
          if (context != null) 'context': context,
        },
        appInfo: _getAppInfo(),
        isFatal: isFatal,
      );
      
      await _saveCrashLog(crashInfo);
    } catch (e) {
      Logger.e('记录错误失败', error: e);
    }
  }
  
  /// 保存崩溃日志
  Future<void> _saveCrashLog(CrashInfo crashInfo) async {
    try {
      final crashLogs = await _getCrashLogs();
      crashLogs.add(crashInfo);
      
      // 限制崩溃日志数量
      if (crashLogs.length > _maxCrashLogs) {
        crashLogs.removeRange(0, crashLogs.length - _maxCrashLogs);
      }
      
      await _storageService.setString(
        _crashLogsKey,
        crashLogs.map((log) => log.toJson()).toList().toString(),
      );
      
      Logger.w('崩溃日志已保存: ${crashInfo.error}');
      
      // 立即尝试上报
      _uploadCrashLog(crashInfo);
    } catch (e) {
      Logger.e('保存崩溃日志失败', error: e);
    }
  }
  
  /// 获取崩溃日志列表
  Future<List<CrashInfo>> _getCrashLogs() async {
    try {
      final crashLogsStr = await _storageService.getString(_crashLogsKey);
      if (crashLogsStr == null) {
        return [];
      }
      
      // 这里需要实现JSON解析逻辑
      // 简化实现，实际项目中应该使用proper JSON解析
      return [];
    } catch (e) {
      Logger.e('获取崩溃日志失败', error: e);
      return [];
    }
  }
  
  /// 上报崩溃日志
  Future<void> _uploadCrashLog(CrashInfo crashInfo) async {
    if (!AppConfig.enableCrashReporting || kDebugMode) {
      return;
    }
    
    try {
      // 这里应该实现实际的上报逻辑
      // 例如发送到服务器或第三方崩溃收集服务
      Logger.i('上报崩溃日志: ${crashInfo.id}');
      
      // 模拟网络请求
      await Future.delayed(const Duration(seconds: 1));
      
      // 上报成功后可以从本地删除
      // await _removeCrashLog(crashInfo.id);
    } catch (e) {
      Logger.e('上报崩溃日志失败', error: e);
    }
  }
  
  /// 上报待上报的崩溃日志
  Future<void> _uploadPendingCrashLogs() async {
    try {
      final crashLogs = await _getCrashLogs();
      for (final crashLog in crashLogs) {
        await _uploadCrashLog(crashLog);
      }
    } catch (e) {
      Logger.e('上报待上报崩溃日志失败', error: e);
    }
  }
  
  /// 生成崩溃ID
  String _generateCrashId() {
    return '${DateTime.now().millisecondsSinceEpoch}_${DateTime.now().microsecond}';
  }
  
  /// 获取设备信息
  Map<String, dynamic> _getDeviceInfo() {
    return {
      'platform': Platform.operatingSystem,
      'platformVersion': Platform.operatingSystemVersion,
      'isPhysicalDevice': !kIsWeb && (Platform.isAndroid || Platform.isIOS),
      'locale': Platform.localeName,
    };
  }
  
  /// 获取应用信息
  Map<String, dynamic> _getAppInfo() {
    return {
      'appName': AppConfig.appName,
      'appVersion': AppConfig.appVersion,
      'buildNumber': AppConfig.appBuildNumber,
      'environment': AppConfig.environment,
      'isDebug': AppConfig.isDebug,
    };
  }
  
  /// 清理崩溃日志
  Future<void> clearCrashLogs() async {
    try {
      await _storageService.remove(_crashLogsKey);
      Logger.i('崩溃日志已清理');
    } catch (e) {
      Logger.e('清理崩溃日志失败', error: e);
    }
  }
  
  /// 获取崩溃日志统计
  Future<Map<String, int>> getCrashStats() async {
    try {
      final crashLogs = await _getCrashLogs();
      final stats = <String, int>{
        'total': crashLogs.length,
        'fatal': crashLogs.where((log) => log.isFatal).length,
        'nonFatal': crashLogs.where((log) => !log.isFatal).length,
      };
      return stats;
    } catch (e) {
      Logger.e('获取崩溃日志统计失败', error: e);
      return {'total': 0, 'fatal': 0, 'nonFatal': 0};
    }
  }
}