import 'package:flutter/foundation.dart';

/// 应用配置类
class AppConfig {
  // 私有构造函数，防止实例化
  AppConfig._();
  
  // 应用基本信息
  static const String appName = '古灵通';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';
  static const String version = '$appVersion+$appBuildNumber';
  
  // 环境配置
  static const String environment = kDebugMode ? 'development' : 'production';
  static const bool isDebug = kDebugMode;
  static const bool isRelease = kReleaseMode;
  static const bool isProfile = kProfileMode;
  
  // API 配置
  static const String baseUrl = kDebugMode 
      ? 'http://localhost:3001/api'
      : 'https://api.gulingtong.com';
  
  static const String wsUrl = kDebugMode
      ? 'ws://localhost:3001/ws'
      : 'wss://api.gulingtong.com/ws';
  
  static const int connectTimeout = 30000; // 30秒
  static const int receiveTimeout = 30000; // 30秒
  static const int sendTimeout = 30000; // 30秒
  
  // 存储配置
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_info';
  static const String userDataKey = 'user_data';
  static const String settingsKey = 'app_settings';
  static const String cacheKey = 'app_cache';
  
  // 缓存配置
  static const int cacheMaxAge = 300; // 5分钟
  static const int cacheTTL = 300; // 5分钟
  static const int imageCacheMaxAge = 86400; // 24小时
  static const int maxCacheSize = 100 * 1024 * 1024; // 100MB
  
  // 分页配置
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // 主题配置
  static const int primaryColor = 0xFF2166A5; // 古灵通蓝
  static const int stockUpColor = 0xFFFF4D4F; // 股票上涨红色
  static const int stockDownColor = 0xFF52C41A; // 股票下跌绿色
  static const int stockFlatColor = 0xFF8C8C8C; // 股票平盘灰色
  
  // 功能开关
  static const bool enableBiometric = true;
  static const bool enablePushNotification = true;
  static const bool enableAnalytics = !kDebugMode;
  static const bool enableCrashReporting = !kDebugMode;
  static const bool enableFirebase = true;
  static const bool enableMockData = kDebugMode;
  
  // 第三方服务配置
  static const String sentryDsn = kDebugMode 
      ? ''
      : 'https://your-sentry-dsn@sentry.io/project-id';
  
  static const String firebaseProjectId = 'gulingtong-mobile';
  
  // 文件上传配置
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = [
    'jpg', 'jpeg', 'png', 'gif', 'webp'
  ];
  
  // 股票相关配置
  static const List<String> defaultWatchlist = [
    '000001', // 平安银行
    '000002', // 万科A
    '600000', // 浦发银行
    '600036', // 招商银行
    '600519', // 贵州茅台
  ];
  
  // 刷新配置
  static const int autoRefreshInterval = 30; // 30秒
  static const int maxRetryCount = 3;
  static const int retryDelay = 1000; // 1秒
  
  // 安全配置
  static const int sessionTimeout = 30 * 60; // 30分钟
  static const int maxLoginAttempts = 5;
  static const int lockoutDuration = 15 * 60; // 15分钟
  
  // 动画配置
  static const int animationDuration = 300; // 毫秒
  static const int longAnimationDuration = 500; // 毫秒
  static const int shortAnimationDuration = 150; // 毫秒
  
  // 调试配置
  static const bool enableLogger = true;
  static const bool enableNetworkLogger = kDebugMode;
  static const bool enablePerformanceMonitor = kDebugMode;
  
  // 获取环境特定的配置
  static String get apiBaseUrl {
    switch (environment) {
      case 'development':
        return 'http://localhost:3001/api';
      case 'staging':
        return 'https://staging-api.gulingtong.com';
      case 'production':
        return 'https://api.gulingtong.com';
      default:
        return baseUrl;
    }
  }
  
  static String get websocketUrl {
    switch (environment) {
      case 'development':
        return 'ws://localhost:3001/ws';
      case 'staging':
        return 'wss://staging-api.gulingtong.com/ws';
      case 'production':
        return 'wss://api.gulingtong.com/ws';
      default:
        return wsUrl;
    }
  }
  
  // 获取应用信息
  static Map<String, dynamic> get appInfo => {
    'name': appName,
    'version': appVersion,
    'buildNumber': appBuildNumber,
    'environment': environment,
    'isDebug': isDebug,
    'platform': defaultTargetPlatform.name,
  };
  
  // 获取网络配置
  static Map<String, dynamic> get networkConfig => {
    'baseUrl': apiBaseUrl,
    'wsUrl': websocketUrl,
    'connectTimeout': connectTimeout,
    'receiveTimeout': receiveTimeout,
    'sendTimeout': sendTimeout,
  };
  
  // 获取主题配置
  static Map<String, int> get themeColors => {
    'primary': primaryColor,
    'stockUp': stockUpColor,
    'stockDown': stockDownColor,
    'stockFlat': stockFlatColor,
  };
}