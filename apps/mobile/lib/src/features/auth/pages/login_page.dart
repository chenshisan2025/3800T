import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_strings.dart';
import '../../../shared/widgets/custom_card.dart';
import '../../../shared/widgets/custom_button.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';

/// 登录页面
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isPasswordMode = false; // false: Magic Link, true: 密码登录
  bool _obscurePassword = true;
  bool _magicLinkSent = false;
  bool _isLoading = false;
  String? _errorMessage;
  
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    // 监听认证状态变化
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        // 登录成功，跳转到主页
        context.go('/');
      } else if (next.hasError) {
        setState(() {
          _errorMessage = next.error;
          _isLoading = false;
        });
      }
    });
    
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              
              // Logo和标题
              _buildHeader(theme),
              
              const SizedBox(height: 48),
              
              // 登录表单
              _buildLoginForm(theme),
              
              const SizedBox(height: 24),
              
              // 登录方式切换
              _buildLoginModeToggle(theme),
              
              const SizedBox(height: 32),
              
              // 免责声明
              _buildDisclaimer(theme),
            ],
          ),
        ),
      ),
    );
  }
  
  /// 构建头部
  Widget _buildHeader(ThemeData theme) {
    return Column(
      children: [
        // Logo
        Container(
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
          child: Icon(
            Icons.trending_up,
            size: 40,
            color: Colors.white,
          ),
        ),
        
        const SizedBox(height: 24),
        
        // 标题
        Text(
          AppStrings.appName,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
        
        const SizedBox(height: 8),
        
        Text(
          AppStrings.appDescription,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
      ],
    );
  }
  
  /// 构建登录表单
  Widget _buildLoginForm(ThemeData theme) {
    if (_magicLinkSent) {
      return _buildMagicLinkSentCard(theme);
    }
    
    return CustomCard(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 标题
            Text(
              _isPasswordMode ? AppStrings.passwordLogin : AppStrings.magicLinkLogin,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 8),
            
            Text(
              _isPasswordMode 
                  ? AppStrings.loginWithEmailPassword
                  : AppStrings.magicLinkDescription,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 32),
            
            // 邮箱输入
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: AppStrings.emailAddress,
                hintText: AppStrings.pleaseEnterEmail,
                prefixIcon: const Icon(Icons.email_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return AppStrings.pleaseEnterEmail;
                }
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}\$').hasMatch(value)) {
                  return AppStrings.pleaseEnterValidEmail;
                }
                return null;
              },
            ),
            
            // 密码输入（仅密码模式显示）
            if (_isPasswordMode) ...[
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  labelText: AppStrings.password,
                  hintText: AppStrings.pleaseEnterPassword,
                  prefixIcon: const Icon(Icons.lock_outlined),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return AppStrings.pleaseEnterPassword;
                  }
                  if (value.length < 6) {
                    return AppStrings.passwordMinLength;
                  }
                  return null;
                },
              ),
            ],
            
            const SizedBox(height: 24),
            
            // 错误信息
            if (_errorMessage != null) ...[
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
              const SizedBox(height: 16),
            ],
            
            // 登录按钮
            CustomButton(
              text: _isPasswordMode ? AppStrings.login : AppStrings.sendMagicLink,
              onPressed: _handleLogin,
              isLoading: authState.isLoading,
              icon: _isPasswordMode ? Icons.login : Icons.email,
            ),
          ],
        ),
      ),
    );
  }
  
  /// 构建Magic Link已发送卡片
  Widget _buildMagicLinkSentCard(ThemeData theme) {
    return CustomCard(
      child: Column(
        children: [
          // 成功图标
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.mark_email_read,
              size: 40,
              color: theme.colorScheme.primary,
            ),
          ),
          
          const SizedBox(height: 24),
          
          Text(
            AppStrings.magicLinkSent,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 8),
          
          Text(
            '${AppStrings.magicLinkSentTo} ${_emailController.text} ${AppStrings.magicLinkSentDescription}',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 32),
          
          // 重新发送按钮
          CustomButton(
            text: AppStrings.resend,
            onPressed: _isLoading ? null : _handleResendMagicLink,
            isLoading: _isLoading,
            variant: 'outline',
            icon: Icons.refresh,
          ),
          
          const SizedBox(height: 12),
          
          // 返回按钮
          TextButton(
            onPressed: () {
              setState(() {
                _magicLinkSent = false;
                _errorMessage = null;
              });
            },
            child: Text(AppStrings.backToLogin),
          ),
        ],
      ),
    );
  }
  
  /// 构建登录方式切换
  Widget _buildLoginModeToggle(ThemeData theme) {
    if (_magicLinkSent) return const SizedBox.shrink();
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          _isPasswordMode ? AppStrings.noPassword : AppStrings.haveAccount,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        TextButton(
          onPressed: () {
            setState(() {
              _isPasswordMode = !_isPasswordMode;
              _magicLinkSent = false;
              _passwordController.clear();
            });
          },
          child: Text(
            _isPasswordMode ? AppStrings.useMagicLinkLogin : AppStrings.usePasswordLogin,
          ),
        ),
      ],
    );
  }
  
  /// 构建免责声明
  Widget _buildDisclaimer(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.info_outline,
                size: 16,
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
              const SizedBox(width: 8),
              Text(
                AppStrings.disclaimer,
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            AppStrings.investmentRiskWarning,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
  
  /// 处理登录
  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    if (_isPasswordMode) {
      // 密码登录
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
    } else {
      // Magic Link登录
      await _handleMagicLinkLogin();
    }
  }
  
  /// 处理Magic Link登录
  Future<void> _handleMagicLinkLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    final authNotifier = ref.read(authProvider.notifier);
    
    await authNotifier.sendMagicLink(_emailController.text.trim());
    
    // 检查发送结果
    final authState = ref.read(authProvider);
    if (authState.error == null) {
      setState(() {
        _magicLinkSent = true;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppStrings.magicLinkSentSuccess),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
  
  /// 重新发送Magic Link
  Future<void> _handleResendMagicLink() async {
    final authNotifier = ref.read(authProvider.notifier);
    
    await authNotifier.sendMagicLink(_emailController.text.trim());
    
    // 检查发送结果
    final authState = ref.read(authProvider);
    if (authState.error == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppStrings.magicLinkResent),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
}