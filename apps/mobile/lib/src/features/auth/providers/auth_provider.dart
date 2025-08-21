import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/storage/storage_service.dart';
import '../../../core/services/network_service.dart';
import '../../../core/utils/logger.dart';
import '../models/user_model.dart';
import '../models/auth_state.dart';
import '../services/auth_service.dart';

/// 认证状态提供者
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final storageService = ref.watch(storageServiceProvider);
  return AuthNotifier(authService, storageService);
});

/// 当前用户提供者
final currentUserProvider = Provider<UserModel?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user;
});

/// 认证状态管理器
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final StorageService _storageService;
  
  AuthNotifier(this._authService, this._storageService) 
      : super(const AuthState.initial()) {
    _initializeAuth();
  }
  
  /// 初始化认证状态
  Future<void> _initializeAuth() async {
    try {
      state = state.copyWith(isLoading: true);
      
      // 检查本地存储的 token
      final token = await _storageService.getToken();
      if (token == null) {
        state = const AuthState.unauthenticated();
        return;
      }
      
      // 验证 token 有效性并获取用户信息
      final user = await _authService.getCurrentUser();
      if (user != null) {
        state = AuthState.authenticated(user);
        Logger.auth('用户认证成功', userId: user.id);
      } else {
        // Token 无效，清除本地数据
        await _clearAuthData();
        state = const AuthState.unauthenticated();
      }
    } catch (e) {
      Logger.e('认证初始化失败', error: e);
      await _clearAuthData();
      state = AuthState.error(e.toString());
    }
  }
  
  /// 用户登录
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      Logger.auth('开始登录', userId: email);
      
      final result = await _authService.login(email, password);
      
      if (result.success && result.user != null) {
        // 保存认证信息
        await _storageService.saveToken(result.token!);
        if (result.refreshToken != null) {
          await _storageService.saveRefreshToken(result.refreshToken!);
        }
        await _storageService.saveUserData(result.user!.toJson());
        
        state = AuthState.authenticated(result.user!);
        Logger.auth('登录成功', userId: result.user!.id);
        return true;
      } else {
        state = AuthState.error(result.message ?? '登录失败');
        Logger.auth('登录失败: ${result.message}');
        return false;
      }
    } catch (e) {
      final errorMessage = _getErrorMessage(e);
      state = AuthState.error(errorMessage);
      Logger.e('登录异常', error: e);
      return false;
    }
  }
  
  /// 用户注册
  Future<bool> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      Logger.auth('开始注册', userId: email);
      
      final result = await _authService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      
      if (result.success && result.user != null) {
        // 保存认证信息
        await _storageService.saveToken(result.token!);
        if (result.refreshToken != null) {
          await _storageService.saveRefreshToken(result.refreshToken!);
        }
        await _storageService.saveUserData(result.user!.toJson());
        
        state = AuthState.authenticated(result.user!);
        Logger.auth('注册成功', userId: result.user!.id);
        return true;
      } else {
        state = AuthState.error(result.message ?? '注册失败');
        Logger.auth('注册失败: ${result.message}');
        return false;
      }
    } catch (e) {
      final errorMessage = _getErrorMessage(e);
      state = AuthState.error(errorMessage);
      Logger.e('注册异常', error: e);
      return false;
    }
  }
  
  /// 用户登出
  Future<void> logout() async {
    try {
      Logger.auth('开始登出', userId: state.user?.id);
      
      // 调用服务端登出接口
      await _authService.logout();
      
      // 清除本地数据
      await _clearAuthData();
      
      state = const AuthState.unauthenticated();
      Logger.auth('登出成功');
    } catch (e) {
      Logger.e('登出失败', error: e);
      // 即使服务端登出失败，也要清除本地数据
      await _clearAuthData();
      state = const AuthState.unauthenticated();
    }
  }
  
  /// 发送Magic Link
  Future<void> sendMagicLink(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final result = await _authService.sendMagicLink(email);
      
      if (result.success) {
        state = state.copyWith(
          isLoading: false,
          error: null,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? 'Magic Link发送失败',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
  
  /// 验证Magic Link并登录
  Future<void> verifyMagicLinkAndLogin(String token) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final result = await _authService.verifyMagicLink(token);
      
      if (result.success && result.user != null) {
        // 保存认证信息
        await _storageService.saveToken(result.token!);
        if (result.refreshToken != null) {
          await _storageService.saveRefreshToken(result.refreshToken!);
        }
        await _storageService.saveUserData(result.user!.toJson());
        
        state = AuthState.authenticated(result.user!);
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? 'Magic Link验证失败',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
  
  /// 刷新 Token
  Future<bool> refreshToken() async {
    try {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null) {
        await logout();
        return false;
      }
      
      final result = await _authService.refreshToken(refreshToken);
      
      if (result.success && result.token != null) {
        await _storageService.saveToken(result.token!);
        if (result.refreshToken != null) {
          await _storageService.saveRefreshToken(result.refreshToken!);
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
  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? avatar,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      
      final result = await _authService.updateProfile(
        name: name,
        phone: phone,
        avatar: avatar,
      );
      
      if (result.success && result.user != null) {
        await _storageService.saveUserData(result.user!.toJson());
        state = AuthState.authenticated(result.user!);
        Logger.auth('用户信息更新成功', userId: result.user!.id);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? '更新失败',
        );
        return false;
      }
    } catch (e) {
      final errorMessage = _getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errorMessage);
      Logger.e('用户信息更新失败', error: e);
      return false;
    }
  }
  
  /// 修改密码
  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      
      final result = await _authService.changePassword(
        currentPassword: oldPassword,
        newPassword: newPassword,
      );
      
      if (result.success) {
        state = state.copyWith(isLoading: false);
        Logger.auth('密码修改成功', userId: state.user?.id);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? '密码修改失败',
        );
        return false;
      }
    } catch (e) {
      final errorMessage = _getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errorMessage);
      Logger.e('密码修改失败', error: e);
      return false;
    }
  }
  
  /// 忘记密码
  Future<bool> forgotPassword(String email) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      
      final result = await _authService.forgotPassword(email);
      
      if (result.success) {
        state = state.copyWith(isLoading: false);
        Logger.auth('密码重置邮件发送成功', userId: email);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? '发送失败',
        );
        return false;
      }
    } catch (e) {
      final errorMessage = _getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errorMessage);
      Logger.e('密码重置失败', error: e);
      return false;
    }
  }
  
  /// 验证邮箱
  Future<bool> verifyEmail(String code) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      
      final result = await _authService.verifyEmail(code);
      
      if (result.success && result.user != null) {
        await _storageService.saveUserData(result.user!.toJson());
        state = AuthState.authenticated(result.user!);
        Logger.auth('邮箱验证成功', userId: result.user!.id);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.message ?? '验证失败',
        );
        return false;
      }
    } catch (e) {
      final errorMessage = _getErrorMessage(e);
      state = state.copyWith(isLoading: false, error: errorMessage);
      Logger.e('邮箱验证失败', error: e);
      return false;
    }
  }
  
  /// 清除认证数据
  Future<void> _clearAuthData() async {
    await _storageService.clearToken();
    await _storageService.clearRefreshToken();
    await _storageService.clearUserData();
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
  
  /// 清除错误状态
  void clearError() {
    if (state.error != null) {
      state = state.copyWith(error: null);
    }
  }
  
  /// 检查是否已认证
  bool get isAuthenticated => state.isAuthenticated;
  
  /// 检查是否正在加载
  bool get isLoading => state.isLoading;
  
  /// 获取当前用户
  UserModel? get currentUser => state.user;
  
  /// 获取错误信息
  String? get error => state.error;
}