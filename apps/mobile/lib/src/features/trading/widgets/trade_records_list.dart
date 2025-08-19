import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/providers/stock_provider.dart';

/// 成交记录列表
class TradeRecordsList extends ConsumerWidget {
  const TradeRecordsList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tradeRecords = ref.watch(tradeRecordsProvider);
    
    return tradeRecords.when(
      data: (records) => _buildTradeRecordsList(context, records),
      loading: () => _buildLoading(),
      error: (error, _) => _buildError(context, error.toString()),
    );
  }

  /// 构建成交记录列表
  Widget _buildTradeRecordsList(BuildContext context, List<TradeRecord> records) {
    if (records.isEmpty) {
      return _buildEmpty(context);
    }
    
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: records.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final record = records[index];
        return TradeRecordItem(
          record: record,
          onTap: () => _navigateToStockDetail(context, record.symbol),
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
      itemBuilder: (context, index) => const TradeRecordItemSkeleton(),
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
              Icons.receipt_long_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              '暂无成交记录',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '您还没有任何交易记录',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/market'),
              child: const Text('去交易'),
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

/// 成交记录项目
class TradeRecordItem extends StatelessWidget {
  final TradeRecord record;
  final VoidCallback? onTap;
  
  const TradeRecordItem({
    super.key,
    required this.record,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isBuy = record.side == 'buy';
    final sideColor = isBuy ? AppColors.error : AppColors.success;
    
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
            // 股票信息和交易方向
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            record.name,
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
                              color: _getMarketColor(record.symbol),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _getMarketName(record.symbol),
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
                        record.symbol,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: sideColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    isBuy ? '买入' : '卖出',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: sideColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // 交易信息
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    '成交价',
                    '¥${record.price.toStringAsFixed(2)}',
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    '数量',
                    '${record.quantity}股',
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    '成交额',
                    '¥${record.amount.toStringAsFixed(2)}',
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    '手续费',
                    '¥${record.commission.toStringAsFixed(2)}',
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // 时间信息
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '成交时间',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  _formatDateTime(record.tradeTime),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
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
  Widget _buildInfoItem(String label, String value) {
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

  /// 格式化日期时间
  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

/// 成交记录项目骨架屏
class TradeRecordItemSkeleton extends StatelessWidget {
  const TradeRecordItemSkeleton({super.key});

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
              Container(
                width: 40,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
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
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 50,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              Container(
                width: 80,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}