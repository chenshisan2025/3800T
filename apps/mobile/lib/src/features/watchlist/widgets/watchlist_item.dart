import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/watchlist_model.dart';
import '../providers/watchlist_provider.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class WatchlistItemWidget extends ConsumerWidget {
  final WatchlistItem item;
  final bool isEditMode;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const WatchlistItemWidget({
    super.key,
    required this.item,
    this.isEditMode = false,
    this.isSelected = false,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 获取股票报价
    final quoteAsync = ref.watch(stockQuoteProvider(item.symbol));
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // 编辑模式下的选择框
              if (isEditMode) ...[
                Checkbox(
                  value: isSelected,
                  onChanged: (_) => onTap?.call(),
                ),
                const SizedBox(width: 8),
              ],
              
              // 股票信息
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            item.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _getMarketColor(item.market),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _getMarketName(item.market),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.symbol,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              
              // 价格信息
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _buildPriceInfo(context, quoteAsync),
                ],
              ),
              
              // 编辑模式下的拖拽手柄
              if (isEditMode) ...[
                const SizedBox(width: 8),
                const Icon(
                  Icons.drag_handle,
                  color: Colors.grey,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceInfo(BuildContext context, AsyncValue<StockQuote> quoteAsync) {
    return quoteAsync.when(
      data: (quote) {
        final isPositive = quote.change >= 0;
        final color = isPositive ? Colors.red : Colors.green;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '¥${quote.price.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '${isPositive ? '+' : ''}${quote.change.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: color,
              ),
            ),
            Text(
              '${isPositive ? '+' : ''}${quote.changePercent.toStringAsFixed(2)}%',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: color,
              ),
            ),
          ],
        );
      },
      loading: () => Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 60,
            height: 16,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 40,
            height: 12,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 2),
          Container(
            width: 50,
            height: 12,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
      error: (error, stack) => Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '--',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            AppStrings.loadFailed,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  /// 构建价格加载状态
  Widget _buildPriceLoading() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(
          width: 60,
          height: 16,
          decoration: BoxDecoration(
            color: AppColors.outline.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 50,
          height: 12,
          decoration: BoxDecoration(
            color: AppColors.outline.withOpacity(0.3),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(height: 2),
        Container(
          width: 40,
          height: 12,
          decoration: BoxDecoration(
            color: AppColors.outline.withOpacity(0.3),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      ],
    );
  }

  /// 构建价格错误状态
  Widget _buildPriceError() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          '--',
          style: AppTextStyles.titleMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '--',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          '--',
          style: AppTextStyles.caption.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Color _getMarketColor(MarketType market) {
    switch (market) {
      case MarketType.sh:
        return Colors.orange;
      case MarketType.sz:
        return Colors.purple;
      case MarketType.gem:
        return Colors.green;
      case MarketType.star:
        return Colors.blue;
    }
  }

  String _getMarketName(MarketType market) {
    switch (market) {
      case MarketType.sh:
        return '沪股';
      case MarketType.sz:
        return '深股';
      case MarketType.gem:
        return '创业板';
      case MarketType.star:
        return '科创板';
    }
  }
}