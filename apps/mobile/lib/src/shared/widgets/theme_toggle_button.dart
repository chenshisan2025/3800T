import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/theme_service.dart' as theme_service;
import '../../app.dart';

/// 主题切换按钮组件
class ThemeToggleButton extends ConsumerWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeNotifier = ref.watch(themeNotifierProvider);
    final currentTheme = themeNotifier.themeMode;

    return PopupMenuButton<theme_service.ThemeMode>(
      icon: Icon(
        _getThemeIcon(currentTheme),
        color: Theme.of(context).iconTheme.color,
      ),
      onSelected: (theme_service.ThemeMode themeMode) {
        themeNotifier.setThemeMode(themeMode);
      },
      itemBuilder: (BuildContext context) => [
        PopupMenuItem(
          value: theme_service.ThemeMode.light,
          child: Row(
            children: [
              Icon(
                Icons.light_mode,
                color: currentTheme == theme_service.ThemeMode.light
                    ? Theme.of(context).primaryColor
                    : null,
              ),
              const SizedBox(width: 8),
              Text(
                '浅色模式',
                style: TextStyle(
                  color: currentTheme == theme_service.ThemeMode.light
                      ? Theme.of(context).primaryColor
                      : null,
                ),
              ),
            ],
          ),
        ),
        PopupMenuItem(
          value: theme_service.ThemeMode.dark,
          child: Row(
            children: [
              Icon(
                Icons.dark_mode,
                color: currentTheme == theme_service.ThemeMode.dark
                    ? Theme.of(context).primaryColor
                    : null,
              ),
              const SizedBox(width: 8),
              Text(
                '深色模式',
                style: TextStyle(
                  color: currentTheme == theme_service.ThemeMode.dark
                      ? Theme.of(context).primaryColor
                      : null,
                ),
              ),
            ],
          ),
        ),
        PopupMenuItem(
          value: theme_service.ThemeMode.system,
          child: Row(
            children: [
              Icon(
                Icons.settings_system_daydream,
                color: currentTheme == theme_service.ThemeMode.system
                    ? Theme.of(context).primaryColor
                    : null,
              ),
              const SizedBox(width: 8),
              Text(
                '跟随系统',
                style: TextStyle(
                  color: currentTheme == theme_service.ThemeMode.system
                      ? Theme.of(context).primaryColor
                      : null,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// 根据主题模式获取对应图标
  IconData _getThemeIcon(theme_service.ThemeMode themeMode) {
    switch (themeMode) {
      case theme_service.ThemeMode.light:
        return Icons.light_mode;
      case theme_service.ThemeMode.dark:
        return Icons.dark_mode;
      case theme_service.ThemeMode.system:
        return Icons.settings_system_daydream;
    }
  }
}