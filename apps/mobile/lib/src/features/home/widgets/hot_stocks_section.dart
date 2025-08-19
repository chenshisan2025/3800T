import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';

/// 热门股票区域
class HotStocksSection extends ConsumerWidget {
  const HotStocksSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hotStocks = ref.watch(hotStocksProvider);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题栏
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 4,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '热门股票',
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    context.push(AppRoutes.hotStocks);
                  },
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '更多',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_forward_ios,
                        color: AppColors.textSecondary,
                        size: 12,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // 股票列表
          hotStocks.when(
            data: (stocks) => _buildStockList(context, stocks),
            loading: () => _buildLoading(),
            error: (error, stack) => _buildError(context, error),
          ),
        ],
      ),
    );
  }

  /// 构建股票列表
  Widget _buildStockList(BuildContext context, List<StockModel> stocks) {
    if (stocks.isEmpty) {
      return _buildEmpty();
    }

    return Column(
      children: [
        // 横向滚动的股票卡片
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: stocks.length,
            itemBuilder: (context, index) {
              final stock = stocks[index];
              return Container(
                width: 140,
                margin: EdgeInsets.only(
                  right: index < stocks.length - 1 ? 12 : 0,
                ),
                child: _buildStockCard(context, stock),
              );
            },
          ),
        ),
        
        const SizedBox(height: 16),
      ],
    );
  }

  /// 构建股票卡片
  Widget _buildStockCard(BuildContext context, StockModel stock) {
    final isUp = stock.changePercent >= 0;
    final changeColor = isUp ? AppColors.stockUp : AppColors.stockDown;
    
    return GestureDetector(
      onTap: () {
        context.push('${AppRoutes.stockDetail}/${stock.symbol}');
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: AppColors.outline.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 股票代码和名称
            Text(
              stock.symbol,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              stock.name,
              style: AppTextStyles.titleSmall.copyWith(
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            
            const Spacer(),
            
            // 价格
            Text(
              '¥${stock.price.toStringAsFixed(2)}',
              style: AppTextStyles.titleMedium.copyWith(
                color: changeColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 4),
            
            // 涨跌幅
            Row(
              children: [
                Icon(
                  isUp ? Icons.arrow_upward : Icons.arrow_downward,
                  color: changeColor,
                  size: 12,
                ),
                const SizedBox(width: 2),
                Text(
                  '${isUp ? '+' : ''}${stock.changePercent.toStringAsFixed(2)}%',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: changeColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        itemBuilder: (context, index) {
          return Container(
            width: 140,
            margin: EdgeInsets.only(right: index < 2 ? 12 : 0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 60,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.outline.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 80,
                    height: 16,
                    decoration: BoxDecoration(
                      color: AppColors.outline.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 70,
                    height: 20,
                    decoration: BoxDecoration(
                      color: AppColors.outline.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 50,
                    height: 12,
                    decoration: BoxDecoration(
                      color: AppColors.outline.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// 构建错误状态
  Widget _buildError(BuildContext context, Object error) {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              color: AppColors.textSecondary,
              size: 24,
            ),
            const SizedBox(height: 8),
            Text(
              '加载失败',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建空状态
  Widget _buildEmpty() {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.trending_up,
              color: AppColors.textSecondary,
              size: 24,
            ),
            const SizedBox(height: 8),
            Text(
              '暂无热门股票',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}