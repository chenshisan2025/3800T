import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/services/network_service.dart';
import '../../../core/utils/logger.dart';
import '../models/user_model.dart';
import '../models/auth_state.dart';

/// 认证服务提供者
final authServiceProvider = Provider<AuthService>((ref) {
  final networkService = ref.watch(networkServiceProvider);
  return AuthService(networkService);
});

/// 认证服务
class AuthService {
  final NetworkService _networkService;
  
  AuthService(this._networkService);
  
  /// 用户登录
  Future<AuthResult> login(String email, String password) async {
    try {
      final response = await _networkService.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        
        return AuthResult.success(
          user: user,
          token: data['access_token'],
          refreshToken: data['refresh_token'],
          message: '登录成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '登录失败');
      }
    } on DioException catch (e) {
      Logger.e('登录请求失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('登录异常', error: e);
      return AuthResult.failure('登录失败，请稍后重试');
    }
  }
  
  /// 发送Magic Link
  Future<AuthResult> sendMagicLink(String email) async {
    try {
      final response = await _networkService.post(
        '/auth/magic-link',
        data: {
          'email': email,
        },
      );
      
      if (response.statusCode == 200) {
        return AuthResult.success(
          message: response.data['message'] ?? 'Magic Link已发送到您的邮箱',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '发送失败');
      }
    } on DioException catch (e) {
      Logger.e('发送Magic Link失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('发送Magic Link异常', error: e);
      return AuthResult.failure('发送失败，请稍后重试');
    }
  }
  
  /// 验证Magic Link Token
  Future<AuthResult> verifyMagicLink(String token) async {
    try {
      final response = await _networkService.post(
        '/auth/verify-magic-link',
        data: {
          'token': token,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        
        return AuthResult.success(
          user: user,
          token: data['access_token'],
          refreshToken: data['refresh_token'],
          message: '登录成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '验证失败');
      }
    } on DioException catch (e) {
      Logger.e('验证Magic Link失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('验证Magic Link异常', error: e);
      return AuthResult.failure('验证失败，请稍后重试');
    }
  }
  
  /// 用户注册
  Future<AuthResult> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      final response = await _networkService.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'name': name,
          if (phone != null) 'phone': phone,
        },
      );
      
      if (response.statusCode == 201) {
        final data = response.data['data'];
        final user = UserModel.fromJson(data['user']);
        
        return AuthResult.success(
          user: user,
          token: data['access_token'],
          refreshToken: data['refresh_token'],
          message: '注册成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '注册失败');
      }
    } on DioException catch (e) {
      Logger.e('注册请求失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('注册异常', error: e);
      return AuthResult.failure('注册失败，请稍后重试');
    }
  }
  
  /// 获取当前用户信息
  Future<UserModel?> getCurrentUser() async {
    try {
      final response = await _networkService.get('/auth/me');
      
      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['data']);
      }
      return null;
    } on DioException catch (e) {
      Logger.e('获取用户信息失败', error: e);
      return null;
    } catch (e) {
      Logger.e('获取用户信息异常', error: e);
      return null;
    }
  }
  
  /// 用户登出
  Future<void> logout() async {
    try {
      await _networkService.post('/auth/logout');
    } on DioException catch (e) {
      Logger.e('登出请求失败', error: e);
    } catch (e) {
      Logger.e('登出异常', error: e);
    }
  }
  
  /// 刷新Token
  Future<AuthResult> refreshToken(String refreshToken) async {
    try {
      final response = await _networkService.post(
        '/auth/refresh',
        data: {
          'refresh_token': refreshToken,
        },
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        
        return AuthResult.success(
          token: data['access_token'],
          refreshToken: data['refresh_token'],
          message: 'Token刷新成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? 'Token刷新失败');
      }
    } on DioException catch (e) {
      Logger.e('Token刷新失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('Token刷新异常', error: e);
      return AuthResult.failure('Token刷新失败');
    }
  }
  
  /// 忘记密码
  Future<AuthResult> forgotPassword(String email) async {
    try {
      final response = await _networkService.post(
        '/auth/forgot-password',
        data: {
          'email': email,
        },
      );
      
      if (response.statusCode == 200) {
        return AuthResult.success(
          message: response.data['message'] ?? '重置密码邮件已发送',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '发送失败');
      }
    } on DioException catch (e) {
      Logger.e('忘记密码请求失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('忘记密码异常', error: e);
      return AuthResult.failure('发送失败，请稍后重试');
    }
  }
  
  /// 验证邮箱
  Future<AuthResult> verifyEmail(String code) async {
    try {
      final response = await _networkService.post(
        '/auth/verify-email',
        data: {
          'code': code,
        },
      );
      
      if (response.statusCode == 200) {
        return AuthResult.success(
          message: response.data['message'] ?? '邮箱验证成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '验证失败');
      }
    } on DioException catch (e) {
      Logger.e('邮箱验证失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('邮箱验证异常', error: e);
      return AuthResult.failure('验证失败，请稍后重试');
    }
  }

  /// 修改密码
  Future<AuthResult> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _networkService.post(
        '/auth/change-password',
        data: {
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      );
      
      if (response.statusCode == 200) {
        return AuthResult.success(
          message: response.data['message'] ?? '密码修改成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '密码修改失败');
      }
    } on DioException catch (e) {
      Logger.e('修改密码失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('修改密码异常', error: e);
      return AuthResult.failure('密码修改失败，请稍后重试');
    }
  }

  /// 更新用户资料
  Future<AuthResult> updateProfile({
    String? name,
    String? phone,
    String? avatar,
  }) async {
    try {
      final response = await _networkService.put(
        '/auth/profile',
        data: {
          if (name != null) 'name': name,
          if (phone != null) 'phone': phone,
          if (avatar != null) 'avatar': avatar,
        },
      );
      
      if (response.statusCode == 200) {
        final user = UserModel.fromJson(response.data['data']);
        return AuthResult.success(
          user: user,
          message: '资料更新成功',
        );
      } else {
        return AuthResult.failure(response.data['message'] ?? '更新失败');
      }
    } on DioException catch (e) {
      Logger.e('更新资料失败', error: e);
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      Logger.e('更新资料异常', error: e);
      return AuthResult.failure('更新失败，请稍后重试');
    }
  }
  
  /// 处理Dio错误
  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return '网络连接超时，请检查网络设置';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data?['message'];
        
        if (statusCode == 401) {
          return '认证失败，请重新登录';
        } else if (statusCode == 403) {
          return '权限不足';
        } else if (statusCode == 404) {
          return '请求的资源不存在';
        } else if (statusCode == 422) {
          return message ?? '请求参数错误';
        } else if (statusCode == 500) {
          return '服务器内部错误，请稍后重试';
        }
        
        return message ?? '请求失败';
      case DioExceptionType.connectionError:
        return '网络连接失败，请检查网络设置';
      case DioExceptionType.cancel:
        return '请求已取消';
      default:
        return '网络错误，请稍后重试';
    }
  }
}