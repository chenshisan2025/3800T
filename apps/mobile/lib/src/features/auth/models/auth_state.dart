import 'package:freezed_annotation/freezed_annotation.dart';

import 'user_model.dart';

part 'auth_state.freezed.dart';

/// 认证状态
@freezed
class AuthState with _$AuthState {
  /// 初始状态
  const factory AuthState.initial() = _Initial;
  
  /// 加载中状态
  const factory AuthState.loading() = _Loading;
  
  /// 已认证状态
  const factory AuthState.authenticated(UserModel user) = _Authenticated;
  
  /// 未认证状态
  const factory AuthState.unauthenticated() = _Unauthenticated;
  
  /// 错误状态
  const factory AuthState.error(String message) = _Error;
  
  /// 通用状态（包含所有字段）
  const factory AuthState({
    @Default(false) bool isLoading,
    @Default(false) bool isAuthenticated,
    UserModel? user,
    String? error,
  }) = _AuthState;
}

/// 认证状态扩展方法
extension AuthStateX on AuthState {
  /// 是否正在加载
  bool get isLoading => when(
    initial: () => false,
    loading: () => true,
    authenticated: (_) => false,
    unauthenticated: () => false,
    error: (_) => false,
    () => this.isLoading,
  );
  
  /// 是否已认证
  bool get isAuthenticated => when(
    initial: () => false,
    loading: () => false,
    authenticated: (_) => true,
    unauthenticated: () => false,
    error: (_) => false,
    () => this.isAuthenticated,
  );
  
  /// 获取用户信息
  UserModel? get user => when(
    initial: () => null,
    loading: () => null,
    authenticated: (user) => user,
    unauthenticated: () => null,
    error: (_) => null,
    () => this.user,
  );
  
  /// 获取错误信息
  String? get error => when(
    initial: () => null,
    loading: () => null,
    authenticated: (_) => null,
    unauthenticated: () => null,
    error: (message) => message,
    () => this.error,
  );
  
  /// 是否有错误
  bool get hasError => error != null;
  
  /// 复制状态并更新字段
  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: error,
    );
  }
}

/// 认证结果
class AuthResult {
  final bool success;
  final String? message;
  final UserModel? user;
  final String? token;
  final String? refreshToken;
  
  const AuthResult({
    required this.success,
    this.message,
    this.user,
    this.token,
    this.refreshToken,
  });
  
  /// 成功结果
  factory AuthResult.success({
    UserModel? user,
    String? token,
    String? refreshToken,
    String? message,
  }) {
    return AuthResult(
      success: true,
      user: user,
      token: token,
      refreshToken: refreshToken,
      message: message,
    );
  }
  
  /// 失败结果
  factory AuthResult.failure(String message) {
    return AuthResult(
      success: false,
      message: message,
    );
  }
  
  @override
  String toString() {
    return 'AuthResult(success: $success, message: $message, user: $user)';
  }
}

/// 登录请求
class LoginRequest {
  final String email;
  final String password;
  final bool rememberMe;
  
  const LoginRequest({
    required this.email,
    required this.password,
    this.rememberMe = false,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'remember_me': rememberMe,
    };
  }
}

/// 注册请求
class RegisterRequest {
  final String email;
  final String password;
  final String name;
  final String? phone;
  final bool agreeToTerms;
  
  const RegisterRequest({
    required this.email,
    required this.password,
    required this.name,
    this.phone,
    this.agreeToTerms = false,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'name': name,
      if (phone != null) 'phone': phone,
      'agree_to_terms': agreeToTerms,
    };
  }
}

/// 密码修改请求
class ChangePasswordRequest {
  final String oldPassword;
  final String newPassword;
  final String confirmPassword;
  
  const ChangePasswordRequest({
    required this.oldPassword,
    required this.newPassword,
    required this.confirmPassword,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'old_password': oldPassword,
      'new_password': newPassword,
      'confirm_password': confirmPassword,
    };
  }
}

/// 忘记密码请求
class ForgotPasswordRequest {
  final String email;
  
  const ForgotPasswordRequest({
    required this.email,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'email': email,
    };
  }
}

/// 重置密码请求
class ResetPasswordRequest {
  final String token;
  final String password;
  final String confirmPassword;
  
  const ResetPasswordRequest({
    required this.token,
    required this.password,
    required this.confirmPassword,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'token': token,
      'password': password,
      'confirm_password': confirmPassword,
    };
  }
}

/// 邮箱验证请求
class VerifyEmailRequest {
  final String code;
  
  const VerifyEmailRequest({
    required this.code,
  });
  
  Map<String, dynamic> toJson() {
    return {
      'code': code,
    };
  }
}

/// 用户信息更新请求
class UpdateProfileRequest {
  final String? name;
  final String? phone;
  final String? avatar;
  final Map<String, dynamic>? preferences;
  
  const UpdateProfileRequest({
    this.name,
    this.phone,
    this.avatar,
    this.preferences,
  });
  
  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    
    if (name != null) json['name'] = name;
    if (phone != null) json['phone'] = phone;
    if (avatar != null) json['avatar'] = avatar;
    if (preferences != null) json['preferences'] = preferences;
    
    return json;
  }
}