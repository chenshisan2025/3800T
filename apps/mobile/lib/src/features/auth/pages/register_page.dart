import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/custom_card.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../core/constants/app_strings.dart';
import '../providers/auth_provider.dart';

/// 注册页面
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreeToTerms = false;
  
  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);
    
    // 监听认证状态变化
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated) {
        // 注册成功，跳转到主页
        context.go('/');
      } else if (next.error != null) {
        // 显示错误信息
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: theme.colorScheme.error,
          ),
        );
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
              const SizedBox(height: 32),
              
              // Logo和标题
              _buildHeader(theme),
              
              const SizedBox(height: 48),
              
              // 注册表单
              _buildRegisterForm(theme, authState),
              
              const SizedBox(height: 24),
              
              // 注册按钮
              _buildRegisterButton(theme, authState),
              
              const SizedBox(height: 24),
              
              // 登录链接
              _buildLoginLink(theme),
              
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
          child: const Icon(
            Icons.trending_up,
            size: 40,
            color: Colors.white,
          ),
        ),
        
        const SizedBox(height: 24),
        
        // 标题
        Text(
          AppStrings.createAccount,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        
        const SizedBox(height: 8),
        
        // 副标题
        Text(
          AppStrings.joinAppDesc,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
  
  /// 构建注册表单
  Widget _buildRegisterForm(ThemeData theme, AuthState authState) {
    return CustomCard(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 姓名输入
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: AppStrings.name,
                hintText: AppStrings.enterName,
                prefixIcon: Icon(Icons.person_outline),
              ),
              textInputAction: TextInputAction.next,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return AppStrings.pleaseEnterName;
                }
                if (value.trim().length < 2) {
                  return AppStrings.nameMinLength;
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // 邮箱输入
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: AppStrings.email,
                hintText: AppStrings.enterEmail,
                prefixIcon: Icon(Icons.email_outlined),
              ),
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return AppStrings.pleaseEnterEmail;
                }
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}\$').hasMatch(value)) {
                  return AppStrings.pleaseEnterValidEmail;
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // 手机号输入（可选）
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(
                labelText: AppStrings.phoneOptional,
                hintText: AppStrings.enterPhone,
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              validator: (value) {
                if (value != null && value.trim().isNotEmpty) {
                  if (!RegExp(r'^1[3-9]\d{9}\$').hasMatch(value)) {
                    return AppStrings.pleaseEnterValidPhone;
                  }
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // 密码输入
            TextFormField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: AppStrings.password,
                hintText: AppStrings.enterPassword,
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
              ),
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.next,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return AppStrings.pleaseEnterPassword;
                }
                if (value.length < 8) {
                  return AppStrings.passwordMinLength8;
                }
                if (!RegExp(r'^(?=.*[a-zA-Z])(?=.*\d)').hasMatch(value)) {
                  return AppStrings.passwordMustContainLetterAndNumber;
                }
                return null;
              },
            ),
            
            const SizedBox(height: 16),
            
            // 确认密码输入
            TextFormField(
              controller: _confirmPasswordController,
              decoration: InputDecoration(
                labelText: AppStrings.confirmPassword,
                hintText: AppStrings.enterPasswordAgain,
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscureConfirmPassword = !_obscureConfirmPassword;
                    });
                  },
                ),
              ),
              obscureText: _obscureConfirmPassword,
              textInputAction: TextInputAction.done,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return AppStrings.pleaseConfirmPassword;
                }
                if (value != _passwordController.text) {
                  return AppStrings.passwordsDoNotMatch;
                }
                return null;
              },
            ),
            
            const SizedBox(height: 20),
            
            // 服务条款同意
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Checkbox(
                  value: _agreeToTerms,
                  onChanged: (value) {
                    setState(() {
                      _agreeToTerms = value ?? false;
                    });
                  },
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _agreeToTerms = !_agreeToTerms;
                      });
                    },
                    child: Text.rich(
                      TextSpan(
                        text: AppStrings.agreeToTermsPrefix,
                        style: theme.textTheme.bodySmall,
                        children: [
                          TextSpan(
                            text: AppStrings.userAgreement,
                            style: TextStyle(
                              color: theme.colorScheme.primary,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                          TextSpan(text: AppStrings.and),
                          TextSpan(
                            text: AppStrings.privacyPolicy,
                            style: TextStyle(
                              color: theme.colorScheme.primary,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  /// 构建注册按钮
  Widget _buildRegisterButton(ThemeData theme, AuthState authState) {
    return CustomButton(
      text: AppStrings.createAccount,
      onPressed: _agreeToTerms ? _handleRegister : null,
      isLoading: authState.isLoading,
      icon: Icons.person_add,
    );
  }
  
  /// 构建登录链接
  Widget _buildLoginLink(ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          AppStrings.alreadyHaveAccount,
          style: theme.textTheme.bodyMedium,
        ),
        TextButton(
          onPressed: () => context.go('/login'),
          child: Text(AppStrings.loginNow),
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
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 8),
              Text(
                AppStrings.riskWarning,
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            AppStrings.investmentRiskWarning,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
  
  /// 处理注册
  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppStrings.pleaseAgreeToTerms),
        ),
      );
      return;
    }
    
    final authNotifier = ref.read(authProvider.notifier);
    
    await authNotifier.register(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim().isNotEmpty 
          ? _phoneController.text.trim() 
          : null,
    );
  }
}