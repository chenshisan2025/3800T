import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 主题模式枚举
enum ThemeMode {
  light,
  dark,
  system,
}

/// 主题服务
class ThemeService {
  static const String _tag = 'ThemeService';
  static const String _themeKey = 'theme_mode';
  
  static final ThemeService _instance = ThemeService._internal();
  factory ThemeService() => _instance;
  ThemeService._internal();
  
  ThemeMode _currentTheme = ThemeMode.system;
  final ValueNotifier<ThemeMode> _themeNotifier = ValueNotifier(ThemeMode.system);
  
  /// 获取当前主题模式
  ThemeMode get currentTheme => _currentTheme;
  
  /// 主题变化通知器
  ValueNotifier<ThemeMode> get themeNotifier => _themeNotifier;
  
  /// 初始化主题服务
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeIndex = prefs.getInt(_themeKey) ?? ThemeMode.system.index;
      _currentTheme = ThemeMode.values[themeIndex];
      _themeNotifier.value = _currentTheme;
      
      // Theme service initialized with theme: $_currentTheme
    } catch (e, stackTrace) {
      // Failed to initialize theme service: $e
    }
  }
  
  /// 设置主题模式
  Future<void> setThemeMode(ThemeMode themeMode) async {
    try {
      _currentTheme = themeMode;
      _themeNotifier.value = themeMode;
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_themeKey, themeMode.index);
      
      // 更新系统UI样式
      _updateSystemUIOverlay(themeMode);
      
      // Theme mode changed to: $themeMode
    } catch (e, stackTrace) {
      // Failed to set theme mode: $e
    }
  }
  
  /// 切换主题模式
  Future<void> toggleTheme() async {
    final newTheme = _currentTheme == ThemeMode.light 
        ? ThemeMode.dark 
        : ThemeMode.light;
    await setThemeMode(newTheme);
  }
  
  /// 更新系统UI覆盖层
  void _updateSystemUIOverlay(ThemeMode themeMode) {
    try {
      final brightness = _getBrightness(themeMode);
      final isDark = brightness == Brightness.dark;
      
      SystemChrome.setSystemUIOverlayStyle(
        SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
          statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
          systemNavigationBarColor: isDark ? Colors.black : Colors.white,
          systemNavigationBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        ),
      );
    } catch (e, stackTrace) {
      // Failed to update system UI overlay: $e
    }
  }
  
  /// 获取亮度
  Brightness _getBrightness(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return Brightness.light;
      case ThemeMode.dark:
        return Brightness.dark;
      case ThemeMode.system:
        return WidgetsBinding.instance.platformDispatcher.platformBrightness;
    }
  }
  
  /// 获取浅色主题
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF2196F3),
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black87,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
      ),
      cardTheme: const CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: Color(0xFF2196F3),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
  
  /// 获取深色主题
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF2196F3),
        brightness: Brightness.dark,
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      cardTheme: const CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        filled: true,
        fillColor: Colors.grey[800],
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        selectedItemColor: const Color(0xFF2196F3),
        unselectedItemColor: Colors.grey[400],
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
  
  /// 判断当前是否为深色主题
  bool get isDarkMode {
    final brightness = _getBrightness(_currentTheme);
    return brightness == Brightness.dark;
  }
  
  /// 获取适应主题的颜色
  Color getAdaptiveColor({
    required Color lightColor,
    required Color darkColor,
  }) {
    return isDarkMode ? darkColor : lightColor;
  }
  
  /// 获取文本颜色
  Color get textColor {
    return getAdaptiveColor(
      lightColor: Colors.black87,
      darkColor: Colors.white,
    );
  }
  
  /// 获取次要文本颜色
  Color get secondaryTextColor {
    return getAdaptiveColor(
      lightColor: Colors.grey[600]!,
      darkColor: Colors.grey[400]!,
    );
  }
  
  /// 获取背景颜色
  Color get backgroundColor {
    return getAdaptiveColor(
      lightColor: Colors.white,
      darkColor: Colors.grey[900]!,
    );
  }
  
  /// 获取卡片颜色
  Color get cardColor {
    return getAdaptiveColor(
      lightColor: Colors.white,
      darkColor: Colors.grey[850]!,
    );
  }
  
  /// 获取分割线颜色
  Color get dividerColor {
    return getAdaptiveColor(
      lightColor: Colors.grey[300]!,
      darkColor: Colors.grey[700]!,
    );
  }
}