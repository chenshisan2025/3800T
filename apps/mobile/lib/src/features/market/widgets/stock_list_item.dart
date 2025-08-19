import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';

/// 股票列表项
class StockListItem extends ConsumerWidget {
  final StockModel stock;
  final VoidCallback? onTap;

  const StockListItem({
    super.key,
    required this.stock,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isInWatchlist = ref.watch(isInWatchlistProvider(stock.symbol));
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
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
            // 股票信息
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // 股票名称
                      Expanded(
                        child: Text(
                          stock.name,
                          style: AppTextStyles.titleSmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      
                      // 自选状态
                      if (isInWatchlist.value ?? false)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          child: Icon(
                            Icons.star,
                            color: AppColors.warning,
                            size: 16,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  
                  // 股票代码和市场
                  Row(
                    children: [
                      Text(
                        stock.symbol,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _getMarketColor(stock.market).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          stock.marketName,
                          style: AppTextStyles.caption.copyWith(
                            color: _getMarketColor(stock.market),
                          ),
                        ),
                      ),
                    ],
                  ),
                  
                  // 成交量信息
                  if (stock.volume > 0) ..[
                    const SizedBox(height: 4),
                    Text(
                      '量 ${stock.formatVolume}',
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            
            const SizedBox(width: 16),
            
            // 价格信息
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // 当前价格
                Text(
                  stock.formatPrice,
                  style: AppTextStyles.titleMedium.copyWith(
                    color: stock.changeColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                
                // 涨跌额
                Text(
                  stock.formatChange,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: stock.changeColor,
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
                    color: stock.changeColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    stock.formatChangePercent,
                    style: AppTextStyles.caption.copyWith(
                      color: stock.changeColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(width: 8),
            
            // 自选按钮
            GestureDetector(
              onTap: () => _toggleWatchlist(ref),
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: (isInWatchlist.value ?? false)
                      ? AppColors.warning.withOpacity(0.1)
                      : AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  (isInWatchlist.value ?? false)
                      ? Icons.star
                      : Icons.star_border,
                  color: (isInWatchlist.value ?? false)
                      ? AppColors.warning
                      : AppColors.textSecondary,
                  size: 18,
                ),
              ),
            ),
          ],
        ),
      ),
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

  /// 切换自选状态
  void _toggleWatchlist(WidgetRef ref) {
    final notifier = ref.read(watchlistProvider.notifier);
    final isInWatchlist = ref.read(isInWatchlistProvider(stock.symbol)).value ?? false;
    
    if (isInWatchlist) {
      notifier.removeFromWatchlist(stock.symbol);
    } else {
      notifier.addToWatchlist(stock.symbol);
    }
  }
}