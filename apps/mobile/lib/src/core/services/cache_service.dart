import 'dart:async';
import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:crypto/crypto.dart';

import '../utils/logger.dart';

/// 缓存配置
class CacheConfig {
  final Duration defaultTtl;
  final int maxSize;
  final bool enableCompression;
  final bool enableEncryption;

  const CacheConfig({
    this.defaultTtl = const Duration(hours: 1),
    this.maxSize = 1000,
    this.enableCompression = true,
    this.enableEncryption = false,
  });
}

/// 缓存条目
class CacheEntry {
  final String key;
  final dynamic data;
  final DateTime createdAt;
  final DateTime expiresAt;
  final int accessCount;
  final DateTime lastAccessAt;
  final int size;
  final String? etag;

  CacheEntry({
    required this.key,
    required this.data,
    required this.createdAt,
    required this.expiresAt,
    this.accessCount = 0,
    DateTime? lastAccessAt,
    this.size = 0,
    this.etag,
  }) : lastAccessAt = lastAccessAt ?? createdAt;

  CacheEntry copyWith({
    String? key,
    dynamic data,
    DateTime? createdAt,
    DateTime? expiresAt,
    int? accessCount,
    DateTime? lastAccessAt,
    int? size,
    String? etag,
  }) {
    return CacheEntry(
      key: key ?? this.key,
      data: data ?? this.data,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
      accessCount: accessCount ?? this.accessCount,
      lastAccessAt: lastAccessAt ?? this.lastAccessAt,
      size: size ?? this.size,
      etag: etag ?? this.etag,
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isValid => !isExpired;

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'data': data,
      'createdAt': createdAt.toIso8601String(),
      'expiresAt': expiresAt.toIso8601String(),
      'accessCount': accessCount,
      'lastAccessAt': lastAccessAt.toIso8601String(),
      'size': size,
      'etag': etag,
    };
  }

  static CacheEntry fromJson(Map<String, dynamic> json) {
    return CacheEntry(
      key: json['key'],
      data: json['data'],
      createdAt: DateTime.parse(json['createdAt']),
      expiresAt: DateTime.parse(json['expiresAt']),
      accessCount: json['accessCount'] ?? 0,
      lastAccessAt: DateTime.parse(json['lastAccessAt']),
      size: json['size'] ?? 0,
      etag: json['etag'],
    );
  }
}

/// 缓存统计信息
class CacheStats {
  final int totalEntries;
  final int totalSize;
  final int hitCount;
  final int missCount;
  final int expiredCount;
  final DateTime lastCleanup;

  CacheStats({
    this.totalEntries = 0,
    this.totalSize = 0,
    this.hitCount = 0,
    this.missCount = 0,
    this.expiredCount = 0,
    DateTime? lastCleanup,
  }) : lastCleanup = lastCleanup ?? DateTime.now();

  double get hitRate {
    final total = hitCount + missCount;
    return total > 0 ? hitCount / total : 0.0;
  }

  CacheStats copyWith({
    int? totalEntries,
    int? totalSize,
    int? hitCount,
    int? missCount,
    int? expiredCount,
    DateTime? lastCleanup,
  }) {
    return CacheStats(
      totalEntries: totalEntries ?? this.totalEntries,
      totalSize: totalSize ?? this.totalSize,
      hitCount: hitCount ?? this.hitCount,
      missCount: missCount ?? this.missCount,
      expiredCount: expiredCount ?? this.expiredCount,
      lastCleanup: lastCleanup ?? this.lastCleanup,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalEntries': totalEntries,
      'totalSize': totalSize,
      'hitCount': hitCount,
      'missCount': missCount,
      'expiredCount': expiredCount,
      'lastCleanup': lastCleanup.toIso8601String(),
    };
  }

  static CacheStats fromJson(Map<String, dynamic> json) {
    return CacheStats(
      totalEntries: json['totalEntries'] ?? 0,
      totalSize: json['totalSize'] ?? 0,
      hitCount: json['hitCount'] ?? 0,
      missCount: json['missCount'] ?? 0,
      expiredCount: json['expiredCount'] ?? 0,
      lastCleanup: DateTime.parse(json['lastCleanup']),
    );
  }
}

/// 缓存服务
class CacheService {
  static const String _stockDataBoxName = 'stock_data_cache';
  static const String _aiResponseBoxName = 'ai_response_cache';
  static const String _generalBoxName = 'general_cache';
  static const String _statsBoxName = 'cache_stats';

  Box<Map>? _stockDataBox;
  Box<Map>? _aiResponseBox;
  Box<Map>? _generalBox;
  Box<Map>? _statsBox;

  final CacheConfig _config;
  CacheStats _stats = CacheStats();
  Timer? _cleanupTimer;
  bool _initialized = false;

  CacheService({CacheConfig? config}) : _config = config ?? const CacheConfig();

  /// 初始化缓存服务
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // 打开Hive boxes
      _stockDataBox = await Hive.openBox<Map>(_stockDataBoxName);
      _aiResponseBox = await Hive.openBox<Map>(_aiResponseBoxName);
      _generalBox = await Hive.openBox<Map>(_generalBoxName);
      _statsBox = await Hive.openBox<Map>(_statsBoxName);

      // 加载统计信息
      await _loadStats();

      // 启动定期清理
      _startPeriodicCleanup();

      // 执行初始清理
      await _cleanupExpiredEntries();

      _initialized = true;
      Logger.d('缓存服务初始化完成');
    } catch (e) {
      Logger.e('缓存服务初始化失败: $e');
      rethrow;
    }
  }

  /// 加载统计信息
  Future<void> _loadStats() async {
    try {
      final statsData = _statsBox?.get('stats');
      if (statsData != null) {
        _stats = CacheStats.fromJson(Map<String, dynamic>.from(statsData));
      }
    } catch (e) {
      Logger.e('加载缓存统计失败: $e');
      _stats = CacheStats();
    }
  }

  /// 保存统计信息
  Future<void> _saveStats() async {
    try {
      await _statsBox?.put('stats', _stats.toJson());
    } catch (e) {
      Logger.e('保存缓存统计失败: $e');
    }
  }

  /// 启动定期清理
  void _startPeriodicCleanup() {
    _cleanupTimer = Timer.periodic(
      const Duration(minutes: 30),
      (_) => _cleanupExpiredEntries(),
    );
  }

  /// 清理过期条目
  Future<void> _cleanupExpiredEntries() async {
    if (!_initialized) return;

    try {
      int expiredCount = 0;
      final now = DateTime.now();

      // 清理股票数据缓存
      expiredCount += await _cleanupBox(_stockDataBox);
      
      // 清理AI响应缓存
      expiredCount += await _cleanupBox(_aiResponseBox);
      
      // 清理通用缓存
      expiredCount += await _cleanupBox(_generalBox);

      // 更新统计信息
      _stats = _stats.copyWith(
        expiredCount: _stats.expiredCount + expiredCount,
        lastCleanup: now,
      );
      
      await _saveStats();
      
      if (expiredCount > 0) {
        Logger.d('清理了 $expiredCount 个过期缓存条目');
      }
    } catch (e) {
      Logger.e('清理过期缓存失败: $e');
    }
  }

  /// 清理指定Box中的过期条目
  Future<int> _cleanupBox(Box<Map>? box) async {
    if (box == null) return 0;

    int expiredCount = 0;
    final keysToDelete = <String>[];
    final now = DateTime.now();

    for (final key in box.keys) {
      try {
        final entryData = box.get(key);
        if (entryData != null) {
          final entry = CacheEntry.fromJson(Map<String, dynamic>.from(entryData));
          if (entry.expiresAt.isBefore(now)) {
            keysToDelete.add(key.toString());
            expiredCount++;
          }
        }
      } catch (e) {
        // 如果解析失败，也删除这个条目
        keysToDelete.add(key.toString());
        expiredCount++;
      }
    }

    // 批量删除过期条目
    for (final key in keysToDelete) {
      await box.delete(key);
    }

    return expiredCount;
  }

  /// 生成缓存键
  String _generateKey(String prefix, String key) {
    final combined = '$prefix:$key';
    final bytes = utf8.encode(combined);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// 获取缓存Box
  Box<Map>? _getBox(String category) {
    switch (category) {
      case 'stock':
        return _stockDataBox;
      case 'ai':
        return _aiResponseBox;
      default:
        return _generalBox;
    }
  }

  /// 设置缓存
  Future<void> set(
    String key,
    dynamic data, {
    String category = 'general',
    Duration? ttl,
    String? etag,
  }) async {
    if (!_initialized) {
      Logger.w('缓存服务未初始化，跳过设置缓存');
      return;
    }

    try {
      final box = _getBox(category);
      if (box == null) return;

      final cacheKey = _generateKey(category, key);
      final now = DateTime.now();
      final expiresAt = now.add(ttl ?? _config.defaultTtl);
      
      final entry = CacheEntry(
        key: cacheKey,
        data: data,
        createdAt: now,
        expiresAt: expiresAt,
        size: _calculateSize(data),
        etag: etag,
      );

      await box.put(cacheKey, entry.toJson());
      
      // 更新统计信息
      _stats = _stats.copyWith(
        totalEntries: _stats.totalEntries + 1,
        totalSize: _stats.totalSize + entry.size,
      );
      
      Logger.d('缓存已设置: $category:$key (TTL: ${ttl ?? _config.defaultTtl})');
    } catch (e) {
      Logger.e('设置缓存失败: $e');
    }
  }

  /// 获取缓存
  Future<T?> get<T>(
    String key, {
    String category = 'general',
    bool updateAccessTime = true,
  }) async {
    if (!_initialized) {
      Logger.w('缓存服务未初始化，返回null');
      return null;
    }

    try {
      final box = _getBox(category);
      if (box == null) return null;

      final cacheKey = _generateKey(category, key);
      final entryData = box.get(cacheKey);
      
      if (entryData == null) {
        // 缓存未命中
        _stats = _stats.copyWith(missCount: _stats.missCount + 1);
        return null;
      }

      final entry = CacheEntry.fromJson(Map<String, dynamic>.from(entryData));
      
      // 检查是否过期
      if (entry.isExpired) {
        await box.delete(cacheKey);
        _stats = _stats.copyWith(
          missCount: _stats.missCount + 1,
          expiredCount: _stats.expiredCount + 1,
        );
        return null;
      }

      // 更新访问信息
      if (updateAccessTime) {
        final updatedEntry = entry.copyWith(
          accessCount: entry.accessCount + 1,
          lastAccessAt: DateTime.now(),
        );
        await box.put(cacheKey, updatedEntry.toJson());
      }

      // 缓存命中
      _stats = _stats.copyWith(hitCount: _stats.hitCount + 1);
      
      Logger.d('缓存命中: $category:$key');
      return entry.data as T?;
    } catch (e) {
      Logger.e('获取缓存失败: $e');
      _stats = _stats.copyWith(missCount: _stats.missCount + 1);
      return null;
    }
  }

  /// 删除缓存
  Future<void> delete(
    String key, {
    String category = 'general',
  }) async {
    if (!_initialized) return;

    try {
      final box = _getBox(category);
      if (box == null) return;

      final cacheKey = _generateKey(category, key);
      await box.delete(cacheKey);
      
      Logger.d('缓存已删除: $category:$key');
    } catch (e) {
      Logger.e('删除缓存失败: $e');
    }
  }

  /// 清空指定类别的缓存
  Future<void> clear({String? category}) async {
    if (!_initialized) return;

    try {
      if (category != null) {
        final box = _getBox(category);
        await box?.clear();
        Logger.d('已清空 $category 类别的缓存');
      } else {
        // 清空所有缓存
        await _stockDataBox?.clear();
        await _aiResponseBox?.clear();
        await _generalBox?.clear();
        Logger.d('已清空所有缓存');
      }
      
      // 重置统计信息
      _stats = CacheStats();
      await _saveStats();
    } catch (e) {
      Logger.e('清空缓存失败: $e');
    }
  }

  /// 获取缓存统计信息
  CacheStats getStats() {
    return _stats;
  }

  /// 计算数据大小（简化实现）
  int _calculateSize(dynamic data) {
    try {
      final jsonString = jsonEncode(data);
      return utf8.encode(jsonString).length;
    } catch (e) {
      return 0;
    }
  }

  /// 检查缓存是否存在且有效
  Future<bool> exists(
    String key, {
    String category = 'general',
  }) async {
    final data = await get(key, category: category, updateAccessTime: false);
    return data != null;
  }

  /// 获取缓存条目信息
  Future<CacheEntry?> getEntry(
    String key, {
    String category = 'general',
  }) async {
    if (!_initialized) return null;

    try {
      final box = _getBox(category);
      if (box == null) return null;

      final cacheKey = _generateKey(category, key);
      final entryData = box.get(cacheKey);
      
      if (entryData == null) return null;
      
      return CacheEntry.fromJson(Map<String, dynamic>.from(entryData));
    } catch (e) {
      Logger.e('获取缓存条目失败: $e');
      return null;
    }
  }

  /// 批量设置缓存
  Future<void> setMultiple(
    Map<String, dynamic> entries, {
    String category = 'general',
    Duration? ttl,
  }) async {
    for (final entry in entries.entries) {
      await set(
        entry.key,
        entry.value,
        category: category,
        ttl: ttl,
      );
    }
  }

  /// 批量获取缓存
  Future<Map<String, T?>> getMultiple<T>(
    List<String> keys, {
    String category = 'general',
  }) async {
    final result = <String, T?>{};
    
    for (final key in keys) {
      result[key] = await get<T>(key, category: category);
    }
    
    return result;
  }

  /// 释放资源
  Future<void> dispose() async {
    try {
      _cleanupTimer?.cancel();
      
      await _saveStats();
      
      await _stockDataBox?.close();
      await _aiResponseBox?.close();
      await _generalBox?.close();
      await _statsBox?.close();
      
      _initialized = false;
      Logger.d('缓存服务已释放');
    } catch (e) {
      Logger.e('缓存服务释放失败: $e');
    }
  }
}