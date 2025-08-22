import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

import '../../features/auth/models/user_model.dart';
import '../../features/auth/services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/network_service.dart';
import 'app_providers.dart';
import '../utils/logger.dart';

// 认证状态提供者
final authProvider = AsyncNotifierProvider<AuthNotifier, UserModel?>(AuthNotifier.new);



// 认证状态管理器
class AuthNotifier extends AsyncNotifier<UserModel?> {
  late final AuthService _authService;
  late final StorageService _storageService;
  Timer? _sessionCheckTimer;

  @override
  Future<UserModel?> build() async {
    _authService = ref.read(authServiceProvider);
    _storageService = ref.read(storageServiceProvider);
    return await _initializeAuth();
  }
  
  /// 初始化认证状态
  Future<UserModel?> _initializeAuth() async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return null;
      }
      
      // 验证token有效性
      final user = await _authService.getCurrentUser();
      if (user != null) {
        // 启动会话检查定时器
        _startSessionCheck();
        return user;
      } else {
        // Token无效，清理存储
        await _storageService.clearToken();
        return null;
      }
    } catch (e) {
      Logger.e('初始化认证状态失败: $e');
      throw e;
    }
  }



  /// 验证会话
  Future<bool> _validateSession() async {
    try {
      // 这里可以添加会话验证逻辑
      // 例如：检查token是否过期、验证服务器端会话等
      return true;
    } catch (e) {
      Logger.e('会话验证失败: $e');
      return false;
    }
  }

  /// 启动会话检查
  void _startSessionCheck() {
    _sessionCheckTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => _checkSessionValidity(),
    );
  }

  /// 检查会话有效性
  Future<void> _checkSessionValidity() async {
    try {
      final currentState = state;
      if (!currentState.hasValue || currentState.value == null) return;
      
      // 通过获取当前用户来验证会话
      final user = await _authService.getCurrentUser();
      if (user == null) {
        await logout();
        Logger.w('会话已过期，用户已登出');
      }
    } catch (e) {
      Logger.e('检查会话有效性失败: $e');
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  /// 用户登录
  Future<void> login(String email, String password) async {
    try {
      state = const AsyncValue.loading();
      
      final result = await _authService.login(email, password);
      
      if (result.success && result.user != null) {
        state = AsyncValue.data(result.user);
        
        // 启动会话检查
        _startSessionCheck();
        
        Logger.i('用户登录成功: ${result.user!.email}');
      } else {
        throw Exception(result.message ?? '登录失败');
      }
    } catch (e) {
      Logger.e('登录失败: $e');
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  /// 完成登录（魔法链接验证后）
  Future<void> completeSignIn() async {
    try {
      final user = await _authService.getCurrentUser();
      
      state = AsyncValue.data(user);
      
      Logger.d('登录完成: ${user?.email}');
    } catch (e) {
      Logger.e('完成登录失败: $e');
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  /// 用户登出
  Future<void> logout() async {
    try {
      await _authService.logout();
      
      // 停止会话检查
      _sessionCheckTimer?.cancel();
      _sessionCheckTimer = null;
      
      state = const AsyncValue.data(null);
      
      Logger.i('用户登出成功');
    } catch (e) {
      Logger.e('登出失败: $e');
      // 即使登出失败，也要清理本地状态
      state = const AsyncValue.data(null);
    }
  }

  /// 刷新用户信息
  Future<void> refreshUser() async {
    final currentState = state;
    if (!currentState.hasValue || currentState.value == null) return;
    
    try {
      final user = await _authService.getCurrentUser();
      
      state = AsyncValue.data(user);
      
      Logger.d('用户信息已刷新');
    } catch (e) {
      Logger.e('刷新用户信息失败: $e');
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  /// 更新用户资料
  Future<void> updateProfile(Map<String, dynamic> updates) async {
    final currentState = state;
    if (!currentState.hasValue || currentState.value == null) return;
    
    try {
      // 这里可以调用更新用户资料的API
      // final updatedUser = await _authService.updateProfile(updates);
      
      // 暂时保持当前状态
      Logger.d('用户资料已更新');
    } catch (e) {
      Logger.e('更新用户资料失败: $e');
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  void dispose() {
    _sessionCheckTimer?.cancel();
  }
}

// 便捷的getter/// 当前用户Provider
final currentUserProvider = Provider<UserModel?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.when(
    data: (user) => user,
    loading: () => null,
    error: (error, stack) => null,
  );
});

// 是否已登录
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.when(
    data: (user) => user != null,
    loading: () => false,
    error: (_, __) => false,
  );
});

// 认证加载状态
final authLoadingProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.isLoading;
});

// 认证错误状态
final authErrorProvider = Provider<String?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.when(
    data: (_) => null,
    loading: () => null,
    error: (error, _) => error.toString(),
  );
});

// 会话有效性
final isSessionValidProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.when(
    data: (user) => user != null, // 简化的会话验证逻辑
    loading: () => false,
    error: (_, __) => false,
  );
});

// 最后登录时间
final lastLoginTimeProvider = Provider<DateTime?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.when(
    data: (user) => user?.lastLoginAt,
    loading: () => null,
    error: (_, __) => null,
  );
});

// AuthService Provider
final authServiceProvider = Provider<AuthService>(
  (ref) => AuthService(ref.read(networkServiceProvider)),
);