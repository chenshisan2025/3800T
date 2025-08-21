import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/custom_card.dart';
import '../../../shared/widgets/custom_button.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';

/// Magic Link验证页面
class MagicLinkVerifyPage extends ConsumerStatefulWidget {
  final String token;
  
  const MagicLinkVerifyPage({
    super.key,
    required this.token,
  });

  @override
  ConsumerState<MagicLinkVerifyPage> createState() => _MagicLinkVerifyPageState();
}

class _MagicLinkVerifyPageState extends ConsumerState<MagicLinkVerifyPage> {
  bool _isVerifying = true;
  bool _verificationSuccess = false;
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _verifyToken();
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // 监听认证状态变化
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated && _verificationSuccess) {
        // 验证成功且已认证，跳转到主页
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            context.go('/');
          }
        });
      }
    });
    
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              _buildLogo(theme),
              
              const SizedBox(height: 48),
              
              // 验证状态卡片
              _buildVerificationCard(theme),
              
              const SizedBox(height: 32),
              
              // 操作按钮
              _buildActionButtons(theme),
            ],
          ),
        ),
      ),
    );
  }
  
  /// 构建Logo
  Widget _buildLogo(ThemeData theme) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.secondary,
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Icon(
        Icons.trending_up,
        size: 40,
        color: Colors.white,
      ),
    );
  }
  
  /// 构建验证状态卡片
  Widget _buildVerificationCard(ThemeData theme) {
    return CustomCard(
      child: Column(
        children: [
          // 状态图标
          _buildStatusIcon(theme),
          
          const SizedBox(height: 24),
          
          // 状态标题
          Text(
            _getStatusTitle(),
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 8),
          
          // 状态描述
          Text(
            _getStatusDescription(),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
          
          // 错误信息
          if (_errorMessage != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.errorContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.error_outline,
                    color: theme.colorScheme.error,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(
                        color: theme.colorScheme.error,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  /// 构建状态图标
  Widget _buildStatusIcon(ThemeData theme) {
    if (_isVerifying) {
      return Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: theme.colorScheme.primaryContainer,
          shape: BoxShape.circle,
        ),
        child: const CircularProgressIndicator(),
      );
    } else if (_verificationSuccess) {
      return Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.check_circle,
          size: 40,
          color: Colors.green,
        ),
      );
    } else {
      return Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: theme.colorScheme.errorContainer,
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.error,
          size: 40,
          color: theme.colorScheme.error,
        ),
      );
    }
  }
  
  /// 构建操作按钮
  Widget _buildActionButtons(ThemeData theme) {
    if (_isVerifying) {
      return const SizedBox.shrink();
    }
    
    if (_verificationSuccess) {
      return Column(
        children: [
          CustomButton(
            text: '进入应用',
            onPressed: () => context.go('/'),
            icon: Icons.arrow_forward,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('返回登录'),
          ),
        ],
      );
    } else {
      return Column(
        children: [
          CustomButton(
            text: '重新验证',
            onPressed: _retryVerification,
            icon: Icons.refresh,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('返回登录'),
          ),
        ],
      );
    }
  }
  
  /// 获取状态标题
  String _getStatusTitle() {
    if (_isVerifying) {
      return '正在验证...';
    } else if (_verificationSuccess) {
      return '验证成功';
    } else {
      return '验证失败';
    }
  }
  
  /// 获取状态描述
  String _getStatusDescription() {
    if (_isVerifying) {
      return '正在验证您的登录链接，请稍候...';
    } else if (_verificationSuccess) {
      return '登录链接验证成功！\n正在为您登录，请稍候...';
    } else {
      return '登录链接验证失败。\n链接可能已过期或无效。';
    }
  }
  
  /// 验证Token
  Future<void> _verifyToken() async {
    try {
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.verifyMagicLinkAndLogin(widget.token);
      
      // 检查认证状态
      final authState = ref.read(authProvider);
      
      if (authState.isAuthenticated) {
        setState(() {
          _isVerifying = false;
          _verificationSuccess = true;
        });
      } else {
        setState(() {
          _isVerifying = false;
          _verificationSuccess = false;
          _errorMessage = authState.error ?? '验证失败';
        });
      }
    } catch (e) {
      setState(() {
        _isVerifying = false;
        _verificationSuccess = false;
        _errorMessage = '验证过程中发生错误，请稍后重试';
      });
    }
  }
  
  /// 重新验证
  Future<void> _retryVerification() async {
    setState(() {
      _isVerifying = true;
      _verificationSuccess = false;
      _errorMessage = null;
    });
    
    await _verifyToken();
  }
}