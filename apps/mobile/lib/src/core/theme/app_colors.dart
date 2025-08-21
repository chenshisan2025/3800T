import 'package:flutter/material.dart';

/// 应用颜色配置
class AppColors {
  AppColors._();
  
  // 主色调 - 古灵通蓝
  static const Color primary = Color(0xFF2166A5);
  static const Color primaryVariant = Color(0xFF1A5490);
  static const Color onPrimary = Color(0xFFFFFFFF);
  
  // 次要色调
  static const Color secondary = Color(0xFF6C7B7F);
  static const Color secondaryVariant = Color(0xFF4F5B5F);
  static const Color onSecondary = Color(0xFFFFFFFF);
  
  // 股票相关颜色 (A股规则：红涨绿跌)
  static const Color stockUp = Color(0xFFFF4D4F);      // 上涨 - 红色
  static const Color stockDown = Color(0xFF52C41A);    // 下跌 - 绿色
  static const Color stockFlat = Color(0xFF8C8C8C);    // 平盘 - 灰色
  
  // 股票颜色变体
  static const Color stockUpLight = Color(0xFFFFE6E6);
  static const Color stockDownLight = Color(0xFFF0F9E8);
  static const Color stockFlatLight = Color(0xFFF5F5F5);
  
  // 功能色彩
  static const Color success = Color(0xFF52C41A);      // 成功 - 绿色
  static const Color warning = Color(0xFFFAAD14);      // 警告 - 橙色
  static const Color error = Color(0xFFFF4D4F);        // 错误 - 红色
  static const Color info = Color(0xFF1677FF);         // 信息 - 蓝色
  
  // 功能色彩变体
  static const Color successLight = Color(0xFFF0F9E8);
  static const Color warningLight = Color(0xFFFFF7E6);
  static const Color errorLight = Color(0xFFFFE6E6);
  static const Color infoLight = Color(0xFFE6F4FF);
  
  // 中性色彩
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F5F5);
  static const Color onBackground = Color(0xFF1A1A1A);
  static const Color onSurface = Color(0xFF1A1A1A);
  static const Color onSurfaceVariant = Color(0xFF666666);
  
  // 文本颜色
  static const Color textSecondary = Color(0xFF666666);
  static const Color textSecondaryDark = Color(0xFFB0B0B0);
  
  // 边框和分割线
  static const Color outline = Color(0xFFE0E0E0);
  static const Color outlineVariant = Color(0xFFF0F0F0);
  
  // 灰度色阶
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey200 = Color(0xFFEEEEEE);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey400 = Color(0xFFBDBDBD);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey600 = Color(0xFF757575);
  static const Color grey700 = Color(0xFF616161);
  static const Color grey800 = Color(0xFF424242);
  static const Color grey900 = Color(0xFF212121);
  
  // 深色主题颜色
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkSurfaceVariant = Color(0xFF2A2A2A);
  static const Color darkOnBackground = Color(0xFFE0E0E0);
  static const Color darkOnSurface = Color(0xFFE0E0E0);
  static const Color darkOnSurfaceVariant = Color(0xFFB0B0B0);
  static const Color darkOutline = Color(0xFF404040);
  
  // 透明度变体
  static Color primaryWithOpacity(double opacity) => primary.withOpacity(opacity);
  static Color stockUpWithOpacity(double opacity) => stockUp.withOpacity(opacity);
  static Color stockDownWithOpacity(double opacity) => stockDown.withOpacity(opacity);
  static Color blackWithOpacity(double opacity) => Colors.black.withOpacity(opacity);
  static Color whiteWithOpacity(double opacity) => Colors.white.withOpacity(opacity);
  
  // 渐变色
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryVariant],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient stockUpGradient = LinearGradient(
    colors: [stockUp, Color(0xFFE53E3E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient stockDownGradient = LinearGradient(
    colors: [stockDown, Color(0xFF38A169)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // 阴影色
  static const Color shadowLight = Color(0x1A000000);
  static const Color shadowMedium = Color(0x33000000);
  static const Color shadowDark = Color(0x4D000000);
  
  // 图表颜色
  static const List<Color> chartColors = [
    Color(0xFF2166A5), // 主色
    Color(0xFF52C41A), // 绿色
    Color(0xFFFF4D4F), // 红色
    Color(0xFFFAAD14), // 橙色
    Color(0xFF1677FF), // 蓝色
    Color(0xFF722ED1), // 紫色
    Color(0xFF13C2C2), // 青色
    Color(0xFFA0D911), // 青绿色
  ];
  
  // K线图颜色
  static const Color candleUpColor = stockUp;     // K线上涨
  static const Color candleDownColor = stockDown; // K线下跌
  static const Color candleUpBorder = Color(0xFFCC3333);
  static const Color candleDownBorder = Color(0xFF339933);
  
  // 分时图颜色
  static const Color timelineColor = primary;
  static const Color timelineFillColor = Color(0x332166A5);
  static const Color timelineGridColor = Color(0xFFE8E8E8);
  
  // 状态颜色
  static const Color online = Color(0xFF52C41A);   // 在线
  static const Color offline = Color(0xFF8C8C8C);  // 离线
  static const Color busy = Color(0xFFFAAD14);     // 忙碌
  static const Color away = Color(0xFFFF4D4F);     // 离开
  
  // 特殊用途颜色
  static const Color highlight = Color(0xFFFFF3CD); // 高亮背景
  static const Color selection = Color(0xFFE6F4FF); // 选中背景
  static const Color hover = Color(0xFFF5F5F5);     // 悬停背景
  static const Color disabled = Color(0xFFBDBDBD);  // 禁用状态
  
  // 获取股票涨跌颜色
  static Color getStockColor(double change) {
    if (change > 0) return stockUp;
    if (change < 0) return stockDown;
    return stockFlat;
  }
  
  // 获取股票涨跌背景色
  static Color getStockBackgroundColor(double change) {
    if (change > 0) return stockUpLight;
    if (change < 0) return stockDownLight;
    return stockFlatLight;
  }
  
  // 获取风险等级颜色
  static Color getRiskColor(int level) {
    switch (level) {
      case 1:
        return success; // 低风险
      case 2:
        return info; // 中低风险
      case 3:
        return warning; // 中风险
      case 4:
        return Color(0xFFFF7A45); // 中高风险
      case 5:
        return error; // 高风险
      default:
        return grey500;
    }
  }
  
  // 获取评级颜色
  static Color getRatingColor(String rating) {
    switch (rating.toUpperCase()) {
      case 'AAA':
      case 'AA+':
      case 'AA':
        return success;
      case 'AA-':
      case 'A+':
      case 'A':
        return info;
      case 'A-':
      case 'BBB+':
      case 'BBB':
        return warning;
      case 'BBB-':
      case 'BB+':
      case 'BB':
        return Color(0xFFFF7A45);
      default:
        return error;
    }
  }
}