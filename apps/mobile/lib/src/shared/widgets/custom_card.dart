import 'package:flutter/material.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final double? elevation;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final bool hasShadow;

  const CustomCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.elevation,
    this.borderRadius,
    this.onTap,
    this.hasShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    Widget cardContent = Container(
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor ?? theme.cardColor,
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        boxShadow: hasShadow
            ? [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
        border: Border.all(
          color: theme.dividerColor.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: child,
    );

    if (onTap != null) {
      cardContent = InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(12),
        child: cardContent,
      );
    }

    return Container(
      margin: margin ?? const EdgeInsets.symmetric(vertical: 4),
      child: cardContent,
    );
  }
}

// 股票信息卡片
class StockInfoCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final bool isRise;
  final VoidCallback? onTap;
  final Widget? icon;

  const StockInfoCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    this.isRise = true,
    this.onTap,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final riseColor = theme.extension<StockColors>()?.riseColor ?? Colors.red;
    final fallColor = theme.extension<StockColors>()?.fallColor ?? Colors.green;
    
    return CustomCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                icon!,
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: isRise ? riseColor : fallColor,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// 股票颜色主题扩展
class StockColors extends ThemeExtension<StockColors> {
  final Color riseColor;
  final Color fallColor;
  final Color neutralColor;

  const StockColors({
    required this.riseColor,
    required this.fallColor,
    required this.neutralColor,
  });

  @override
  StockColors copyWith({
    Color? riseColor,
    Color? fallColor,
    Color? neutralColor,
  }) {
    return StockColors(
      riseColor: riseColor ?? this.riseColor,
      fallColor: fallColor ?? this.fallColor,
      neutralColor: neutralColor ?? this.neutralColor,
    );
  }

  @override
  StockColors lerp(ThemeExtension<StockColors>? other, double t) {
    if (other is! StockColors) {
      return this;
    }
    return StockColors(
      riseColor: Color.lerp(riseColor, other.riseColor, t)!,
      fallColor: Color.lerp(fallColor, other.fallColor, t)!,
      neutralColor: Color.lerp(neutralColor, other.neutralColor, t)!,
    );
  }

  // 中国股市颜色（红涨绿跌）
  static const StockColors chinese = StockColors(
    riseColor: Color(0xFFE53E3E), // 红色
    fallColor: Color(0xFF38A169), // 绿色
    neutralColor: Color(0xFF718096), // 灰色
  );
}