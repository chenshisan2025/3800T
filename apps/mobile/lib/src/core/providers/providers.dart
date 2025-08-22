import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'app_providers.dart';
import 'auth_provider.dart';
import 'network_provider.dart';
import '../services/network_service.dart';
import '../services/cache_service.dart';
import '../services/cache_manager.dart';
import '../services/cache_initialization_service.dart';
import '../services/performance_monitor_service.dart';
import '../services/cache_hit_monitor_service.dart';
import '../services/frame_rate_logger_service.dart';
import '../../features/stock/services/stock_cache_service.dart';
import '../../features/ai/services/ai_cache_service.dart';
import '../services/crash_report_service.dart';
import '../utils/logger.dart';

/// 全局Provider容器配置
class ProvidersConfig {
  static late ProviderContainer _container;
  static bool _initialized = false;

  /// 获取全局容器
  static ProviderContainer get container {
    if (!_initialized) {
      throw StateError('ProvidersConfig未初始化，请先调用initialize()');
    }
    return _container;
  }

  /// 初始化Provider容器
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // 初始化Hive
      await Hive.initFlutter();
      
      // 创建容器
      _container = ProviderContainer(
        observers: [
          AppProviderObserver(),
          DebugProviderObserver(),
        ],
      );

      // 预热核心服务
      await _warmupCoreServices();
      
      _initialized = true;
      Logger.d('ProvidersConfig初始化完成');
    } catch (e) {
      Logger.e('ProvidersConfig初始化失败: $e');
      rethrow;
    }
  }

  /// 预热核心服务
  static Future<void> _warmupCoreServices() async {
    try {
      // 初始化网络服务
      final networkService = _container.read(networkServiceProvider);
      await networkService.initialize();
      
      // 初始化缓存服务
      final cacheInitService = CacheInitializationService.instance;
      await cacheInitService.initialize();
      
      // 初始化崩溃报告服务
      final crashReportService = _container.read(crashReportServiceProvider);
      final crashReportConfig = _container.read(crashReportConfigProvider);
      await crashReportService.initialize(config: crashReportConfig);
      
      Logger.d('核心服务预热完成');
    } catch (e) {
      Logger.e('核心服务预热失败: $e');
      // 不抛出异常，允许应用继续运行
    }
  }

  /// 清理资源
  static Future<void> dispose() async {
    if (!_initialized) return;
    
    try {
      // 清理缓存服务
      try {
        final cacheInitService = CacheInitializationService.instance;
        await cacheInitService.dispose();
      } catch (e) {
        Logger.e('清理缓存服务失败: $e');
      }
      
      // 清理崩溃报告服务
      final crashReportService = _container.read(crashReportServiceProvider);
      await crashReportService.dispose();
      
      // 清理Provider管理器
      final manager = _container.read(globalProviderManagerProvider);
      await manager.disposeAll();
      
      // 关闭容器
      _container.dispose();
      
      _initialized = false;
      Logger.d('ProvidersConfig已清理');
    } catch (e) {
      Logger.e('ProvidersConfig清理失败: $e');
    }
  }

  /// 重置容器（用于测试）
  static Future<void> reset() async {
    await dispose();
    await initialize();
  }
}

/// 调试用的Provider观察者
class DebugProviderObserver extends ProviderObserver {
  @override
  void didAddProvider(
    ProviderBase<Object?> provider,
    Object? value,
    ProviderContainer container,
  ) {
    Logger.d('Provider已添加: ${provider.name ?? provider.runtimeType}');
  }

  @override
  void didDisposeProvider(
    ProviderBase<Object?> provider,
    ProviderContainer container,
  ) {
    Logger.d('Provider已释放: ${provider.name ?? provider.runtimeType}');
  }

  @override
  void didUpdateProvider(
    ProviderBase<Object?> provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    if (provider.name?.contains('debug') == true) {
      Logger.d('Provider已更新: ${provider.name ?? provider.runtimeType}');
    }
  }

  @override
  void providerDidFail(
    ProviderBase<Object?> provider,
    Object error,
    StackTrace stackTrace,
    ProviderContainer container,
  ) {
    Logger.e(
      'Provider失败: ${provider.name ?? provider.runtimeType}',
      error: error,
      stackTrace: stackTrace,
    );
  }
}

// =============================================================================
// 核心服务Providers
// =============================================================================

/// 缓存初始化服务Provider
final cacheInitializationServiceProvider = Provider<CacheInitializationService>((ref) {
  return CacheInitializationService.instance;
});

/// 缓存服务Provider
final cacheServiceProvider = Provider<CacheService>((ref) {
  final initService = ref.watch(cacheInitializationServiceProvider);
  final cacheService = initService.cacheService;
  if (cacheService == null) {
    throw StateError('缓存服务未初始化，请先调用CacheInitializationService.initialize()');
  }
  return cacheService;
});

/// 股票缓存服务Provider
final stockCacheServiceProvider = Provider<StockCacheService>((ref) {
  final initService = ref.watch(cacheInitializationServiceProvider);
  final stockCacheService = initService.stockCacheService;
  if (stockCacheService == null) {
    throw StateError('股票缓存服务未初始化，请先调用CacheInitializationService.initialize()');
  }
  return stockCacheService;
});

/// AI缓存服务Provider
final aiCacheServiceProvider = Provider<AiCacheService>((ref) {
  final initService = ref.watch(cacheInitializationServiceProvider);
  final aiCacheService = initService.aiCacheService;
  if (aiCacheService == null) {
    throw StateError('AI缓存服务未初始化，请先调用CacheInitializationService.initialize()');
  }
  return aiCacheService;
});

/// 缓存管理器Provider
final cacheManagerProvider = Provider<CacheManager>((ref) {
  final initService = ref.watch(cacheInitializationServiceProvider);
  final cacheManager = initService.cacheManager;
  if (cacheManager == null) {
    throw StateError('缓存管理器未初始化，请先调用CacheInitializationService.initialize()');
  }
  return cacheManager;
});

/// 崩溃报告服务Provider
final crashReportServiceProvider = Provider<CrashReportService>(
  (ref) {
    final service = CrashReportService();
    ref.onDispose(() => service.dispose());
    return service;
  },
);

/// 崩溃报告配置Provider
final crashReportConfigProvider = Provider<CrashReportConfig>((ref) {
  return const CrashReportConfig(
    enableCrashlytics: true,
    enableSentry: false, // 可以通过环境变量或配置文件控制
    enableLocalStorage: true,
    enablePerformanceMonitoring: true,
    enableUserTracking: true,
    performanceReportInterval: Duration(minutes: 5),
    maxLocalReports: 100,
  );
});

/// 性能历史数据Provider
final performanceHistoryProvider = Provider.family<List<PerformanceMetrics>, Duration?>((ref, period) {
  final crashReportService = ref.watch(crashReportServiceProvider);
  return crashReportService.getPerformanceHistory(period: period);
});

/// 用户行为历史Provider
final userActionHistoryProvider = Provider.family<List<UserActionEvent>, Duration?>((ref, period) {
  final crashReportService = ref.watch(crashReportServiceProvider);
  return crashReportService.getUserActionHistory(period: period);
});

/// 本地崩溃报告Provider
final localCrashReportsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final crashReportService = ref.watch(crashReportServiceProvider);
  return await crashReportService.getLocalCrashReports();
});

// =============================================================================
// 应用状态Providers
// =============================================================================

/// 应用初始化状态
final appInitializationProvider = FutureProvider<bool>(
  (ref) async {
    try {
      // 等待所有核心服务初始化完成
      await ref.read(networkServiceProvider).initialize();
      await ref.read(cacheServiceProvider).initialize();
      await ref.read(crashReportServiceProvider).initialize();
      
      // 检查认证状态
      final authNotifier = ref.read(authProvider.notifier);
      // authNotifier会在构造时自动初始化
      
      Logger.d('应用初始化完成');
      return true;
    } catch (e) {
      Logger.e('应用初始化失败: $e');
      return false;
    }
  },
);

/// 应用主题模式
enum ThemeMode { light, dark, system }

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

class ThemeModeNotifier extends BaseStateNotifier<ThemeMode> {
  ThemeModeNotifier() : super('theme_mode', ThemeMode.system) {
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    try {
      await restoreState((json) => ThemeMode.values[json['mode'] ?? 2]);
    } catch (e) {
      Logger.e('加载主题模式失败: $e');
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await saveState();
    Logger.d('主题模式已更新: $mode');
  }

  @override
  Map<String, dynamic> toJson() => {'mode': state.index};
}

/// 应用语言设置
final localeProvider = StateNotifierProvider<LocaleNotifier, String>(
  (ref) => LocaleNotifier(),
);

class LocaleNotifier extends BaseStateNotifier<String> {
  LocaleNotifier() : super('locale', 'zh_CN') {
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    try {
      await restoreState((json) => json['locale'] ?? 'zh_CN');
    } catch (e) {
      Logger.e('加载语言设置失败: $e');
    }
  }

  Future<void> setLocale(String locale) async {
    state = locale;
    await saveState();
    Logger.d('语言设置已更新: $locale');
  }

  @override
  Map<String, dynamic> toJson() => {'locale': state};
}

// =============================================================================
// 便捷访问Providers
// =============================================================================

/// 应用是否已初始化
final appInitializedProvider = Provider<bool>(
  (ref) {
    final initState = ref.watch(appInitializationProvider);
    return initState.when(
      data: (initialized) => initialized,
      loading: () => false,
      error: (_, __) => false,
    );
  },
);

/// 当前主题是否为暗色模式
final isDarkModeProvider = Provider<bool>(
  (ref) {
    final themeMode = ref.watch(themeModeProvider);
    // 这里可以根据系统主题来判断
    // 暂时简化处理
    return themeMode == ThemeMode.dark;
  },
);

/// 应用是否在线
final appOnlineProvider = Provider<bool>(
  (ref) {
    final networkState = ref.watch(networkProvider);
    return networkState.isOnline;
  },
);

/// 缓存统计信息Provider
final cacheStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final initService = ref.watch(cacheInitializationServiceProvider);
  if (!initService.isInitialized) {
    return {'status': 'not_initialized', 'message': '缓存服务未初始化'};
  }
  final cacheManager = ref.watch(cacheManagerProvider);
  return await cacheManager.getCacheStatistics();
});

/// 缓存健康状态Provider
final cacheHealthProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final initService = ref.watch(cacheInitializationServiceProvider);
  return await initService.getHealthStatus();
});

// =============================================================================
// 性能监控相关Providers
// =============================================================================

// 性能监控配置Provider
final performanceMonitorConfigProvider = Provider<PerformanceMonitorConfig>((ref) {
  return const PerformanceMonitorConfig(
    enableFrameRateMonitoring: true,
    enableMemoryMonitoring: true,
    enableCpuMonitoring: false, // 需要平台特定实现
    enableNetworkMonitoring: true,
    enableBatteryMonitoring: false, // 需要平台特定实现
    reportInterval: Duration(seconds: 30),
    dataRetentionPeriod: Duration(hours: 24),
    maxDataPoints: 2880,
    frameRateThreshold: 30.0,
    memoryThreshold: 512,
    cpuThreshold: 80.0,
  );
});

// 性能监控服务Provider
final performanceMonitorServiceProvider = Provider<PerformanceMonitorService>((ref) {
  return PerformanceMonitorService();
});

// 性能历史数据Provider
final performanceHistoryProvider = Provider.family<List<DetailedPerformanceMetrics>, Duration?>((ref, period) {
  final service = ref.watch(performanceMonitorServiceProvider);
  return service.getPerformanceHistory(period: period);
});

// 性能警报Provider
final performanceAlertsProvider = Provider.family<List<PerformanceAlert>, Duration?>((ref, period) {
  final service = ref.watch(performanceMonitorServiceProvider);
  return service.getAlerts(period: period);
});

// 当前性能状态Provider
final currentPerformanceStatusProvider = Provider<Map<String, dynamic>>((ref) {
  final service = ref.watch(performanceMonitorServiceProvider);
  return service.getCurrentPerformanceStatus();
});

// 性能数据导出Provider
final performanceDataExportProvider = FutureProvider.family<String, Map<String, dynamic>>((ref, params) async {
  final service = ref.watch(performanceMonitorServiceProvider);
  return await service.exportPerformanceData(
    period: params['period'] as Duration?,
    metrics: params['metrics'] as List<String>?,
    format: params['format'] as String? ?? 'json',
  );
});

// =============================================================================
// 缓存命中率监控相关Providers
// =============================================================================

// 缓存命中率监控服务Provider
final cacheHitMonitorServiceProvider = Provider<CacheHitMonitorService>((ref) {
  return CacheHitMonitorService();
});

// 缓存统计Provider
final cacheHitStatsProvider = Provider<Map<String, CacheHitStats>>((ref) {
  final service = ref.watch(cacheHitMonitorServiceProvider);
  return service.getCacheStats();
});

// 特定缓存类型统计Provider
final cacheHitStatsForTypeProvider = Provider.family<CacheHitStats?, String>((ref, cacheType) {
  final service = ref.watch(cacheHitMonitorServiceProvider);
  return service.getCacheStatsForType(cacheType);
});

// 缓存使用模式Provider
final cacheUsagePatternsProvider = Provider.family<List<CacheUsagePattern>, Duration?>((ref, period) {
  final service = ref.watch(cacheHitMonitorServiceProvider);
  return service.getUsagePatterns(period: period);
});

// 缓存优化建议Provider
final cacheOptimizationRecommendationsProvider = Provider<List<CacheOptimizationRecommendation>>((ref) {
  final service = ref.watch(cacheHitMonitorServiceProvider);
  return service.getOptimizationRecommendations();
});

// 缓存请求历史Provider
final cacheRequestHistoryProvider = Provider.family<List<CacheRequestRecord>, Map<String, dynamic>>((ref, params) {
  final service = ref.watch(cacheHitMonitorServiceProvider);
  return service.getRequestHistory(
    period: params['period'] as Duration?,
    cacheType: params['cacheType'] as String?,
  );
});

// 缓存总体摘要Provider
final cacheOverallSummaryProvider = Provider<Map<String, dynamic>>((ref) {
  final service = ref.watch(cacheHitMonitorServiceProvider);
  return service.getOverallSummary();
});

// =============================================================================
// 帧率日志相关Providers
// =============================================================================

// 帧率日志配置Provider
final frameRateLoggerConfigProvider = Provider<FrameRateLoggerConfig>((ref) {
  return const FrameRateLoggerConfig(
    enableDetailedLogging: true,
    enableJankDetection: true,
    enableFrameTimeDistribution: true,
    logInterval: Duration(seconds: 1),
    dataRetentionPeriod: Duration(hours: 6),
    maxLogEntries: 21600,
    jankThreshold: 16.67,
    targetFrameRate: 60.0,
    exportToFile: true,
  );
});

// 帧率日志服务Provider
final frameRateLoggerServiceProvider = Provider<FrameRateLoggerService>((ref) {
  return FrameRateLoggerService();
});

// 帧率日志Provider
final frameRateLogsProvider = Provider.family<List<FrameRateLogEntry>, Duration?>((ref, period) {
  final service = ref.watch(frameRateLoggerServiceProvider);
  return service.getFrameRateLogs(period: period);
});

// Jank事件Provider
final jankEventsProvider = Provider.family<List<JankEvent>, Duration?>((ref, period) {
  final service = ref.watch(frameRateLoggerServiceProvider);
  return service.getJankEvents(period: period);
});

// 帧率统计摘要Provider
final frameRateStatsSummaryProvider = Provider.family<FrameRateStatsSummary, Duration?>((ref, period) {
  final service = ref.watch(frameRateLoggerServiceProvider);
  return service.getStatsSummary(period: period);
});

// 帧率日志导出Provider
final frameRateLogsExportProvider = FutureProvider.family<String, Map<String, dynamic>>((ref, params) async {
  final service = ref.watch(frameRateLoggerServiceProvider);
  return await service.exportFrameRateLogs(
    period: params['period'] as Duration?,
    format: params['format'] as String? ?? 'json',
  );
});

/// 缓存优化建议Provider
final cacheOptimizationProvider = FutureProvider<List<CacheOptimizationSuggestion>>((ref) async {
  final cacheManager = ref.watch(cacheManagerProvider);
  return await cacheManager.generateOptimizationSuggestions();
});

/// 缓存性能历史Provider
final cachePerformanceHistoryProvider = Provider<List<CachePerformanceMetrics>>((ref) {
  final cacheManager = ref.watch(cacheManagerProvider);
  return cacheManager.getPerformanceHistory(period: const Duration(hours: 24));
});

/// 应用整体加载状态
final appLoadingProvider = Provider<bool>(
  (ref) {
    final appInit = ref.watch(appInitializationProvider);
    final authLoading = ref.watch(authLoadingProvider);
    
    return appInit.isLoading || authLoading;
  },
);