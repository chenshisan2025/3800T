import 'package:flutter/material.dart';

class AppTheme {
  // 主色调 - 使用统一的品牌色 #2166A5
  static const Color primaryColor = Color(0xFF2166A5);
  static const Color primaryColorLight = Color(0xFF4A90E2);
  static const Color primaryColorDark = Color(0xFF1A5490);
  
  // 功能色彩
  static const Color successColor = Color(0xFF00C851);
  static const Color warningColor = Color(0xFFFFB300);
  static const Color errorColor = Color(0xFFFF4444);
  static const Color infoColor = Color(0xFF2166A5);
  
  // 中性色彩
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Color(0xFFFFFFFF);
  static const Color textPrimaryColor = Color(0xFF333333);
  static const Color textSecondaryColor = Color(0xFF666666);
  static const Color textTertiaryColor = Color(0xFF999999);
  
  // A股特色颜色（红涨绿跌）
  static const Color stockUpColor = Color(0xFFFF4444);   // 红色上涨
  static const Color stockDownColor = Color(0xFF00C851); // 绿色下跌
  static const Color stockFlatColor = Color(0xFF666666); // 灰色平盘
  
  // 边框色
  static const Color borderLight = Color(0xFFF0F0F0);
  static const Color borderMedium = Color(0xFFE0E0E0);
  static const Color borderDark = Color(0xFFD0D0D0);
  
  // 阴影色
  static const Color shadowColor = Color(0x1A000000);
  
  // 亮色主题
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarTheme(
        backgroundColor: surfaceColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: textSecondaryColor,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: CardTheme(
        color: surfaceColor,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          color: textPrimaryColor,
          fontSize: 32,
          fontWeight: FontWeight.bold,
        ),
        displayMedium: TextStyle(
          color: textPrimaryColor,
          fontSize: 28,
          fontWeight: FontWeight.bold,
        ),
        displaySmall: TextStyle(
          color: textPrimaryColor,
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
        headlineLarge: TextStyle(
          color: textPrimaryColor,
          fontSize: 22,
          fontWeight: FontWeight.w600,
        ),
        headlineMedium: TextStyle(
          color: textPrimaryColor,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
        headlineSmall: TextStyle(
          color: textPrimaryColor,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        titleLarge: TextStyle(
          color: textPrimaryColor,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        titleMedium: TextStyle(
          color: textPrimaryColor,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        titleSmall: TextStyle(
          color: textSecondaryColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
        bodyLarge: TextStyle(
          color: textPrimaryColor,
          fontSize: 16,
        ),
        bodyMedium: TextStyle(
          color: textPrimaryColor,
          fontSize: 14,
        ),
        bodySmall: TextStyle(
          color: textSecondaryColor,
          fontSize: 12,
        ),
      ),
    );
  }
  
  // 暗色主题
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.dark,
      ),
      primaryColor: primaryColor,
      scaffoldBackgroundColor: const Color(0xFF121212),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF1E1E1E),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarTheme(
        backgroundColor: Color(0xFF1E1E1E),
        selectedItemColor: primaryColor,
        unselectedItemColor: Color(0xFF8C8C8C),
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: CardTheme(
        color: const Color(0xFF1E1E1E),
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}

// 股票相关的样式工具类
class StockTheme {
  // 获取股票变化的颜色
  static Color getChangeColor(double change) {
    if (change > 0) return AppTheme.stockUpColor;   // 红色上涨
    if (change < 0) return AppTheme.stockDownColor; // 绿色下跌
    return AppTheme.stockFlatColor;                 // 灰色平盘
  }
  
  // 获取股票变化的文本样式
  static TextStyle getChangeTextStyle(double change, {double fontSize = 14}) {
    return TextStyle(
      color: getChangeColor(change),
      fontSize: fontSize,
      fontWeight: FontWeight.w500,
    );
  }
  
  // 格式化价格显示
  static String formatPrice(double price, {int precision = 2}) {
    return price.toStringAsFixed(precision);
  }
  
  // 格式化变化显示
  static String formatChange(double change, {int precision = 2}) {
    final prefix = change > 0 ? '+' : '';
    return '$prefix${change.toStringAsFixed(precision)}';
  }
  
  // 格式化百分比显示
  static String formatPercent(double percent, {int precision = 2}) {
    final prefix = percent > 0 ? '+' : '';
    return '$prefix${percent.toStringAsFixed(precision)}%';
  }
}