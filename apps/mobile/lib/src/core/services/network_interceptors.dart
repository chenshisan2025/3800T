import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../utils/logger.dart';
import '../storage/storage_service.dart';
import 'dart:async';
import 'dart:convert';

/// 增强的重试拦截器
class EnhancedRetryInterceptor extends Interceptor {
  final Dio dio;
  final int retries;
  final List<Duration> retryDelays;
  final bool Function(DioException) retryEvaluator;

  EnhancedRetryInterceptor({
    required this.dio,
    this.retries = 3,
    this.retryDelays = const [
      Duration(seconds: 1),
      Duration(seconds: 2),
      Duration(seconds: 3),
    ],
    required this.retryEvaluator,
  });

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final extra = err.requestOptions.extra;
    final retryCount = extra['retryCount'] ?? 0;

    if (retryCount < retries && retryEvaluator(err)) {
      final delay = retryDelays.length > retryCount 
          ? retryDelays[retryCount] 
          : retryDelays.last;
      
      Logger.w('🔄 重试请求 ${retryCount + 1}/$retries: ${err.requestOptions.uri} (延迟: ${delay.inSeconds}s)');
      
      await Future.delayed(delay);
      
      // 更新重试次数
      err.requestOptions.extra['retryCount'] = retryCount + 1;
      
      try {
        final response = await dio.fetch(err.requestOptions);
        handler.resolve(response);
      } catch (e) {
        if (e is DioException) {
          super.onError(e, handler);
        } else {
          handler.reject(DioException(
            requestOptions: err.requestOptions,
            error: e,
            type: DioExceptionType.unknown,
          ));
        }
      }
    } else {
      super.onError(err, handler);
    }
  }
}

/// 智能缓存拦截器
class SmartCacheInterceptor extends Interceptor {
  final StorageService _storage = StorageService();
  final Map<String, CacheEntry> _memoryCache = {};
  final int maxMemoryCacheSize = 100;
  final Duration defaultCacheDuration = const Duration(minutes: 5);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // 只缓存GET请求
    if (options.method.toUpperCase() != 'GET') {
      handler.next(options);
      return;
    }

    final cacheKey = _generateCacheKey(options);
    final cacheConfig = _getCacheConfig(options);
    
    if (!cacheConfig.enabled) {
      handler.next(options);
      return;
    }

    // 检查内存缓存
    final memoryCacheEntry = _memoryCache[cacheKey];
    if (memoryCacheEntry != null && !memoryCacheEntry.isExpired) {
      Logger.d('📦 内存缓存命中: ${options.uri}');
      handler.resolve(memoryCacheEntry.response);
      return;
    }

    // 检查持久化缓存
    try {
      final cachedData = await _storage.get<String>('cache_box', 'cache_$cacheKey');
      if (cachedData != null) {
        final cacheEntry = CacheEntry.fromJson(jsonDecode(cachedData));
        if (!cacheEntry.isExpired) {
          Logger.d('💾 持久化缓存命中: ${options.uri}');
          
          // 同时更新内存缓存
          _updateMemoryCache(cacheKey, cacheEntry);
          
          handler.resolve(cacheEntry.response);
          return;
        } else {
          // 清理过期缓存
          await _storage.remove('cache_box', 'cache_$cacheKey');
        }
      }
    } catch (e) {
      Logger.e('缓存读取失败', error: e);
    }

    // 标记请求需要缓存
    options.extra['needsCache'] = true;
    options.extra['cacheKey'] = cacheKey;
    options.extra['cacheConfig'] = cacheConfig;
    
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) async {
    final needsCache = response.requestOptions.extra['needsCache'] as bool? ?? false;
    
    if (needsCache) {
      final cacheKey = response.requestOptions.extra['cacheKey'] as String;
      final cacheConfig = response.requestOptions.extra['cacheConfig'] as CacheConfig;
      
      await _cacheResponse(cacheKey, response, cacheConfig);
    }
    
    handler.next(response);
  }

  /// 生成缓存键
  String _generateCacheKey(RequestOptions options) {
    final uri = options.uri.toString();
    final headers = options.headers.toString();
    final data = options.data?.toString() ?? '';
    
    return '${uri}_${headers.hashCode}_${data.hashCode}'.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_');
  }

  /// 获取缓存配置
  CacheConfig _getCacheConfig(RequestOptions options) {
    final cacheHeader = options.headers['Cache-Control'] as String?;
    
    if (cacheHeader != null) {
      if (cacheHeader.contains('no-cache') || cacheHeader.contains('no-store')) {
        return CacheConfig(enabled: false);
      }
      
      final maxAgeMatch = RegExp(r'max-age=(\d+)').firstMatch(cacheHeader);
      if (maxAgeMatch != null) {
        final maxAge = int.tryParse(maxAgeMatch.group(1)!) ?? 0;
        return CacheConfig(
          enabled: true,
          duration: Duration(seconds: maxAge),
          persistToDisk: maxAge > 300, // 5分钟以上的缓存持久化
        );
      }
    }
    
    // 默认配置
    return CacheConfig(
      enabled: true,
      duration: defaultCacheDuration,
      persistToDisk: false,
    );
  }

  /// 缓存响应
  Future<void> _cacheResponse(String cacheKey, Response response, CacheConfig config) async {
    try {
      final cacheEntry = CacheEntry(
        response: response,
        timestamp: DateTime.now(),
        duration: config.duration,
      );
      
      // 更新内存缓存
      _updateMemoryCache(cacheKey, cacheEntry);
      
      // 持久化缓存
      if (config.persistToDisk) {
        await _storage.save('cache_box', 'cache_$cacheKey', jsonEncode(cacheEntry.toJson()));
      }
      
      Logger.d('💾 缓存已保存: $cacheKey (内存: true, 磁盘: ${config.persistToDisk})');
    } catch (e) {
      Logger.e('缓存保存失败', error: e);
    }
  }

  /// 更新内存缓存
  void _updateMemoryCache(String cacheKey, CacheEntry cacheEntry) {
    // 如果内存缓存已满，移除最旧的条目
    if (_memoryCache.length >= maxMemoryCacheSize) {
      final oldestKey = _memoryCache.keys.first;
      _memoryCache.remove(oldestKey);
    }
    
    _memoryCache[cacheKey] = cacheEntry;
  }

  /// 清理过期缓存
  Future<void> clearExpiredCache() async {
    // 清理内存缓存
    _memoryCache.removeWhere((key, entry) => entry.isExpired);
    
    // 清理持久化缓存
    try {
      // 由于StorageService没有getAllKeys方法，我们使用Hive直接操作
      final box = await Hive.openBox('cache_box');
      final keys = box.keys.toList();
      
      for (final key in keys) {
        final keyStr = key.toString();
        if (keyStr.startsWith('cache_')) {
          final cachedData = await _storage.get<String>('cache_box', keyStr);
          if (cachedData != null) {
            try {
              final cacheEntry = CacheEntry.fromJson(jsonDecode(cachedData));
              if (cacheEntry.isExpired) {
                await _storage.remove('cache_box', keyStr);
              }
            } catch (e) {
              // 无效的缓存数据，直接删除
              await _storage.remove('cache_box', keyStr);
            }
          }
        }
      }
    } catch (e) {
      Logger.e('清理过期缓存失败', error: e);
    }
  }

  /// 清理所有缓存
  Future<void> clearAllCache() async {
    _memoryCache.clear();
    
    try {
      // 由于StorageService没有getAllKeys方法，我们使用Hive直接操作
      final box = await Hive.openBox('cache_box');
      final keys = box.keys.toList();
      
      for (final key in keys) {
        final keyStr = key.toString();
        if (keyStr.startsWith('cache_')) {
          await _storage.remove('cache_box', keyStr);
        }
      }
    } catch (e) {
      Logger.e('清理所有缓存失败', error: e);
    }
  }
}

/// 队列拦截器
class QueueInterceptor extends Interceptor {
  final Future<void> Function(RequestOptions) onRequestCallback;

  QueueInterceptor({required this.onRequestCallback});

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    await onRequestCallback(options);
    handler.next(options);
  }
}

/// 缓存配置
class CacheConfig {
  final bool enabled;
  final Duration duration;
  final bool persistToDisk;

  CacheConfig({
    required this.enabled,
    this.duration = const Duration(minutes: 5),
    this.persistToDisk = false,
  });
}

/// 缓存条目
class CacheEntry {
  final Response response;
  final DateTime timestamp;
  final Duration duration;

  CacheEntry({
    required this.response,
    required this.timestamp,
    required this.duration,
  });

  bool get isExpired => DateTime.now().isAfter(timestamp.add(duration));

  Map<String, dynamic> toJson() {
    return {
      'response': {
        'data': response.data,
        'statusCode': response.statusCode,
        'statusMessage': response.statusMessage,
        'headers': response.headers.map,
      },
      'timestamp': timestamp.toIso8601String(),
      'duration': duration.inMilliseconds,
    };
  }

  factory CacheEntry.fromJson(Map<String, dynamic> json) {
    final responseData = json['response'] as Map<String, dynamic>;
    
    return CacheEntry(
      response: Response(
        data: responseData['data'],
        statusCode: responseData['statusCode'],
        statusMessage: responseData['statusMessage'],
        headers: Headers.fromMap(Map<String, List<String>>.from(
          responseData['headers'] ?? {},
        )),
        requestOptions: RequestOptions(path: ''), // 占位符
      ),
      timestamp: DateTime.parse(json['timestamp']),
      duration: Duration(milliseconds: json['duration']),
    );
  }
}