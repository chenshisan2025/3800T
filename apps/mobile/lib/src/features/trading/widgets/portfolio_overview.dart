import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../stock/providers/stock_provider.dart';

/// 投资组合概览
class PortfolioOverview extends ConsumerWidget {
  const PortfolioOverview({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final positions = ref.watch(positionsProvider);
    
    return Container(
      padding: const EdgeInsets.all(20),
      child: positions.when(
        data: (positionList) => _buildOverview(positionList),
        loading: () => _buildLoading(),
        error: (_, __) => _buildError(),
      ),
    );
  }

  /// 构建概览内容
  Widget _buildOverview(List<Position> positions) {
    // 计算总资产、总盈亏等
    double totalValue = 0;
    double totalCost = 0;
    double todayPnL = 0;
    
    for (final position in positions) {
      totalValue += position.marketValue;
      totalCost += position.cost;
      todayPnL += position.todayPnL;
    }
    
    final totalPnL = totalValue - totalCost;
    final totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0.0;
    final todayPnLPercent = totalValue > 0 ? (todayPnL / totalValue) * 100 : 0.0;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 总资产
        Text(
          '总资产',
          style: AppTextStyles.bodyMedium.copyWith(
            color: Colors.white.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '¥${totalValue.toStringAsFixed(2)}',
          style: AppTextStyles.headlineMedium.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        const SizedBox(height: 20),
        
        // 盈亏信息
        Row(
          children: [
            Expanded(
              child: _buildPnLItem(
                '总盈亏',
                totalPnL,
                totalPnLPercent,
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: _buildPnLItem(
                '今日盈亏',
                todayPnL,
                todayPnLPercent,
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // 统计信息
        Row(
          children: [
            Expanded(
              child: _buildStatItem(
                '持仓股票',
                '${positions.length}只',
              ),
            ),
            Expanded(
              child: _buildStatItem(
                '持仓成本',
                '¥${totalCost.toStringAsFixed(2)}',
              ),
            ),
            Expanded(
              child: _buildStatItem(
                '可用资金',
                '¥0.00', // 这里应该从用户资金账户获取
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// 构建盈亏项目
  Widget _buildPnLItem(String title, double value, double percent) {
    final isPositive = value >= 0;
    final color = isPositive
        ? Colors.red.shade300
        : Colors.green.shade300;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.bodySmall.copyWith(
            color: Colors.white.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${isPositive ? '+' : ''}¥${value.toStringAsFixed(2)}',
          style: AppTextStyles.titleMedium.copyWith(
            color: color,
            fontWeight: FontWeight.w600,
          ),
        ),
        Text(
          '${isPositive ? '+' : ''}${percent.toStringAsFixed(2)}%',
          style: AppTextStyles.bodySmall.copyWith(
            color: color,
          ),
        ),
      ],
    );
  }

  /// 构建统计项目
  Widget _buildStatItem(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.bodySmall.copyWith(
            color: Colors.white.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTextStyles.bodyMedium.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 60,
          height: 16,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: 120,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 80,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 80,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// 构建错误状态
  Widget _buildError() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '总资产',
          style: AppTextStyles.bodyMedium.copyWith(
            color: Colors.white.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '¥--',
          style: AppTextStyles.headlineMedium.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 20),
        Text(
          '数据加载失败',
          style: AppTextStyles.bodySmall.copyWith(
            color: Colors.white.withOpacity(0.6),
          ),
        ),
      ],
    );
  }
}