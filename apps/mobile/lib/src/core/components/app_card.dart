import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 卡片类型枚举
enum AppCardType {
  normal,
  elevated,
  outlined,
  filled,
}

/// 应用通用卡片组件
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.type = AppCardType.normal,
    this.padding,
    this.margin,
    this.onTap,
    this.backgroundColor,
    this.borderRadius,
    this.elevation,
    this.border,
    this.width,
    this.height,
  });

  final Widget child;
  final AppCardType type;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final double? elevation;
  final Border? border;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    Widget card = Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: _getBackgroundColor(isDark),
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        border: _getBorder(isDark),
        boxShadow: _getBoxShadow(isDark),
      ),
      child: ClipRRect(
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      card = Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(12),
          child: card,
        ),
      );
    }

    return card;
  }

  Color _getBackgroundColor(bool isDark) {
    if (backgroundColor != null) return backgroundColor!;
    
    switch (type) {
      case AppCardType.normal:
        return isDark ? const Color(0xFF2D3748) : Colors.white;
      case AppCardType.elevated:
        return isDark ? const Color(0xFF2D3748) : Colors.white;
      case AppCardType.outlined:
        return isDark ? const Color(0xFF1A202C) : Colors.white;
      case AppCardType.filled:
        return isDark ? const Color(0xFF4A5568) : Colors.grey.shade50;
    }
  }

  Border? _getBorder(bool isDark) {
    if (border != null) return border;
    
    switch (type) {
      case AppCardType.outlined:
        return Border.all(
          color: isDark ? const Color(0xFF4A5568) : AppTheme.borderColor,
          width: 1,
        );
      default:
        return null;
    }
  }

  List<BoxShadow>? _getBoxShadow(bool isDark) {
    if (type == AppCardType.outlined) return null;
    
    final shadowElevation = elevation ?? (type == AppCardType.elevated ? 4 : 2);
    
    return [
      BoxShadow(
        color: isDark 
            ? Colors.black.withOpacity(0.3)
            : Colors.black.withOpacity(0.05),
        blurRadius: shadowElevation * 2,
        offset: Offset(0, shadowElevation / 2),
      ),
    ];
  }
}

/// 股票信息卡片组件
class StockInfoCard extends StatelessWidget {
  const StockInfoCard({
    super.key,
    required this.title,
    required this.child,
    this.onTap,
    this.padding,
    this.margin,
    this.trailing,
  });

  final String title;
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AppCard(
      onTap: onTap,
      padding: padding ?? const EdgeInsets.all(16),
      margin: margin,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

/// 价格变化卡片组件
class PriceChangeCard extends StatelessWidget {
  const PriceChangeCard({
    super.key,
    required this.price,
    required this.change,
    required this.changePercent,
    this.symbol,
    this.onTap,
    this.padding,
    this.margin,
  });

  final double price;
  final double change;
  final double changePercent;
  final String? symbol;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final priceColor = AppTheme.getPriceTextColor(change, isDark: isDark);
    
    return AppCard(
      onTap: onTap,
      padding: padding ?? const EdgeInsets.all(16),
      margin: margin,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (symbol != null) ..[
            Text(
              symbol!,
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 4),
          ],
          Row(
            children: [
              Expanded(
                child: Text(
                  '¥${price.toStringAsFixed(2)}',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: priceColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${change >= 0 ? '+' : ''}${change.toStringAsFixed(2)}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: priceColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${changePercent >= 0 ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: priceColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// 统计数据卡片组件
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    this.icon,
    this.color,
    this.onTap,
    this.padding,
    this.margin,
  });

  final String title;
  final String value;
  final String? subtitle;
  final IconData? icon;
  final Color? color;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AppCard(
      onTap: onTap,
      padding: padding ?? const EdgeInsets.all(16),
      margin: margin,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ..[
                Icon(
                  icon,
                  size: 20,
                  color: color ?? theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (subtitle != null) ..[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: theme.textTheme.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

/// 列表项卡片组件
class ListItemCard extends StatelessWidget {
  const ListItemCard({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.onTap,
    this.padding,
    this.margin,
  });

  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AppCard(
      onTap: onTap,
      padding: padding ?? const EdgeInsets.all(16),
      margin: margin,
      child: Row(
        children: [
          if (leading != null) ..[
            leading!,
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium,
                ),
                if (subtitle != null) ..[
                  const SizedBox(height: 4),
                  Text(
                    subtitle!,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) ..[
            const SizedBox(width: 12),
            trailing!,
          ],
        ],
      ),
    );
  }
}