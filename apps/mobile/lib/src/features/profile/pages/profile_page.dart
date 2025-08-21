import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/components/app_toast.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/theme_service.dart' as theme_service;
import '../../../app.dart';

import '../../auth/providers/auth_provider.dart';
import '../../auth/models/auth_state.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isLoggedIn = authState.isAuthenticated;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.profile),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  child: Icon(
                    Icons.person,
                    size: 30,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isLoggedIn ? (user?.email ?? AppStrings.username) : AppStrings.notLoggedIn,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isLoggedIn ? AppStrings.loggedIn : AppStrings.clickToLogin,
                      style: TextStyle(
                        fontSize: 14,
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView(
              children: [
                if (isLoggedIn) ...[
                  ListTile(
                    leading: const Icon(Icons.notifications_outlined),
                    title: Text(AppStrings.notifications),
                    trailing: Switch(
                      value: true,
                      onChanged: (value) {
                        // TODO: 实现通知设置
                      },
                    ),
                  ),
                  const Divider(height: 1),
                  Consumer(
                      builder: (context, ref, child) {
                        final currentTheme = ref.watch(themeNotifierProvider);
                        
                        return ListTile(
                          leading: const Icon(Icons.brightness_6_outlined),
                          title: Text(AppStrings.themeSettings),
                          subtitle: Text(_getThemeLabel(currentTheme)),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => _showThemeDialog(context, ref),
                        );
                      },
                    ),
                  const Divider(),
                ],
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.language_outlined),
                  title: Text(AppStrings.languageSettings),
                  subtitle: Text(AppStrings.simplifiedChinese),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: 实现语言设置
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.settings),
                  title: Text(AppStrings.settings),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.go('/settings'),
                ),
                ListTile(
                  leading: const Icon(Icons.help_outline),
                  title: Text(AppStrings.helpAndFeedback),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: 实现帮助页面
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: Text(AppStrings.aboutUs),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: 实现关于页面
                  },
                ),
                if (isLoggedIn)
                  ListTile(
                    leading: Icon(Icons.logout, color: Theme.of(context).colorScheme.error),
                    title: Text(AppStrings.logout, style: TextStyle(color: Theme.of(context).colorScheme.error)),
                    onTap: () => _showLogoutDialog(context, ref),
                  ),
                if (!isLoggedIn)
                  ListTile(
                    leading: const Icon(Icons.login),
                    title: Text(AppStrings.loginNow),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/login'),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showThemeDialog(BuildContext context, WidgetRef ref) {
    final currentTheme = ref.read(themeNotifierProvider);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppStrings.themeSettings),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: theme_service.ThemeMode.values.map((themeMode) {
            return RadioListTile<theme_service.ThemeMode>(
              title: Text(_getThemeLabel(themeMode)),
              value: themeMode,
              groupValue: currentTheme,
              onChanged: (value) {
                if (value != null) {
                  ref.read(themeNotifierProvider.notifier).setThemeMode(value);
                  Navigator.of(context).pop();
                }
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(AppStrings.cancel),
          ),
        ],
      ),
    );
  }

  /// 获取主题模式的标签
  String _getThemeLabel(theme_service.ThemeMode themeMode) {
    switch (themeMode) {
      case theme_service.ThemeMode.light:
        return '浅色模式';
      case theme_service.ThemeMode.dark:
        return '深色模式';
      case theme_service.ThemeMode.system:
        return '跟随系统';
    }
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppStrings.logout),
        content: Text(AppStrings.confirmLogout),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(AppStrings.cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(authProvider.notifier).logout();
            },
            child: Text(AppStrings.confirm),
          ),
        ],
      ),
    );
  }
}