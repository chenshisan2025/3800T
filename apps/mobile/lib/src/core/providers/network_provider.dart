import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

import '../services/network_service.dart';
import '../storage/storage_service.dart';
import '../utils/logger.dart';

/// 网络连接状态
enum NetworkStatus {
  online,
  offline,
  checking,
}

/// 网络状态数据模型
class NetworkState {
  final NetworkStatus status;
  final ConnectivityResult? connectivityResult;
  final int queuedRequestsCount;
  final int activeRequestsCount;
  final DateTime lastStatusChange;
  final String? errorMessage;

  const NetworkState({
    required this.status,
    this.connectivityResult,
    this.queuedRequestsCount = 0,
    this.activeRequestsCount = 0,
    required this.lastStatusChange,
    this.errorMessage,
  });

  NetworkState copyWith({
    NetworkStatus? status,
    ConnectivityResult? connectivityResult,
    int? queuedRequestsCount,
    int? activeRequestsCount,
    DateTime? lastStatusChange,
    String? errorMessage,
  }) {
    return NetworkState(
      status: status ?? this.status,
      connectivityResult: connectivityResult ?? this.connectivityResult,
      queuedRequestsCount: queuedRequestsCount ?? this.queuedRequestsCount,
      activeRequestsCount: activeRequestsCount ?? this.activeRequestsCount,
      lastStatusChange: lastStatusChange ?? this.lastStatusChange,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  bool get isOnline => status == NetworkStatus.online;
  bool get isOffline => status == NetworkStatus.offline;
  bool get isChecking => status == NetworkStatus.checking;
}

/// 网络状态通知器
class NetworkNotifier extends StateNotifier<NetworkState> {
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  Timer? _statusCheckTimer;
  final NetworkService _networkService;

  NetworkNotifier(this._networkService)
      : super(NetworkState(
          status: NetworkStatus.checking,
          lastStatusChange: DateTime.now(),
        )) {
    _initializeNetworkMonitoring();
  }

  /// 初始化网络监控
  Future<void> _initializeNetworkMonitoring() async {
    try {
      // 检查初始连接状态
      await _checkInitialConnectivity();
      
      // 监听连接状态变化
      _setupConnectivityListener();
      
      // 定期检查网络状态
      _setupPeriodicStatusCheck();
    } catch (e) {
      Logger.e('初始化网络监控失败: $e');
      state = state.copyWith(
        status: NetworkStatus.offline,
        errorMessage: '网络监控初始化失败: $e',
        lastStatusChange: DateTime.now(),
      );
    }
  }

  /// 检查初始连接状态
  Future<void> _checkInitialConnectivity() async {
    try {
      final result = await Connectivity().checkConnectivity();
      final isOnline = result != ConnectivityResult.none;
      
      state = state.copyWith(
        status: isOnline ? NetworkStatus.online : NetworkStatus.offline,
        connectivityResult: result,
        lastStatusChange: DateTime.now(),
        errorMessage: null,
      );
      
      Logger.d('初始网络状态: ${isOnline ? "在线" : "离线"} ($result)');
    } catch (e) {
      Logger.e('检查初始网络状态失败: $e');
      state = state.copyWith(
        status: NetworkStatus.offline,
        errorMessage: '无法检查网络状态',
        lastStatusChange: DateTime.now(),
      );
    }
  }

  /// 设置连接状态监听
  void _setupConnectivityListener() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
      (ConnectivityResult result) {
        final wasOnline = state.isOnline;
        final isOnline = result != ConnectivityResult.none;
        
        state = state.copyWith(
          status: isOnline ? NetworkStatus.online : NetworkStatus.offline,
          connectivityResult: result,
          lastStatusChange: DateTime.now(),
          errorMessage: null,
        );
        
        Logger.d('网络状态变化: ${isOnline ? "在线" : "离线"} ($result)');
        
        // 通知网络状态变化
        if (!wasOnline && isOnline) {
          _onNetworkRestored();
        } else if (wasOnline && !isOnline) {
          _onNetworkLost();
        }
      },
      onError: (error) {
        Logger.e('网络状态监听错误: $error');
        state = state.copyWith(
          status: NetworkStatus.offline,
          errorMessage: '网络监听错误: $error',
          lastStatusChange: DateTime.now(),
        );
      },
    );
  }

  /// 设置定期状态检查
  void _setupPeriodicStatusCheck() {
    _statusCheckTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) => _updateRequestCounts(),
    );
  }

  /// 网络恢复处理
  void _onNetworkRestored() {
    Logger.d('📡 网络已恢复');
    // 这里可以添加网络恢复后的处理逻辑
  }

  /// 网络丢失处理
  void _onNetworkLost() {
    Logger.w('📵 网络已断开');
    // 这里可以添加网络断开后的处理逻辑
  }

  /// 更新请求计数
  void _updateRequestCounts() {
    // 这里可以从NetworkService获取实时的请求计数
    // 暂时使用模拟数据
    state = state.copyWith(
      queuedRequestsCount: 0, // 从NetworkService获取
      activeRequestsCount: 0, // 从NetworkService获取
    );
  }

  /// 手动刷新网络状态
  Future<void> refreshNetworkStatus() async {
    state = state.copyWith(
      status: NetworkStatus.checking,
      lastStatusChange: DateTime.now(),
    );
    
    await _checkInitialConnectivity();
  }

  /// 获取网络质量信息
  Future<Map<String, dynamic>> getNetworkQuality() async {
    try {
      // 这里可以实现网络质量检测逻辑
      // 例如：ping测试、下载速度测试等
      return {
        'quality': 'good',
        'latency': 50,
        'downloadSpeed': 10.5,
        'uploadSpeed': 5.2,
      };
    } catch (e) {
      Logger.e('获取网络质量失败: $e');
      return {
        'quality': 'unknown',
        'error': e.toString(),
      };
    }
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    _statusCheckTimer?.cancel();
    super.dispose();
  }
}

/// 网络状态Provider
final networkProvider = StateNotifierProvider<NetworkNotifier, NetworkState>(
  (ref) {
    final networkService = ref.read(networkServiceProvider);
    return NetworkNotifier(networkService);
  },
);

/// StorageService Provider
final storageServiceProvider = Provider<StorageService>(
  (ref) => StorageService(),
);

/// NetworkService Provider
final networkServiceProvider = Provider<NetworkService>(
  (ref) => NetworkService(ref.read(storageServiceProvider)),
);

/// 网络在线状态Provider（简化版）
final isOnlineProvider = Provider<bool>(
  (ref) => ref.watch(networkProvider).isOnline,
);

/// 排队请求数量Provider
final queuedRequestsCountProvider = Provider<int>(
  (ref) => ref.watch(networkProvider).queuedRequestsCount,
);

/// 活跃请求数量Provider
final activeRequestsCountProvider = Provider<int>(
  (ref) => ref.watch(networkProvider).activeRequestsCount,
);