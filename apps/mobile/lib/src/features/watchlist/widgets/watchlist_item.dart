import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';

/// 自选列表项组件
class WatchlistItemWidget extends ConsumerWidget {
  final WatchlistItem item;
  final bool isEditMode;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onToggleSelection;

  const WatchlistItemWidget({
    super.key,
    required this.item,
    this.isEditMode = false,
    this.isSelected = false,
    this.onTap,
    this.onToggleSelection,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockQuote = ref.watch(stockQuoteProvider(item.symbol));
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: isSelected
              ? Border.all(color: AppColors.primary, width: 1)
              : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // 选择框（编辑模式）
            if (isEditMode) ..[
              GestureDetector(
                onTap: onToggleSelection,
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.outline,
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: isSelected
                      ? const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 16,
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 12),
            ],
            
            // 拖拽手柄（编辑模式）
            if (isEditMode) ..[
              Icon(
                Icons.drag_handle,
                color: AppColors.textSecondary,
                size: 20,
              ),
              const SizedBox(width: 12),
            ],
            
            // 股票信息
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 股票名称和代码
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          style: AppTextStyles.titleSmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        item.symbol,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  
                  // 市场标签
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: _getMarketColor(item.market).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _getMarketName(item.market),
                      style: AppTextStyles.caption.copyWith(
                        color: _getMarketColor(item.market),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(width: 16),
            
            // 价格信息
            stockQuote.when(
              data: (quote) => _buildPriceInfo(quote),
              loading: () => _buildPriceLoading(),
              error: (_, __) => _buildPriceError(),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建价格信息
  Widget _buildPriceInfo(StockQuote quote) {
    final changePercent = quote.changePercent;
    final color = changePercent > 0
        ? AppColors.error
        : (changePercent < 0 ? AppColors.success : AppColors.textSecondary);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // 当前价格
        Text(
          quote.price.toStringAsFixed(2),
          style: AppTextStyles.titleMedium.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 4),
        
        // 涨跌额
        Text(
          '${quote.change > 0 ? '+' : ''}${quote.change.toStringAsFixed(2)}',
          style: AppTextStyles.bodySmall.copyWith(
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        
        // 涨跌幅
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 6,
            vertical: 2,
          ),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            '${changePercent > 0 ? '+' : ''}${changePercent.toStringAsFixed(2)}%',
            style: AppTextStyles.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
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

  /// 获取市场颜色
  Color _getMarketColor(MarketType market) {
    switch (market) {
      case MarketType.sh:
        return AppColors.primary;
      case MarketType.sz:
        return AppColors.success;
      case MarketType.gem:
        return AppColors.warning;
      case MarketType.star:
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  /// 获取市场名称
  String _getMarketName(MarketType market) {
    switch (market) {
      case MarketType.sh:
        return '沪市';
      case MarketType.sz:
        return '深市';
      case MarketType.gem:
        return '创业板';
      case MarketType.star:
        return '科创板';
      default:
        return '未知';
    }
  }
}