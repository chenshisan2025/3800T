import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/providers/stock_provider.dart';

/// 市场概况卡片
class MarketOverviewCard extends ConsumerWidget {
  const MarketOverviewCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final marketOverview = ref.watch(marketOverviewProvider);

    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primary.withOpacity(0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: marketOverview.when(
        data: (overview) => _buildContent(context, overview),
        loading: () => _buildLoading(),
        error: (error, stack) => _buildError(context, error),
      ),
    );
  }

  /// 构建内容
  Widget _buildContent(BuildContext context, Map<String, dynamic> overview) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题行
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '市场概况',
                style: AppTextStyles.headlineSmall.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              GestureDetector(
                onTap: () {
                  context.push(AppRoutes.market);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '查看更多',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.arrow_forward_ios,
                        color: Colors.white,
                        size: 12,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // 主要指数
          Row(
            children: [
              Expanded(
                child: _buildIndexItem(
                  name: '上证指数',
                  value: overview['shanghai_index']?['value'] ?? '3000.00',
                  change: overview['shanghai_index']?['change'] ?? '+1.23',
                  changePercent: overview['shanghai_index']?['change_percent'] ?? '+0.41%',
                  isUp: (overview['shanghai_index']?['change'] ?? 0) >= 0,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildIndexItem(
                  name: '深证成指',
                  value: overview['shenzhen_index']?['value'] ?? '10000.00',
                  change: overview['shenzhen_index']?['change'] ?? '-2.45',
                  changePercent: overview['shenzhen_index']?['change_percent'] ?? '-0.24%',
                  isUp: (overview['shenzhen_index']?['change'] ?? 0) >= 0,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          Row(
            children: [
              Expanded(
                child: _buildIndexItem(
                  name: '创业板指',
                  value: overview['gem_index']?['value'] ?? '2000.00',
                  change: overview['gem_index']?['change'] ?? '+5.67',
                  changePercent: overview['gem_index']?['change_percent'] ?? '+0.28%',
                  isUp: (overview['gem_index']?['change'] ?? 0) >= 0,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildIndexItem(
                  name: '科创50',
                  value: overview['star_index']?['value'] ?? '1000.00',
                  change: overview['star_index']?['change'] ?? '-1.23',
                  changePercent: overview['star_index']?['change_percent'] ?? '-0.12%',
                  isUp: (overview['star_index']?['change'] ?? 0) >= 0,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // 市场统计
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    label: '上涨',
                    value: overview['up_count']?.toString() ?? '1234',
                    color: AppColors.stockUp,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    label: '下跌',
                    value: overview['down_count']?.toString() ?? '2345',
                    color: AppColors.stockDown,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    label: '平盘',
                    value: overview['flat_count']?.toString() ?? '123',
                    color: Colors.white70,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    label: '成交额',
                    value: overview['turnover']?.toString() ?? '8.5万亿',
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// 构建指数项
  Widget _buildIndexItem({
    required String name,
    required String value,
    required String change,
    required String changePercent,
    required bool isUp,
  }) {
    final color = isUp ? AppColors.stockUp : AppColors.stockDown;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name,
          style: AppTextStyles.bodySmall.copyWith(
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTextStyles.titleMedium.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Row(
          children: [
            Icon(
              isUp ? Icons.arrow_upward : Icons.arrow_downward,
              color: color,
              size: 12,
            ),
            const SizedBox(width: 2),
            Text(
              change,
              style: AppTextStyles.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Text(
              changePercent,
              style: AppTextStyles.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// 构建统计项
  Widget _buildStatItem({
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: AppTextStyles.titleSmall.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(20),
      child: const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
        ),
      ),
    );
  }

  /// 构建错误状态
  Widget _buildError(BuildContext context, Object error) {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(20),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: Colors.white70,
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              '加载失败',
              style: AppTextStyles.bodyMedium.copyWith(
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                // 重新加载
              },
              child: Text(
                '重试',
                style: AppTextStyles.bodySmall.copyWith(
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}