import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_config.dart';
import '../utils/logger.dart';

/// 存储服务提供者
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

/// 存储服务类
class StorageService {
  static const String _userBoxName = 'user_box';
  static const String _settingsBoxName = 'settings_box';
  static const String _cacheBoxName = 'cache_box';
  
  late Box _userBox;
  late Box _settingsBox;
  late Box _cacheBox;
  
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );
  
  /// 初始化存储服务
  Future<void> init() async {
    try {
      await Hive.initFlutter();
      
      // 打开存储盒子
      _userBox = await Hive.openBox(_userBoxName);
      _settingsBox = await Hive.openBox(_settingsBoxName);
      _cacheBox = await Hive.openBox(_cacheBoxName);
      
      Logger.i('存储服务初始化成功');
    } catch (e) {
      Logger.e('存储服务初始化失败', error: e);
      rethrow;
    }
  }
  
  /// 关闭存储服务
  Future<void> close() async {
    await _userBox.close();
    await _settingsBox.close();
    await _cacheBox.close();
    await Hive.close();
  }
  
  // ==================== 安全存储（敏感数据）====================
  
  /// 保存 Token
  Future<void> saveToken(String token) async {
    try {
      await _secureStorage.write(key: AppConfig.tokenKey, value: token);
      Logger.d('Token 保存成功');
    } catch (e) {
      Logger.e('Token 保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取 Token
  Future<String?> getToken() async {
    try {
      return await _secureStorage.read(key: AppConfig.tokenKey);
    } catch (e) {
      Logger.e('Token 获取失败', error: e);
      return null;
    }
  }
  
  /// 清除 Token
  Future<void> clearToken() async {
    try {
      await _secureStorage.delete(key: AppConfig.tokenKey);
      Logger.d('Token 清除成功');
    } catch (e) {
      Logger.e('Token 清除失败', error: e);
    }
  }
  
  /// 保存刷新 Token
  Future<void> saveRefreshToken(String refreshToken) async {
    try {
      await _secureStorage.write(key: AppConfig.refreshTokenKey, value: refreshToken);
    } catch (e) {
      Logger.e('刷新 Token 保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取刷新 Token
  Future<String?> getRefreshToken() async {
    try {
      return await _secureStorage.read(key: AppConfig.refreshTokenKey);
    } catch (e) {
      Logger.e('刷新 Token 获取失败', error: e);
      return null;
    }
  }
  
  /// 清除刷新 Token
  Future<void> clearRefreshToken() async {
    try {
      await _secureStorage.delete(key: AppConfig.refreshTokenKey);
    } catch (e) {
      Logger.e('刷新 Token 清除失败', error: e);
    }
  }
  
  /// 保存生物识别密钥
  Future<void> saveBiometricKey(String key) async {
    try {
      await _secureStorage.write(key: 'biometric_key', value: key);
    } catch (e) {
      Logger.e('生物识别密钥保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取生物识别密钥
  Future<String?> getBiometricKey() async {
    try {
      return await _secureStorage.read(key: 'biometric_key');
    } catch (e) {
      Logger.e('生物识别密钥获取失败', error: e);
      return null;
    }
  }
  
  // ==================== 用户数据存储 ====================
  
  /// 保存用户数据
  Future<void> saveUserData(Map<String, dynamic> userData) async {
    try {
      await _userBox.put(AppConfig.userDataKey, userData);
      Logger.d('用户数据保存成功');
    } catch (e) {
      Logger.e('用户数据保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取用户数据
  Map<String, dynamic>? getUserData() {
    try {
      final data = _userBox.get(AppConfig.userDataKey);
      return data != null ? Map<String, dynamic>.from(data) : null;
    } catch (e) {
      Logger.e('用户数据获取失败', error: e);
      return null;
    }
  }
  
  /// 清除用户数据
  Future<void> clearUserData() async {
    try {
      await _userBox.delete(AppConfig.userDataKey);
      Logger.d('用户数据清除成功');
    } catch (e) {
      Logger.e('用户数据清除失败', error: e);
    }
  }
  
  /// 保存自选股列表
  Future<void> saveWatchlist(List<String> symbols) async {
    try {
      await _userBox.put('watchlist', symbols);
    } catch (e) {
      Logger.e('自选股保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取自选股列表
  List<String> getWatchlist() {
    try {
      final data = _userBox.get('watchlist');
      return data != null ? List<String>.from(data) : AppConfig.defaultWatchlist;
    } catch (e) {
      Logger.e('自选股获取失败', error: e);
      return AppConfig.defaultWatchlist;
    }
  }
  
  /// 添加自选股
  Future<void> addToWatchlist(String symbol) async {
    try {
      final watchlist = getWatchlist();
      if (!watchlist.contains(symbol)) {
        watchlist.add(symbol);
        await saveWatchlist(watchlist);
      }
    } catch (e) {
      Logger.e('添加自选股失败', error: e);
      rethrow;
    }
  }
  
  /// 从自选股移除
  Future<void> removeFromWatchlist(String symbol) async {
    try {
      final watchlist = getWatchlist();
      watchlist.remove(symbol);
      await saveWatchlist(watchlist);
    } catch (e) {
      Logger.e('移除自选股失败', error: e);
      rethrow;
    }
  }
  
  // ==================== 设置数据存储 ====================
  
  /// 保存主题模式
  Future<void> saveThemeMode(String themeMode) async {
    try {
      await _settingsBox.put('theme_mode', themeMode);
    } catch (e) {
      Logger.e('主题模式保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取主题模式
  String getThemeMode() {
    try {
      return _settingsBox.get('theme_mode', defaultValue: 'system');
    } catch (e) {
      Logger.e('主题模式获取失败', error: e);
      return 'system';
    }
  }
  
  /// 保存语言设置
  Future<void> saveLanguage(String language) async {
    try {
      await _settingsBox.put('language', language);
    } catch (e) {
      Logger.e('语言设置保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取语言设置
  String getLanguage() {
    try {
      return _settingsBox.get('language', defaultValue: 'zh_CN');
    } catch (e) {
      Logger.e('语言设置获取失败', error: e);
      return 'zh_CN';
    }
  }
  
  /// 保存通知设置
  Future<void> saveNotificationSettings(Map<String, bool> settings) async {
    try {
      await _settingsBox.put('notification_settings', settings);
    } catch (e) {
      Logger.e('通知设置保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取通知设置
  Map<String, bool> getNotificationSettings() {
    try {
      final data = _settingsBox.get('notification_settings');
      return data != null ? Map<String, bool>.from(data) : {
        'price_alert': true,
        'news_push': true,
        'ai_report': true,
        'system_message': true,
      };
    } catch (e) {
      Logger.e('通知设置获取失败', error: e);
      return {
        'price_alert': true,
        'news_push': true,
        'ai_report': true,
        'system_message': true,
      };
    }
  }
  
  /// 保存生物识别设置
  Future<void> saveBiometricEnabled(bool enabled) async {
    try {
      await _settingsBox.put('biometric_enabled', enabled);
    } catch (e) {
      Logger.e('生物识别设置保存失败', error: e);
      rethrow;
    }
  }
  
  /// 获取生物识别设置
  bool getBiometricEnabled() {
    try {
      return _settingsBox.get('biometric_enabled', defaultValue: false);
    } catch (e) {
      Logger.e('生物识别设置获取失败', error: e);
      return false;
    }
  }
  
  // ==================== 缓存数据存储 ====================
  
  /// 保存缓存数据
  Future<void> saveCache(String key, dynamic data, {Duration? ttl}) async {
    try {
      final cacheItem = {
        'data': data,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'ttl': ttl?.inMilliseconds ?? AppConfig.cacheTTL * 60 * 1000,
      };
      await _cacheBox.put(key, cacheItem);
    } catch (e) {
      Logger.e('缓存保存失败: $key', error: e);
    }
  }
  
  /// 获取缓存数据
  T? getCache<T>(String key) {
    try {
      final cacheItem = _cacheBox.get(key);
      if (cacheItem == null) return null;
      
      final timestamp = cacheItem['timestamp'] as int;
      final ttl = cacheItem['ttl'] as int;
      final now = DateTime.now().millisecondsSinceEpoch;
      
      // 检查是否过期
      if (now - timestamp > ttl) {
        _cacheBox.delete(key);
        return null;
      }
      
      return cacheItem['data'] as T;
    } catch (e) {
      Logger.e('缓存获取失败: $key', error: e);
      return null;
    }
  }
  
  /// 清除指定缓存
  Future<void> clearCache(String key) async {
    try {
      await _cacheBox.delete(key);
    } catch (e) {
      Logger.e('缓存清除失败: $key', error: e);
    }
  }
  
  /// 清除所有缓存
  Future<void> clearAllCache() async {
    try {
      await _cacheBox.clear();
      Logger.d('所有缓存清除成功');
    } catch (e) {
      Logger.e('缓存清除失败', error: e);
    }
  }
  
  /// 清除过期缓存
  Future<void> clearExpiredCache() async {
    try {
      final now = DateTime.now().millisecondsSinceEpoch;
      final keysToDelete = <String>[];
      
      for (final key in _cacheBox.keys) {
        final cacheItem = _cacheBox.get(key);
        if (cacheItem != null) {
          final timestamp = cacheItem['timestamp'] as int;
          final ttl = cacheItem['ttl'] as int;
          
          if (now - timestamp > ttl) {
            keysToDelete.add(key.toString());
          }
        }
      }
      
      for (final key in keysToDelete) {
        await _cacheBox.delete(key);
      }
      
      Logger.d('过期缓存清除完成，清除了 ${keysToDelete.length} 个缓存项');
    } catch (e) {
      Logger.e('过期缓存清除失败', error: e);
    }
  }
  
  // ==================== 通用存储方法 ====================
  
  /// 保存字符串数据
  Future<void> setString(String key, String value) async {
    try {
      await _settingsBox.put(key, value);
    } catch (e) {
      Logger.e('字符串数据保存失败: $key', error: e);
      rethrow;
    }
  }
  
  /// 获取字符串数据
  Future<String?> getString(String key) async {
    try {
      return _settingsBox.get(key);
    } catch (e) {
      Logger.e('字符串数据获取失败: $key', error: e);
      return null;
    }
  }
  
  /// 保存任意数据到指定盒子
  Future<void> save(String boxName, String key, dynamic value) async {
    try {
      final box = await Hive.openBox(boxName);
      await box.put(key, value);
    } catch (e) {
      Logger.e('数据保存失败: $boxName.$key', error: e);
      rethrow;
    }
  }
  
  /// 从指定盒子获取数据
  Future<T?> get<T>(String boxName, String key, {T? defaultValue}) async {
    try {
      final box = await Hive.openBox(boxName);
      return box.get(key, defaultValue: defaultValue);
    } catch (e) {
      Logger.e('数据获取失败: $boxName.$key', error: e);
      return defaultValue;
    }
  }
  
  /// 从指定盒子删除数据
  Future<void> remove(String boxName, String key) async {
    try {
      final box = await Hive.openBox(boxName);
      await box.delete(key);
    } catch (e) {
      Logger.e('数据删除失败: $boxName.$key', error: e);
    }
  }
  
  /// 清除所有数据
  Future<void> clearAll() async {
    try {
      await clearToken();
      await clearRefreshToken();
      await clearUserData();
      await _settingsBox.clear();
      await clearAllCache();
      await _secureStorage.deleteAll();
      Logger.d('所有数据清除成功');
    } catch (e) {
      Logger.e('数据清除失败', error: e);
    }
  }
}