import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/models/user_model.dart';
import '../../features/auth/services/auth_service.dart';

// 认证状态提供者
final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

// 认证状态管理器
class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AsyncValue.loading()) {
    _checkAuthStatus();
  }

  // 检查认证状态
  Future<void> _checkAuthStatus() async {
    try {
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // 登录
  Future<void> signIn(String email) async {
    state = const AsyncValue.loading();
    try {
      await _authService.sendMagicLink(email);
      // 魔法链接发送成功，但用户还未完成验证
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // 登出
  Future<void> signOut() async {
    try {
      await _authService.logout();
      state = const AsyncValue.data(null);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  // 刷新用户信息
  Future<void> refreshUser() async {
    try {
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }
}

// 便捷的getter
final currentUserProvider = Provider<UserModel?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.asData?.value;
});

// 是否已登录
final isLoggedInProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user != null;
});