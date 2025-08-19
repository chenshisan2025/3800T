import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/providers/stock_provider.dart';

/// 持仓列表
class PositionsList extends ConsumerWidget {
  const PositionsList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final positions = ref.watch(positionsProvider);
    
    return positions.when(
      data: (positionList) => _buildPositionsList(context, positionList),
      loading: () => _buildLoading(),
      error: (error, _) => _buildError(context, error.toString()),
    );
  }

  /// 构建持仓列表
  Widget _buildPositionsList(BuildContext context, List<Position> positions) {
    if (positions.isEmpty) {
      return _buildEmpty(context);
    }
    
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: positions.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final position = positions[index];
        return PositionItem(
          position: position,
          onTap: () => _navigateToStockDetail(context, position.symbol),
        );
      },
    );
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => const PositionItemSkeleton(),
    );
  }

  /// 构建错误状态
  Widget _buildError(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              '加载失败',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // 重新加载数据的逻辑
              },
              child: const Text('重试'),
            ),
          ],
        ),
      ),
    );
  }

  /// 构建空状态
  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.account_balance_wallet_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              '暂无持仓',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '您还没有任何股票持仓',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/market'),
              child: const Text('去选股'),
            ),
          ],
        ),
      ),
    );
  }

  /// 导航到股票详情
  void _navigateToStockDetail(BuildContext context, String symbol) {
    context.push(AppRoutes.stockDetail.replaceAll(':symbol', symbol));
  }
}

/// 持仓项目
class PositionItem extends StatelessWidget {
  final Position position;
  final VoidCallback? onTap;
  
  const PositionItem({
    super.key,
    required this.position,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isProfit = position.unrealizedPnL >= 0;
    final pnlColor = isProfit ? AppColors.error : AppColors.success;
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
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
          children: [
            // 股票信息行
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            position.name,
                            style: AppTextStyles.titleMedium.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getMarketColor(position.symbol),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _getMarketName(position.symbol),
                              style: AppTextStyles.bodySmall.copyWith(
                                color: Colors.white,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        position.symbol,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '¥${position.currentPrice.toStringAsFixed(2)}',
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${isProfit ? '+' : ''}${position.changePercent.toStringAsFixed(2)}%',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: pnlColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // 持仓信息行
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    '持仓',
                    '${position.quantity}股',
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    '成本',
                    '¥${position.avgCost.toStringAsFixed(2)}',
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    '市值',
                    '¥${position.marketValue.toStringAsFixed(2)}',
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    '盈亏',
                    '${isProfit ? '+' : ''}¥${position.unrealizedPnL.toStringAsFixed(2)}',
                    color: pnlColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// 构建信息项目
  Widget _buildInfoItem(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: AppTextStyles.bodyMedium.copyWith(
            color: color ?? AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  /// 获取市场颜色
  Color _getMarketColor(String symbol) {
    if (symbol.startsWith('00') || symbol.startsWith('30')) {
      return Colors.green.shade600; // 深市
    } else if (symbol.startsWith('68')) {
      return Colors.orange.shade600; // 科创板
    } else {
      return Colors.blue.shade600; // 沪市
    }
  }

  /// 获取市场名称
  String _getMarketName(String symbol) {
    if (symbol.startsWith('00')) {
      return 'SZ';
    } else if (symbol.startsWith('30')) {
      return 'GEM';
    } else if (symbol.startsWith('68')) {
      return 'STAR';
    } else {
      return 'SH';
    }
  }
}

/// 持仓项目骨架屏
class PositionItemSkeleton extends StatelessWidget {
  const PositionItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 80,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      width: 60,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    width: 60,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: 40,
                    height: 12,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: List.generate(
              4,
              (index) => Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 30,
                      height: 10,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(5),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      width: 50,
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}