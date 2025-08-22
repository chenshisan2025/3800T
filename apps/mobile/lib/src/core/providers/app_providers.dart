import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'dart:async';

import '../services/storage_service.dart';
import '../utils/logger.dart';
import 'auth_provider.dart';
import 'network_provider.dart';

/// Provider生命周期管理器
class ProviderLifecycleManager {
  static final ProviderLifecycleManager _instance = ProviderLifecycleManager._internal();
  factory ProviderLifecycleManager() => _instance;
  ProviderLifecycleManager._internal();

  final Map<String, Timer> _timers = {};
  final Map<String, StreamSubscription> _subscriptions = {};
  final Set<String> _activeProviders = {};

  /// 注册Provider
  void registerProvider(String providerId) {
    _activeProviders.add(providerId);
    Logger.d('Provider已注册: $providerId');
  }

  /// 注销Provider
  void unregisterProvider(String providerId) {
    _activeProviders.remove(providerId);
    _cancelTimer(providerId);
    _cancelSubscription(providerId);
    Logger.d('Provider已注销: $providerId');
  }

  /// 添加定时器
  void addTimer(String providerId, Timer timer) {
    _cancelTimer(providerId);
    _timers[providerId] = timer;
  }

  /// 添加订阅
  void addSubscription(String providerId, StreamSubscription subscription) {
    _cancelSubscription(providerId);
    _subscriptions[providerId] = subscription;
  }

  /// 取消定时器
  void _cancelTimer(String providerId) {
    _timers[providerId]?.cancel();
    _timers.remove(providerId);
  }

  /// 取消订阅
  void _cancelSubscription(String providerId) {
    _subscriptions[providerId]?.cancel();
    _subscriptions.remove(providerId);
  }

  /// 清理所有资源
  void disposeAll() {
    for (final timer in _timers.values) {
      timer.cancel();
    }
    for (final subscription in _subscriptions.values) {
      subscription.cancel();
    }
    _timers.clear();
    _subscriptions.clear();
    _activeProviders.clear();
    Logger.d('所有Provider资源已清理');
  }

  /// 获取活跃Provider列表
  List<String> get activeProviders => _activeProviders.toList();
}

/// 状态持久化管理器
class StatePersistenceManager {
  static final StatePersistenceManager _instance = StatePersistenceManager._internal();
  factory StatePersistenceManager() => _instance;
  StatePersistenceManager._internal();

  final StorageService _storage = StorageService();
  final Map<String, dynamic> _stateCache = {};

  /// 保存状态
  Future<void> saveState(String key, dynamic state) async {
    try {
      _stateCache[key] = state;
      await _storage.setString('state_$key', _encodeState(state));
      Logger.d('状态已保存: $key');
    } catch (e) {
      Logger.e('保存状态失败: $key - $e');
    }
  }

  /// 恢复状态
  Future<T?> restoreState<T>(String key, T Function(Map<String, dynamic>) fromJson) async {
    try {
      // 先从缓存中获取
      if (_stateCache.containsKey(key)) {
        return _stateCache[key] as T?;
      }

      // 从存储中获取
      final stateString = await _storage.getString('state_$key');
      if (stateString != null) {
        final stateMap = _decodeState(stateString);
        final state = fromJson(stateMap);
        _stateCache[key] = state;
        Logger.d('状态已恢复: $key');
        return state;
      }
    } catch (e) {
      Logger.e('恢复状态失败: $key - $e');
    }
    return null;
  }

  /// 删除状态
  Future<void> removeState(String key) async {
    try {
      _stateCache.remove(key);
      await _storage.remove('state_$key');
      Logger.d('状态已删除: $key');
    } catch (e) {
      Logger.e('删除状态失败: $key - $e');
    }
  }

  /// 清理所有状态
  Future<void> clearAllStates() async {
    try {
      _stateCache.clear();
      // 由于StorageService没有getAllKeys方法，我们使用Hive直接操作
      final box = await Hive.openBox('state_box');
      final keys = box.keys.toList();
      for (final key in keys) {
        final keyStr = key.toString();
         if (keyStr.startsWith('state_')) {
           await box.delete(keyStr);
         }
      }
      Logger.d('所有状态已清理');
    } catch (e) {
      Logger.e('清理状态失败: $e');
    }
  }

  /// 编码状态
  String _encodeState(dynamic state) {
    // 这里可以使用JSON或其他序列化方式
    return state.toString();
  }

  /// 解码状态
  Map<String, dynamic> _decodeState(String stateString) {
    // 这里需要根据编码方式进行解码
    // 暂时返回空Map
    return {};
  }
}

/// Provider调试工具
class ProviderDebugger {
  static final ProviderDebugger _instance = ProviderDebugger._internal();
  factory ProviderDebugger() => _instance;
  ProviderDebugger._internal();

  final Map<String, List<String>> _stateHistory = {};
  final Map<String, DateTime> _lastStateChange = {};

  /// 记录状态变化
  void recordStateChange(String providerId, String state) {
    if (!kDebugMode) return;

    _stateHistory.putIfAbsent(providerId, () => []);
    _stateHistory[providerId]!.add('${DateTime.now()}: $state');
    _lastStateChange[providerId] = DateTime.now();

    // 限制历史记录数量
    if (_stateHistory[providerId]!.length > 50) {
      _stateHistory[providerId]!.removeAt(0);
    }

    Logger.d('[$providerId] 状态变化: $state');
  }

  /// 获取状态历史
  List<String> getStateHistory(String providerId) {
    return _stateHistory[providerId] ?? [];
  }

  /// 获取最后状态变化时间
  DateTime? getLastStateChangeTime(String providerId) {
    return _lastStateChange[providerId];
  }

  /// 打印调试信息
  void printDebugInfo() {
    if (!kDebugMode) return;

    Logger.d('=== Provider调试信息 ===');
    for (final providerId in _stateHistory.keys) {
      final history = _stateHistory[providerId]!;
      final lastChange = _lastStateChange[providerId];
      Logger.d('$providerId: ${history.length}条记录, 最后更新: $lastChange');
    }
    Logger.d('=====================');
  }

  /// 清理调试数据
  void clearDebugData() {
    _stateHistory.clear();
    _lastStateChange.clear();
  }
}

/// 基础StateNotifier，包含生命周期管理
abstract class BaseStateNotifier<T> extends StateNotifier<T> {
  final String providerId;
  final ProviderLifecycleManager _lifecycleManager = ProviderLifecycleManager();
  final StatePersistenceManager _persistenceManager = StatePersistenceManager();
  final ProviderDebugger _debugger = ProviderDebugger();

  BaseStateNotifier(this.providerId, T initialState) : super(initialState) {
    _lifecycleManager.registerProvider(providerId);
    _debugger.recordStateChange(providerId, 'initialized');
  }

  @override
  set state(T value) {
    super.state = value;
    _debugger.recordStateChange(providerId, value.toString());
    _onStateChanged(value);
  }

  /// 状态变化回调
  void _onStateChanged(T newState) {
    // 子类可以重写此方法
  }

  /// 保存状态
  Future<void> saveState() async {
    await _persistenceManager.saveState(providerId, state);
  }

  /// 恢复状态
  Future<void> restoreState(T Function(Map<String, dynamic>) fromJson) async {
    final restoredState = await _persistenceManager.restoreState(providerId, fromJson);
    if (restoredState != null) {
      state = restoredState;
    }
  }

  /// 添加定时器
  void addTimer(Timer timer) {
    _lifecycleManager.addTimer(providerId, timer);
  }

  /// 添加订阅
  void addSubscription(StreamSubscription subscription) {
    _lifecycleManager.addSubscription(providerId, subscription);
  }

  @override
  void dispose() {
    _lifecycleManager.unregisterProvider(providerId);
    _debugger.recordStateChange(providerId, 'disposed');
    super.dispose();
  }
}

/// 应用级别的Provider容器
final appProvidersContainer = ProviderContainer(
  observers: [AppProviderObserver()],
);

/// Provider观察者
class AppProviderObserver extends ProviderObserver {
  final ProviderDebugger _debugger = ProviderDebugger();

  @override
  void didAddProvider(
    ProviderBase provider,
    Object? value,
    ProviderContainer container,
  ) {
    _debugger.recordStateChange(provider.name ?? 'unknown', 'added');
  }

  @override
  void didDisposeProvider(
    ProviderBase provider,
    ProviderContainer container,
  ) {
    _debugger.recordStateChange(provider.name ?? 'unknown', 'disposed');
  }

  @override
  void didUpdateProvider(
    ProviderBase provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    _debugger.recordStateChange(
      provider.name ?? 'unknown',
      'updated: $previousValue -> $newValue',
    );
  }

  @override
  void providerDidFail(
    ProviderBase provider,
    Object error,
    StackTrace stackTrace,
    ProviderContainer container,
  ) {
    _debugger.recordStateChange(
      provider.name ?? 'unknown',
      'failed: $error',
    );
    Logger.e('Provider失败: ${provider.name} - $error', error: error, stackTrace: stackTrace);
  }
}

/// 全局Provider管理器
final globalProviderManagerProvider = Provider<ProviderLifecycleManager>(
  (ref) => ProviderLifecycleManager(),
);

/// 状态持久化管理器Provider
final statePersistenceManagerProvider = Provider<StatePersistenceManager>(
  (ref) => StatePersistenceManager(),
);

/// Provider调试器Provider
final providerDebuggerProvider = Provider<ProviderDebugger>(
  (ref) => ProviderDebugger(),
);