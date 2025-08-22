import 'dart:async';
import 'package:hive_flutter/hive_flutter.dart';
import '../utils/logger.dart';
import 'cache_service.dart';
import 'cache_manager.dart';
import '../../features/stock/services/stock_cache_service.dart';
import '../../features/ai/services/ai_cache_service.dart';

/// 缓存初始化服务
/// 负责统一管理所有缓存服务的初始化和配置
class CacheInitializationService {
  static CacheInitializationService? _instance;
  static CacheInitializationService get instance => _instance ??= CacheInitializationService._();
  
  CacheInitializationService._();
  
  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;
  
  CacheService? _cacheService;
  StockCacheService? _stockCacheService;
  AiCacheService? _aiCacheService;
  CacheManager? _cacheManager;
  
  /// 初始化所有缓存服务
  Future<void> initialize() async {
    if (_isInitialized) {
      Logger.d('缓存服务已初始化，跳过重复初始化');
      return;
    }
    
    try {
      Logger.d('开始初始化缓存服务');
      
      // 1. 初始化Hive
      await _initializeHive();
      
      // 2. 初始化基础缓存服务
      await _initializeCacheService();
      
      // 3. 初始化专用缓存服务
      await _initializeSpecializedCacheServices();
      
      // 4. 初始化缓存管理器
      await _initializeCacheManager();
      
      // 5. 执行初始化后的配置
      await _postInitializationSetup();
      
      _isInitialized = true;
      Logger.d('缓存服务初始化完成');
      
    } catch (e, stackTrace) {
      Logger.e('缓存服务初始化失败: $e', stackTrace: stackTrace);
      rethrow;
    }
  }
  
  /// 初始化Hive数据库
  Future<void> _initializeHive() async {
    Logger.d('初始化Hive数据库');
    
    // Hive已在ProvidersConfig中初始化，这里只做验证
    if (!Hive.isBoxOpen('cache_stats')) {
      Logger.w('Hive缓存统计Box未打开，尝试重新打开');
      await Hive.openBox('cache_stats');
    }
    
    if (!Hive.isBoxOpen('stock_cache')) {
      Logger.w('Hive股票缓存Box未打开，尝试重新打开');
      await Hive.openBox('stock_cache');
    }
    
    if (!Hive.isBoxOpen('ai_cache')) {
      Logger.w('Hive AI缓存Box未打开，尝试重新打开');
      await Hive.openBox('ai_cache');
    }
    
    if (!Hive.isBoxOpen('general_cache')) {
      Logger.w('Hive通用缓存Box未打开，尝试重新打开');
      await Hive.openBox('general_cache');
    }
    
    Logger.d('Hive数据库初始化完成');
  }
  
  /// 初始化基础缓存服务
  Future<void> _initializeCacheService() async {
    Logger.d('初始化基础缓存服务');
    
    _cacheService = CacheService();
    await _cacheService!.initialize();
    
    Logger.d('基础缓存服务初始化完成');
  }
  
  /// 初始化专用缓存服务
  Future<void> _initializeSpecializedCacheServices() async {
    Logger.d('初始化专用缓存服务');
    
    if (_cacheService == null) {
      throw StateError('基础缓存服务未初始化');
    }
    
    // 初始化股票缓存服务
    _stockCacheService = StockCacheService(_cacheService!);
    
    // 初始化AI缓存服务
    _aiCacheService = AiCacheService(_cacheService!);
    
    Logger.d('专用缓存服务初始化完成');
  }
  
  /// 初始化缓存管理器
  Future<void> _initializeCacheManager() async {
    Logger.d('初始化缓存管理器');
    
    if (_cacheService == null || _stockCacheService == null || _aiCacheService == null) {
      throw StateError('缓存服务未完全初始化');
    }
    
    _cacheManager = CacheManager(
      _cacheService!,
      _stockCacheService!,
      _aiCacheService!,
      config: const CacheManagerConfig(
        maxCacheSize: 200, // 200MB
        autoCleanupInterval: Duration(hours: 6),
        hitRateThreshold: 0.6,
        enableSmartWarmup: true,
        enablePerformanceMonitoring: true,
      ),
    );
    
    await _cacheManager!.initialize();
    
    Logger.d('缓存管理器初始化完成');
  }
  
  /// 初始化后的配置
  Future<void> _postInitializationSetup() async {
    Logger.d('执行初始化后配置');
    
    if (_cacheManager == null) {
      throw StateError('缓存管理器未初始化');
    }
    
    // 执行智能预热
    await _cacheManager!.performSmartWarmup();
    
    // 清理过期缓存
    await _cacheManager!.cleanupExpiredCache();
    
    // 开始性能监控
    _cacheManager!.startPerformanceMonitoring();
    
    Logger.d('初始化后配置完成');
  }
  
  /// 获取缓存服务实例
  CacheService? get cacheService => _cacheService;
  
  /// 获取股票缓存服务实例
  StockCacheService? get stockCacheService => _stockCacheService;
  
  /// 获取AI缓存服务实例
  AiCacheService? get aiCacheService => _aiCacheService;
  
  /// 获取缓存管理器实例
  CacheManager? get cacheManager => _cacheManager;
  
  /// 重新初始化缓存服务
  Future<void> reinitialize() async {
    Logger.d('重新初始化缓存服务');
    
    await dispose();
    _isInitialized = false;
    await initialize();
  }
  
  /// 获取缓存健康状态
  Future<Map<String, dynamic>> getHealthStatus() async {
    if (!_isInitialized) {
      return {
        'status': 'not_initialized',
        'message': '缓存服务未初始化',
      };
    }
    
    try {
      final stats = await _cacheManager!.getCacheStatistics();
      final suggestions = await _cacheManager!.generateOptimizationSuggestions();
      
      return {
        'status': 'healthy',
        'initialized': true,
        'cache_stats': stats,
        'optimization_suggestions': suggestions.length,
        'services': {
          'cache_service': _cacheService != null,
          'stock_cache_service': _stockCacheService != null,
          'ai_cache_service': _aiCacheService != null,
          'cache_manager': _cacheManager != null,
        },
      };
    } catch (e) {
      return {
        'status': 'error',
        'message': '获取健康状态失败: $e',
      };
    }
  }
  
  /// 清理所有缓存
  Future<void> clearAllCaches() async {
    if (!_isInitialized || _cacheManager == null) {
      Logger.w('缓存服务未初始化，无法清理缓存');
      return;
    }
    
    try {
      Logger.d('开始清理所有缓存');
      await _cacheManager!.clearAllCaches();
      Logger.d('所有缓存清理完成');
    } catch (e) {
      Logger.e('清理缓存失败: $e');
      rethrow;
    }
  }
  
  /// 释放资源
  Future<void> dispose() async {
    if (!_isInitialized) {
      return;
    }
    
    try {
      Logger.d('开始释放缓存服务资源');
      
      // 释放缓存管理器
      if (_cacheManager != null) {
        await _cacheManager!.dispose();
        _cacheManager = null;
      }
      
      // 释放基础缓存服务
      if (_cacheService != null) {
        await _cacheService!.dispose();
        _cacheService = null;
      }
      
      // 清理专用服务引用
      _stockCacheService = null;
      _aiCacheService = null;
      
      _isInitialized = false;
      Logger.d('缓存服务资源释放完成');
      
    } catch (e) {
      Logger.e('释放缓存服务资源失败: $e');
    }
  }
}