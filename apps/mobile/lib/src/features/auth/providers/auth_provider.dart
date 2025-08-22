import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/storage/storage_service.dart';
import '../../../core/services/network_service.dart';
import '../../../core/utils/logger.dart';
import '../models/user_model.dart';
import '../models/auth_state.dart';
import '../../../core/services/network_service.dart';
import '../services/auth_service.dart';

/// 当前用户提供者
final currentUserProvider = AsyncNotifierProvider<CurrentUserNotifier, UserModel?>(() {
  return CurrentUserNotifier();
});

/// 便捷的认证状态检查提供者
final isAuthenticatedProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user.hasValue && user.value != null;
});

/// 便捷的加载状态检查提供者
final isAuthLoadingProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user.isLoading;
});

/// 便捷的错误状态检查提供者
final authErrorProvider = Provider<String?>((ref) {
  final user = ref.watch(currentUserProvider);
  return user.hasError ? user.error.toString() : null;
});

/// 最后登录时间提供者
final lastLoginTimeProvider = Provider<DateTime?>((ref) {
  final authState = ref.watch(currentUserProvider);
  return authState.when(
    data: (user) => user?.lastLoginAt,
    loading: () => null,
    error: (_, __) => null,
  );
});

/// 会话有效性检查提供者
final isSessionValidProvider = Provider<bool>((ref) {
  final authState = ref.watch(currentUserProvider);
  return authState.when(
    data: (user) {
      if (user == null) return false;
      final lastLogin = user.lastLoginAt;
      if (lastLogin == null) return false;
      final now = DateTime.now();
      final difference = now.difference(lastLogin);
      return difference.inDays < 30; // 30天内有效
    },
    loading: () => false,
    error: (_, __) => false,
  );
});

/// 认证操作提供者
final authActionsProvider = Provider<AuthActions>((ref) {
  return AuthActions(ref);
});

/// 当前用户状态管理器
class CurrentUserNotifier extends AsyncNotifier<UserModel?> {
  late AuthService _authService;
  late StorageService _storageService;

  @override
  Future<UserModel?> build() async {
    _authService = ref.read(authServiceProvider);
    _storageService = ref.read(storageServiceProvider);
    return await _initializeAuth();
  }
  
  Future<UserModel?> _initializeAuth() async {
    try {
      // 检查本地存储的token
      final token = await _storageService.getString('auth_token');
      if (token == null || token.isEmpty) {
        return null;
      }

      // 获取用户信息来验证token
      final user = await _authService.getCurrentUser();
      if (user != null) {
        return user;
      } else {
        // token无效，清除本地存储
          await _storageService.clearToken();
        return null;
      }
    } catch (e) {
      Logger.e('初始化认证失败', error: e);
      return null;
    }
  }
  
  /// 用户登录
  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    
    try {
      final result = await _authService.login(email, password);
      
      if (result.success && result.user != null) {
        // 保存token
        if (result.token != null) {
          await _storageService.setString('auth_token', result.token!);
        }
        if (result.refreshToken != null) {
          await _storageService.setString('refresh_token', result.refreshToken!);
        }
        
        state = AsyncValue.data(result.user);
      } else {
        state = AsyncValue.error(result.message ?? '登录失败', StackTrace.current);
      }
    } catch (e) {
      Logger.e('登录失败', error: e);
      state = AsyncValue.error('登录失败: $e', StackTrace.current);
    }
  }
  
  /// 完成登录
  Future<void> completeSignIn(AuthResult result) async {
    try {
      if (result.success && result.user != null) {
        // 保存token
        if (result.token != null) {
          await _storageService.setString('auth_token', result.token!);
        }
        if (result.refreshToken != null) {
          await _storageService.setString('refresh_token', result.refreshToken!);
        }
        
        state = AsyncValue.data(result.user);
      } else {
        state = AsyncValue.error(result.message ?? '登录失败', StackTrace.current);
      }
    } catch (e) {
      Logger.e('完成登录失败', error: e);
      state = AsyncValue.error('登录失败: $e', StackTrace.current);
    }
  }
  
  /// 用户登出
  Future<void> logout() async {
    try {
      // 调用服务端登出接口
      await _authService.logout();
    } catch (e) {
      Logger.e('服务端登出失败', error: e);
    } finally {
      // 清除本地存储
        await _storageService.clearToken();
      state = const AsyncValue.data(null);
    }
  }
  
  /// 刷新用户信息
  Future<void> refreshUser() async {
    try {
      final user = await _authService.getCurrentUser();
      if (user != null) {
        state = AsyncValue.data(user);
      } else {
        state = AsyncValue.error('获取用户信息失败', StackTrace.current);
      }
    } catch (e) {
      Logger.e('刷新用户信息失败', error: e);
      state = AsyncValue.error('刷新用户信息失败: $e', StackTrace.current);
    }
  }
  
  /// 更新用户资料
  Future<void> updateProfile({
    String? name,
    String? phone,
    String? avatar,
  }) async {
    try {
      final result = await _authService.updateProfile(
        name: name,
        phone: phone,
        avatar: avatar,
      );
      
      if (result.success && result.user != null) {
        state = AsyncValue.data(result.user!);
      } else {
        state = AsyncValue.error(result.message ?? '更新失败', StackTrace.current);
      }
    } catch (e) {
      Logger.e('更新用户资料失败', error: e);
      state = AsyncValue.error('更新失败: $e', StackTrace.current);
    }
  }
}

/// 认证操作类
class AuthActions {
  final Ref _ref;
  
  AuthActions(this._ref);
  
  AuthService get _authService => _ref.read(authServiceProvider);
  StorageService get _storageService => _ref.read(storageServiceProvider);
  
  /// 用户登录
  Future<void> login(String email, String password) async {
    await _ref.read(currentUserProvider.notifier).login(email, password);
  }
  
  /// 用户注册
  Future<AuthResult> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      final result = await _authService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      
      if (result.success && result.user != null) {
        await _ref.read(currentUserProvider.notifier).completeSignIn(result);
      }
      
      return result;
    } catch (e) {
      Logger.e('注册异常', error: e);
      return AuthResult(
        success: false,
        message: e.toString(),
      );
    }
  }
  
  /// 用户登出
  Future<void> logout() async {
    await _ref.read(currentUserProvider.notifier).logout();
  }
  
  /// 发送Magic Link
  Future<AuthResult> sendMagicLink(String email) async {
    try {
      return await _authService.sendMagicLink(email);
    } catch (e) {
      Logger.e('发送Magic Link失败', error: e);
      return AuthResult(
        success: false,
        message: e.toString(),
      );
    }
  }
  
  /// 验证Magic Link并登录
  Future<void> verifyMagicLinkAndLogin(String token) async {
    try {
      final result = await _authService.verifyMagicLink(token);
      if (result.success && result.user != null) {
        await _ref.read(currentUserProvider.notifier).completeSignIn(result);
      }
    } catch (e) {
      Logger.e('验证Magic Link失败', error: e);
      throw e;
    }
  }
  
  /// 刷新 Token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _storageService.getString('refresh_token');
      if (refreshToken == null) {
        await logout();
        return false;
      }
      
      final result = await _authService.refreshToken(refreshToken);
      
      if (result.success && result.token != null) {
        await _storageService.setString('auth_token', result.token!);
        if (result.refreshToken != null) {
          await _storageService.setString('refresh_token', result.refreshToken!);
        }
        
        Logger.auth('Token 刷新成功');
        return true;
      } else {
        await logout();
        return false;
      }
    } catch (e) {
      Logger.e('Token 刷新失败', error: e);
      await logout();
      return false;
    }
  }
  
  /// 更新用户信息
  Future<void> updateProfile({
    String? name,
    String? phone,
    String? avatar,
  }) async {
    await _ref.read(currentUserProvider.notifier).updateProfile(
      name: name,
      phone: phone,
      avatar: avatar,
    );
  }
  
  /// 修改密码
  Future<AuthResult> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      return await _authService.changePassword(
        currentPassword: oldPassword,
        newPassword: newPassword,
      );
    } catch (e) {
      Logger.e('密码修改失败', error: e);
      return AuthResult(
        success: false,
        message: e.toString(),
      );
    }
  }
  
  /// 忘记密码
  Future<AuthResult> forgotPassword(String email) async {
    try {
      return await _authService.forgotPassword(email);
    } catch (e) {
      Logger.e('密码重置失败', error: e);
      return AuthResult(
        success: false,
        message: e.toString(),
      );
    }
  }
  
  /// 验证邮箱
  Future<void> verifyEmail(String code) async {
    try {
      final result = await _authService.verifyEmail(code);
      if (result.success && result.user != null) {
        await _ref.read(currentUserProvider.notifier).refreshUser();
      }
    } catch (e) {
      Logger.e('邮箱验证失败', error: e);
      throw e;
    }
  }
  
  /// 获取错误信息
  String _getErrorMessage(dynamic error) {
    if (error is DioException) {
      switch (error.response?.statusCode) {
        case 400:
          return '请求参数错误';
        case 401:
          return '用户名或密码错误';
        case 403:
          return '访问被拒绝';
        case 404:
          return '服务不存在';
        case 422:
          return '数据验证失败';
        case 500:
          return '服务器内部错误';
        default:
          return error.message ?? '网络请求失败';
      }
    }
    return error.toString();
  }
}