import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// 市场筛选栏
class MarketFilterBar extends StatelessWidget {
  final String selectedMarket;
  final String sortBy;
  final bool isAscending;
  final Function({
    String? market,
    String? sortBy,
    bool? isAscending,
  }) onFilterChanged;

  const MarketFilterBar({
    super.key,
    required this.selectedMarket,
    required this.sortBy,
    required this.isAscending,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          // 市场筛选
          _buildMarketFilter(),
          
          // 排序筛选
          _buildSortFilter(),
          
          const Divider(height: 1),
        ],
      ),
    );
  }

  /// 构建市场筛选
  Widget _buildMarketFilter() {
    final markets = [
      {'key': 'all', 'name': '全部'},
      {'key': 'sh', 'name': '沪市'},
      {'key': 'sz', 'name': '深市'},
      {'key': 'gem', 'name': '创业板'},
      {'key': 'star', 'name': '科创板'},
    ];

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(
            '市场：',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: markets.map((market) {
                  final isSelected = selectedMarket == market['key'];
                  return GestureDetector(
                    onTap: () {
                      onFilterChanged(market: market['key'] as String);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.outline,
                        ),
                      ),
                      child: Text(
                        market['name'] as String,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 构建排序筛选
  Widget _buildSortFilter() {
    final sortOptions = [
      {'key': 'change_percent', 'name': '涨跌幅'},
      {'key': 'price', 'name': '价格'},
      {'key': 'volume', 'name': '成交量'},
      {'key': 'turnover', 'name': '成交额'},
      {'key': 'market_cap', 'name': '市值'},
    ];

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Text(
            '排序：',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: sortOptions.map((option) {
                  final isSelected = sortBy == option['key'];
                  return GestureDetector(
                    onTap: () {
                      if (isSelected) {
                        // 如果已选中，切换升降序
                        onFilterChanged(isAscending: !isAscending);
                      } else {
                        // 如果未选中，选中并设为降序
                        onFilterChanged(
                          sortBy: option['key'] as String,
                          isAscending: false,
                        );
                      }
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary.withOpacity(0.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.outline,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            option['name'] as String,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: isSelected ? AppColors.primary : AppColors.textPrimary,
                            ),
                          ),
                          if (isSelected) ..[
                            const SizedBox(width: 4),
                            Icon(
                              isAscending ? Icons.arrow_upward : Icons.arrow_downward,
                              size: 12,
                              color: AppColors.primary,
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}