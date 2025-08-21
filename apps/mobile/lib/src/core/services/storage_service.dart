import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// 存储服务提供者
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

// 本地存储服务
class StorageService {
  static SharedPreferences? _prefs;

  // 初始化
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // 获取SharedPreferences实例
  Future<SharedPreferences> get _preferences async {
    return _prefs ?? await SharedPreferences.getInstance();
  }

  // 存储字符串
  Future<bool> setString(String key, String value) async {
    final prefs = await _preferences;
    return prefs.setString(key, value);
  }

  // 获取字符串
  Future<String?> getString(String key) async {
    final prefs = await _preferences;
    return prefs.getString(key);
  }

  // 存储整数
  Future<bool> setInt(String key, int value) async {
    final prefs = await _preferences;
    return prefs.setInt(key, value);
  }

  // 获取整数
  Future<int?> getInt(String key) async {
    final prefs = await _preferences;
    return prefs.getInt(key);
  }

  // 存储布尔值
  Future<bool> setBool(String key, bool value) async {
    final prefs = await _preferences;
    return prefs.setBool(key, value);
  }

  // 获取布尔值
  Future<bool?> getBool(String key) async {
    final prefs = await _preferences;
    return prefs.getBool(key);
  }

  // 存储双精度浮点数
  Future<bool> setDouble(String key, double value) async {
    final prefs = await _preferences;
    return prefs.setDouble(key, value);
  }

  // 获取双精度浮点数
  Future<double?> getDouble(String key) async {
    final prefs = await _preferences;
    return prefs.getDouble(key);
  }

  // 存储字符串列表
  Future<bool> setStringList(String key, List<String> value) async {
    final prefs = await _preferences;
    return prefs.setStringList(key, value);
  }

  // 获取字符串列表
  Future<List<String>?> getStringList(String key) async {
    final prefs = await _preferences;
    return prefs.getStringList(key);
  }

  // 存储JSON对象
  Future<bool> setJson(String key, Map<String, dynamic> value) async {
    final jsonString = jsonEncode(value);
    return setString(key, jsonString);
  }

  // 获取JSON对象
  Future<Map<String, dynamic>?> getJson(String key) async {
    final jsonString = await getString(key);
    if (jsonString == null) return null;
    try {
      return jsonDecode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  // 存储JSON列表
  Future<bool> setJsonList(String key, List<Map<String, dynamic>> value) async {
    final jsonString = jsonEncode(value);
    return setString(key, jsonString);
  }

  // 获取JSON列表
  Future<List<Map<String, dynamic>>?> getJsonList(String key) async {
    final jsonString = await getString(key);
    if (jsonString == null) return null;
    try {
      final decoded = jsonDecode(jsonString);
      if (decoded is List) {
        return decoded.cast<Map<String, dynamic>>();
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 删除键值对
  Future<bool> remove(String key) async {
    final prefs = await _preferences;
    return prefs.remove(key);
  }

  // 检查键是否存在
  Future<bool> containsKey(String key) async {
    final prefs = await _preferences;
    return prefs.containsKey(key);
  }

  // 清除所有数据
  Future<bool> clear() async {
    final prefs = await _preferences;
    return prefs.clear();
  }

  // 获取所有键
  Future<Set<String>> getKeys() async {
    final prefs = await _preferences;
    return prefs.getKeys();
  }
}

// 存储键常量
class StorageKeys {
  static const String userToken = 'user_token';
  static const String userInfo = 'user_info';
  static const String watchlist = 'watchlist';
  static const String priceAlerts = 'price_alerts';
  static const String themeMode = 'theme_mode';
  static const String language = 'language';
  static const String onboardingCompleted = 'onboarding_completed';
  static const String lastSyncTime = 'last_sync_time';
}