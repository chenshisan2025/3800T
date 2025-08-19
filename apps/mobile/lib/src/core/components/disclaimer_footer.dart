import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 免责声明页脚组件
class DisclaimerFooter extends StatelessWidget {
  const DisclaimerFooter({
    super.key,
    this.padding,
    this.backgroundColor,
    this.textColor,
    this.showIcon = true,
    this.isCompact = false,
  });

  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final Color? textColor;
  final bool showIcon;
  final bool isCompact; // 紧凑模式，用于较小的空间

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Container(
      width: double.infinity,
      padding: padding ?? EdgeInsets.all(isCompact ? 12 : 16),
      decoration: BoxDecoration(
        color: backgroundColor ?? (isDark ? const Color(0xFF2D3748) : Colors.grey.shade50),
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF4A5568) : AppTheme.borderColor,
            width: 0.5,
          ),
        ),
      ),
      child: isCompact ? _buildCompactContent(theme, isDark) : _buildFullContent(theme, isDark),
    );
  }

  Widget _buildFullContent(ThemeData theme, bool isDark) {
    return Column(
      children: [
        if (showIcon) ..[
          Icon(
            Icons.info_outline,
            size: 20,
            color: textColor ?? AppTheme.textSecondaryColor,
          ),
          const SizedBox(height: 8),
        ],
        Text(
          '免责声明',
          style: theme.textTheme.titleSmall?.copyWith(
            color: textColor ?? AppTheme.textPrimaryColor,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '本应用提供的所有信息仅供参考，不构成投资建议。\n投资有风险，入市需谨慎。请根据自身风险承受能力谨慎投资。',
          textAlign: TextAlign.center,
          style: theme.textTheme.bodySmall?.copyWith(
            color: textColor ?? AppTheme.textSecondaryColor,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildCompactContent(ThemeData theme, bool isDark) {
    return Row(
      children: [
        if (showIcon) ..[
          Icon(
            Icons.info_outline,
            size: 16,
            color: textColor ?? AppTheme.textSecondaryColor,
          ),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            '本应用信息仅供参考，不构成投资建议，投资有风险',
            style: theme.textTheme.bodySmall?.copyWith(
              color: textColor ?? AppTheme.textSecondaryColor,
              fontSize: 11,
            ),
          ),
        ),
      ],
    );
  }
}

/// 股票详情页免责声明组件
class StockDisclaimerFooter extends StatelessWidget {
  const StockDisclaimerFooter({
    super.key,
    this.symbol,
    this.padding,
  });

  final String? symbol;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.warning_amber_outlined,
                size: 18,
                color: AppTheme.warningColor,
              ),
              const SizedBox(width: 8),
              Text(
                '风险提示',
                style: theme.textTheme.titleSmall?.copyWith(
                  color: AppTheme.warningColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            symbol != null 
                ? '关于 $symbol 的所有信息、分析和预测仅供参考，不构成买卖建议。股市有风险，投资需谨慎。'
                : '所有股票信息、技术分析和AI预测仅供参考，不构成投资建议。请根据自身情况谨慎决策。',
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppTheme.textSecondaryColor,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

/// AI分析免责声明组件
class AIAnalysisDisclaimer extends StatelessWidget {
  const AIAnalysisDisclaimer({
    super.key,
    this.padding,
    this.isInline = false,
  });

  final EdgeInsetsGeometry? padding;
  final bool isInline; // 是否内联显示

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    if (isInline) {
      return Padding(
        padding: padding ?? const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(
              Icons.smart_toy_outlined,
              size: 14,
              color: AppTheme.textSecondaryColor,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                'AI分析仅供参考，不构成投资建议',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppTheme.textSecondaryColor,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      );
    }
    
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark 
            ? Colors.orange.shade900.withOpacity(0.1)
            : Colors.orange.shade50,
        border: Border.all(
          color: Colors.orange.shade300,
          width: 0.5,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            Icons.smart_toy_outlined,
            size: 18,
            color: Colors.orange.shade600,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI分析说明',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: Colors.orange.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'AI分析基于历史数据和算法模型，结果仅供参考，不保证准确性。请结合多方信息独立判断。',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.orange.shade700,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 数据来源免责声明组件
class DataSourceDisclaimer extends StatelessWidget {
  const DataSourceDisclaimer({
    super.key,
    this.sources = const ['实时行情', '财务数据', '新闻资讯'],
    this.padding,
  });

  final List<String> sources;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.source_outlined,
                size: 16,
                color: AppTheme.textSecondaryColor,
              ),
              const SizedBox(width: 6),
              Text(
                '数据来源',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppTheme.textSecondaryColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: sources.map((source) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.textSecondaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                source,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppTheme.textSecondaryColor,
                  fontSize: 10,
                ),
              ),
            )).toList(),
          ),
          const SizedBox(height: 6),
          Text(
            '数据可能存在延迟，请以官方披露信息为准',
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppTheme.textSecondaryColor,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}