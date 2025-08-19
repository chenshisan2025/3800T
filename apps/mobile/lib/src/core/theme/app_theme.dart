import 'package:flutter/material.dart';
import '../../shared/widgets/custom_card.dart';

class AppTheme {
  // 股票应用专用颜色
  static const Color riseColor = Color(0xFFFF4444); // 红涨
  static const Color fallColor = Color(0xFF00AA44); // 绿跌
  static const Color primaryColor = Color(0xFF1976D2);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  
  static ThemeData get lightTheme {
    const primaryColor = Color(0xFF1976D2);
    const secondaryColor = Color(0xFF03DAC6);
    const backgroundColor = Color(0xFFF5F5F5);
    const surfaceColor = Color(0xFFFFFFFF);
    const errorColor = Color(0xFFB00020);

    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: surfaceColor,
        error: errorColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: Colors.grey[600],
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: const CardThemeData(
        color: surfaceColor,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      extensions: const [
        StockColors.chinese,
      ],
    );
  }
  
  static ThemeData get darkTheme {
    const primaryColor = Color(0xFF90CAF9);
    const secondaryColor = Color(0xFF03DAC6);
    const backgroundColor = Color(0xFF121212);
    const surfaceColor = Color(0xFF1E1E1E);
    const errorColor = Color(0xFFCF6679);

    return ThemeData(
      useMaterial3: true,
      primaryColor: primaryColor,
      scaffoldBackgroundColor: backgroundColor,
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: secondaryColor,
        surface: surfaceColor,
        error: errorColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceColor,
        selectedItemColor: primaryColor,
        unselectedItemColor: Colors.grey[400],
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: const CardThemeData(
        color: Color(0xFF2D2D2D),
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      extensions: const [
        StockColors.chinese,
      ],
    );
  }
}