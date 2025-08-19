import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 标签类型枚举
enum AppTagType {
  primary,
  secondary,
  success,
  warning,
  error,
  info,
  rise, // 涨
  fall, // 跌
}

/// 标签尺寸枚举
enum AppTagSize {
  small,
  medium,
  large,
}

/// 应用通用标签组件
class AppTag extends StatelessWidget {
  const AppTag({
    super.key,
    required this.text,
    this.type = AppTagType.primary,
    this.size = AppTagSize.medium,
    this.icon,
    this.onTap,
    this.backgroundColor,
    this.textColor,
    this.borderColor,
    this.isOutlined = false,
  });

  final String text;
  final AppTagType type;
  final AppTagSize size;
  final IconData? icon;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Color? textColor;
  final Color? borderColor;
  final bool isOutlined;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    Widget tag = Container(
      padding: _getPadding(),
      decoration: BoxDecoration(
        color: _getBackgroundColor(isDark),
        border: _getBorder(isDark),
        borderRadius: BorderRadius.circular(_getBorderRadius()),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ..[
            Icon(
              icon,
              size: _getIconSize(),
              color: _getTextColor(isDark),
            ),
            SizedBox(width: _getIconSpacing()),
          ],
          Text(
            text,
            style: _getTextStyle(isDark),
          ),
        ],
      ),
    );

    if (onTap != null) {
      tag = GestureDetector(
        onTap: onTap,
        child: tag,
      );
    }

    return tag;
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case AppTagSize.small:
        return const EdgeInsets.symmetric(horizontal: 6, vertical: 2);
      case AppTagSize.medium:
        return const EdgeInsets.symmetric(horizontal: 8, vertical: 4);
      case AppTagSize.large:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
    }
  }

  double _getBorderRadius() {
    switch (size) {
      case AppTagSize.small:
        return 4;
      case AppTagSize.medium:
        return 6;
      case AppTagSize.large:
        return 8;
    }
  }

  double _getIconSize() {
    switch (size) {
      case AppTagSize.small:
        return 12;
      case AppTagSize.medium:
        return 14;
      case AppTagSize.large:
        return 16;
    }
  }

  double _getIconSpacing() {
    switch (size) {
      case AppTagSize.small:
        return 4;
      case AppTagSize.medium:
        return 4;
      case AppTagSize.large:
        return 6;
    }
  }

  TextStyle _getTextStyle(bool isDark) {
    final fontSize = switch (size) {
      AppTagSize.small => 10.0,
      AppTagSize.medium => 12.0,
      AppTagSize.large => 14.0,
    };

    return TextStyle(
      fontSize: fontSize,
      fontWeight: FontWeight.w600,
      color: _getTextColor(isDark),
    );
  }

  Color _getBackgroundColor(bool isDark) {
    if (backgroundColor != null) return backgroundColor!;
    
    if (isOutlined) {
      return Colors.transparent;
    }

    switch (type) {
      case AppTagType.primary:
        return AppTheme.primaryColor.withOpacity(0.1);
      case AppTagType.secondary:
        return isDark ? Colors.grey.shade700 : Colors.grey.shade200;
      case AppTagType.success:
        return AppTheme.successColor.withOpacity(0.1);
      case AppTagType.warning:
        return AppTheme.warningColor.withOpacity(0.1);
      case AppTagType.error:
        return AppTheme.errorColor.withOpacity(0.1);
      case AppTagType.info:
        return Colors.blue.withOpacity(0.1);
      case AppTagType.rise:
        return AppTheme.riseColor.withOpacity(0.1);
      case AppTagType.fall:
        return AppTheme.fallColor.withOpacity(0.1);
    }
  }

  Color _getTextColor(bool isDark) {
    if (textColor != null) return textColor!;

    switch (type) {
      case AppTagType.primary:
        return AppTheme.primaryColor;
      case AppTagType.secondary:
        return isDark ? Colors.grey.shade300 : Colors.grey.shade700;
      case AppTagType.success:
        return AppTheme.successColor;
      case AppTagType.warning:
        return AppTheme.warningColor;
      case AppTagType.error:
        return AppTheme.errorColor;
      case AppTagType.info:
        return Colors.blue;
      case AppTagType.rise:
        return AppTheme.riseColor;
      case AppTagType.fall:
        return AppTheme.fallColor;
    }
  }

  Border? _getBorder(bool isDark) {
    if (borderColor != null) {
      return Border.all(color: borderColor!);
    }
    
    if (isOutlined) {
      return Border.all(color: _getTextColor(isDark));
    }
    
    return null;
  }
}

/// 股票状态标签组件
class StockStatusTag extends StatelessWidget {
  const StockStatusTag({
    super.key,
    required this.change,
    this.size = AppTagSize.medium,
    this.showIcon = true,
    this.isOutlined = false,
  });

  final double change;
  final AppTagSize size;
  final bool showIcon;
  final bool isOutlined;

  @override
  Widget build(BuildContext context) {
    final isRise = change > 0;
    final isFall = change < 0;
    final isFlat = change == 0;
    
    if (isFlat) {
      return AppTag(
        text: '0.00%',
        type: AppTagType.secondary,
        size: size,
        icon: showIcon ? Icons.remove : null,
        isOutlined: isOutlined,
      );
    }
    
    return AppTag(
      text: '${change >= 0 ? '+' : ''}${change.toStringAsFixed(2)}%',
      type: isRise ? AppTagType.rise : AppTagType.fall,
      size: size,
      icon: showIcon ? (isRise ? Icons.trending_up : Icons.trending_down) : null,
      isOutlined: isOutlined,
    );
  }
}

/// 价格变化标签组件
class PriceChangeTag extends StatelessWidget {
  const PriceChangeTag({
    super.key,
    required this.price,
    required this.change,
    this.size = AppTagSize.medium,
    this.showIcon = true,
    this.isOutlined = false,
  });

  final double price;
  final double change;
  final AppTagSize size;
  final bool showIcon;
  final bool isOutlined;

  @override
  Widget build(BuildContext context) {
    final isRise = change > 0;
    final isFall = change < 0;
    final isFlat = change == 0;
    
    if (isFlat) {
      return AppTag(
        text: '¥${price.toStringAsFixed(2)}',
        type: AppTagType.secondary,
        size: size,
        icon: showIcon ? Icons.remove : null,
        isOutlined: isOutlined,
      );
    }
    
    return AppTag(
      text: '¥${price.toStringAsFixed(2)}',
      type: isRise ? AppTagType.rise : AppTagType.fall,
      size: size,
      icon: showIcon ? (isRise ? Icons.trending_up : Icons.trending_down) : null,
      isOutlined: isOutlined,
    );
  }
}

/// 技术指标标签组件
class TechnicalIndicatorTag extends StatelessWidget {
  const TechnicalIndicatorTag({
    super.key,
    required this.name,
    required this.value,
    required this.signal, // 'buy', 'sell', 'hold'
    this.size = AppTagSize.medium,
    this.isOutlined = false,
  });

  final String name;
  final String value;
  final String signal;
  final AppTagSize size;
  final bool isOutlined;

  @override
  Widget build(BuildContext context) {
    final type = switch (signal.toLowerCase()) {
      'buy' => AppTagType.rise,
      'sell' => AppTagType.fall,
      _ => AppTagType.secondary,
    };
    
    final icon = switch (signal.toLowerCase()) {
      'buy' => Icons.trending_up,
      'sell' => Icons.trending_down,
      _ => Icons.remove,
    };
    
    return AppTag(
      text: '$name: $value',
      type: type,
      size: size,
      icon: icon,
      isOutlined: isOutlined,
    );
  }
}

/// 市场状态标签组件
class MarketStatusTag extends StatelessWidget {
  const MarketStatusTag({
    super.key,
    required this.status, // 'open', 'closed', 'pre_market', 'after_hours'
    this.size = AppTagSize.medium,
    this.isOutlined = false,
  });

  final String status;
  final AppTagSize size;
  final bool isOutlined;

  @override
  Widget build(BuildContext context) {
    final (text, type, icon) = switch (status.toLowerCase()) {
      'open' => ('开盘中', AppTagType.success, Icons.radio_button_checked),
      'closed' => ('已收盘', AppTagType.secondary, Icons.radio_button_unchecked),
      'pre_market' => ('盘前交易', AppTagType.info, Icons.schedule),
      'after_hours' => ('盘后交易', AppTagType.warning, Icons.schedule),
      _ => ('未知', AppTagType.secondary, Icons.help_outline),
    };
    
    return AppTag(
      text: text,
      type: type,
      size: size,
      icon: icon,
      isOutlined: isOutlined,
    );
  }
}

/// 新闻情感标签组件
class SentimentTag extends StatelessWidget {
  const SentimentTag({
    super.key,
    required this.sentiment, // 'positive', 'negative', 'neutral'
    this.size = AppTagSize.small,
    this.isOutlined = false,
  });

  final String sentiment;
  final AppTagSize size;
  final bool isOutlined;

  @override
  Widget build(BuildContext context) {
    final (text, type, icon) = switch (sentiment.toLowerCase()) {
      'positive' => ('利好', AppTagType.rise, Icons.thumb_up),
      'negative' => ('利空', AppTagType.fall, Icons.thumb_down),
      _ => ('中性', AppTagType.secondary, Icons.remove),
    };
    
    return AppTag(
      text: text,
      type: type,
      size: size,
      icon: icon,
      isOutlined: isOutlined,
    );
  }
}