import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';

/// 自选空状态组件
class WatchlistEmpty extends StatelessWidget {
  const WatchlistEmpty({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // 空状态图标
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(60),
            ),
            child: Icon(
              Icons.star_border_outlined,
              size: 60,
              color: AppColors.textSecondary,
            ),
          ),
          
          const SizedBox(height: 24),
          
          // 标题
          Text(
            '还没有自选股',
            style: AppTextStyles.titleLarge.copyWith(
              color: AppColors.textPrimary,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // 描述
          Text(
            '添加感兴趣的股票到自选，\n方便随时查看行情变化',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 32),
          
          // 操作按钮
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // 搜索股票按钮
              ElevatedButton.icon(
                onPressed: () {
                  context.push(AppRoutes.stockSearch);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                icon: const Icon(Icons.search, size: 20),
                label: const Text('搜索股票'),
              ),
              
              const SizedBox(width: 16),
              
              // 浏览市场按钮
              OutlinedButton.icon(
                onPressed: () {
                  // 切换到市场页面
                  DefaultTabController.of(context)?.animateTo(1);
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                icon: const Icon(Icons.trending_up, size: 20),
                label: const Text('浏览市场'),
              ),
            ],
          ),
          
          const SizedBox(height: 40),
          
          // 推荐股票
          _buildRecommendedStocks(context),
        ],
      ),
    );
  }

  /// 构建推荐股票
  Widget _buildRecommendedStocks(BuildContext context) {
    final recommendedStocks = [
      {'symbol': '000001', 'name': '平安银行'},
      {'symbol': '000002', 'name': '万科A'},
      {'symbol': '600036', 'name': '招商银行'},
      {'symbol': '600519', 'name': '贵州茅台'},
    ];

    return Column(
      children: [
        Text(
          '热门股票推荐',
          style: AppTextStyles.titleSmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        
        const SizedBox(height: 16),
        
        Wrap(
          spacing: 12,
          runSpacing: 8,
          children: recommendedStocks.map((stock) {
            return GestureDetector(
              onTap: () {
                context.push('${AppRoutes.stockDetail}/${stock['symbol']}');
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.outline,
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      stock['name'] as String,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      stock['symbol'] as String,
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}