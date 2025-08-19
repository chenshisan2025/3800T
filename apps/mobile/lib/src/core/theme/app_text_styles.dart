import 'package:flutter/material.dart';
import 'app_colors.dart';

/// 应用文本样式配置
class AppTextStyles {
  AppTextStyles._();
  
  // 基础字体配置
  static const String _fontFamily = 'PingFang';
  static const String _fallbackFontFamily = 'Roboto';
  
  // Display 样式 - 用于大标题
  static const TextStyle displayLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 57,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.25,
    height: 1.12,
    color: AppColors.onSurface,
  );
  
  static const TextStyle displayMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 45,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.16,
    color: AppColors.onSurface,
  );
  
  static const TextStyle displaySmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 36,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.22,
    color: AppColors.onSurface,
  );
  
  // Headline 样式 - 用于页面标题
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 32,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.25,
    color: AppColors.onSurface,
  );
  
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 28,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.29,
    color: AppColors.onSurface,
  );
  
  static const TextStyle headlineSmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.33,
    color: AppColors.onSurface,
  );
  
  // Title 样式 - 用于组件标题
  static const TextStyle titleLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 22,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.27,
    color: AppColors.onSurface,
  );
  
  static const TextStyle titleMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.15,
    height: 1.50,
    color: AppColors.onSurface,
  );
  
  static const TextStyle titleSmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.43,
    color: AppColors.onSurface,
  );
  
  // Body 样式 - 用于正文内容
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.5,
    height: 1.50,
    color: AppColors.onSurface,
  );
  
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    height: 1.43,
    color: AppColors.onSurface,
  );
  
  static const TextStyle bodySmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.33,
    color: AppColors.onSurfaceVariant,
  );
  
  // Label 样式 - 用于标签和按钮
  static const TextStyle labelLarge = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.43,
    color: AppColors.onSurface,
  );
  
  static const TextStyle labelMedium = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.33,
    color: AppColors.onSurface,
  );
  
  static const TextStyle labelSmall = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.45,
    color: AppColors.onSurface,
  );
  
  // 股票相关样式
  static const TextStyle stockPrice = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.2,
  );
  
  static const TextStyle stockChange = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    height: 1.2,
  );
  
  static const TextStyle stockSymbol = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    height: 1.25,
    color: AppColors.onSurface,
  );
  
  static const TextStyle stockName = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.25,
    color: AppColors.onSurfaceVariant,
  );
  
  // 数字样式
  static const TextStyle numberLarge = TextStyle(
    fontFamily: _fallbackFontFamily, // 使用 Roboto 确保数字显示一致
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.2,
    color: AppColors.onSurface,
  );
  
  static const TextStyle numberMedium = TextStyle(
    fontFamily: _fallbackFontFamily,
    fontSize: 18,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.2,
    color: AppColors.onSurface,
  );
  
  static const TextStyle numberSmall = TextStyle(
    fontFamily: _fallbackFontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0,
    height: 1.2,
    color: AppColors.onSurface,
  );
  
  // 特殊用途样式
  static const TextStyle caption = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.33,
    color: AppColors.onSurfaceVariant,
  );
  
  static const TextStyle overline = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.5,
    height: 1.6,
    color: AppColors.onSurfaceVariant,
  );
  
  static const TextStyle button = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.25,
    height: 1.43,
  );
  
  // 错误样式
  static const TextStyle error = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.33,
    color: AppColors.error,
  );
  
  // 链接样式
  static const TextStyle link = TextStyle(
    fontFamily: _fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    height: 1.43,
    color: AppColors.primary,
    decoration: TextDecoration.underline,
  );
  
  // 获取股票价格样式（带颜色）
  static TextStyle getStockPriceStyle(double change) {
    return stockPrice.copyWith(
      color: AppColors.getStockColor(change),
    );
  }
  
  // 获取股票变化样式（带颜色）
  static TextStyle getStockChangeStyle(double change) {
    return stockChange.copyWith(
      color: AppColors.getStockColor(change),
    );
  }
  
  // 获取数字样式（带颜色）
  static TextStyle getNumberStyle({
    required double fontSize,
    required double value,
    FontWeight? fontWeight,
  }) {
    return TextStyle(
      fontFamily: _fallbackFontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight ?? FontWeight.w500,
      letterSpacing: 0,
      height: 1.2,
      color: AppColors.getStockColor(value),
    );
  }
  
  // 获取状态样式
  static TextStyle getStatusStyle(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
      case 'success':
        color = AppColors.success;
        break;
      case 'warning':
      case 'pending':
        color = AppColors.warning;
        break;
      case 'error':
      case 'failed':
      case 'offline':
        color = AppColors.error;
        break;
      case 'info':
      case 'processing':
        color = AppColors.info;
        break;
      default:
        color = AppColors.onSurfaceVariant;
    }
    
    return labelSmall.copyWith(color: color);
  }
  
  // 获取强调样式
  static TextStyle getEmphasisStyle(TextStyle baseStyle, {bool isEmphasized = true}) {
    if (!isEmphasized) return baseStyle;
    
    return baseStyle.copyWith(
      fontWeight: FontWeight.w600,
      color: AppColors.primary,
    );
  }
  
  // 获取禁用样式
  static TextStyle getDisabledStyle(TextStyle baseStyle) {
    return baseStyle.copyWith(
      color: AppColors.disabled,
    );
  }
}