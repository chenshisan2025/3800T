import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';

/// 涨跌幅排行区域
class RankingSection extends ConsumerStatefulWidget {
  const RankingSection({super.key});

  @override
  ConsumerState<RankingSection> createState() => _RankingSectionState();
}

class _RankingSectionState extends ConsumerState<RankingSection>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  final List<String> _tabs = ['涨幅榜', '跌幅榜', '成交额'];
  final List<String> _rankingTypes = ['up', 'down', 'turnover'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
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
                      '涨跌排行',
                      style: AppTextStyles.titleMedium.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    context.push(AppRoutes.ranking);
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
          
          // Tab栏
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(6),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              indicatorPadding: const EdgeInsets.all(2),
              labelColor: Colors.white,
              unselectedLabelColor: AppColors.textSecondary,
              labelStyle: AppTextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
              ),
              unselectedLabelStyle: AppTextStyles.bodySmall,
              dividerColor: Colors.transparent,
              tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
            ),
          ),
          
          // Tab内容
          SizedBox(
            height: 240,
            child: TabBarView(
              controller: _tabController,
              children: _rankingTypes.map((type) {
                return _buildRankingList(type);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  /// 构建排行榜列表
  Widget _buildRankingList(String type) {
    final rankingStocks = ref.watch(rankingStocksProvider(type));
    
    return rankingStocks.when(
      data: (stocks) => _buildStockList(stocks, type),
      loading: () => _buildLoading(),
      error: (error, stack) => _buildError(error),
    );
  }

  /// 构建股票列表
  Widget _buildStockList(List<StockModel> stocks, String type) {
    if (stocks.isEmpty) {
      return _buildEmpty();
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      itemCount: stocks.length > 5 ? 5 : stocks.length, // 最多显示5个
      itemBuilder: (context, index) {
        final stock = stocks[index];
        return _buildStockItem(stock, index + 1, type);
      },
    );
  }

  /// 构建股票项
  Widget _buildStockItem(StockModel stock, int rank, String type) {
    final isUp = stock.changePercent >= 0;
    final changeColor = isUp ? AppColors.stockUp : AppColors.stockDown;
    
    // 根据排行类型显示不同的数值
    String displayValue;
    switch (type) {
      case 'up':
      case 'down':
        displayValue = '${isUp ? '+' : ''}${stock.changePercent.toStringAsFixed(2)}%';
        break;
      case 'turnover':
        displayValue = _formatTurnover(stock.turnover);
        break;
      default:
        displayValue = '${isUp ? '+' : ''}${stock.changePercent.toStringAsFixed(2)}%';
    }
    
    return GestureDetector(
      onTap: () {
        context.push('${AppRoutes.stockDetail}/${stock.symbol}');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            // 排名
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: _getRankColor(rank),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Center(
                child: Text(
                  rank.toString(),
                  style: AppTextStyles.bodySmall.copyWith(
                    color: rank <= 3 ? Colors.white : AppColors.textSecondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            
            const SizedBox(width: 12),
            
            // 股票信息
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    stock.name,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    stock.symbol,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            
            // 价格和涨跌幅
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '¥${stock.price.toStringAsFixed(2)}',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  displayValue,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: type == 'turnover' ? AppColors.textSecondary : changeColor,
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

  /// 获取排名颜色
  Color _getRankColor(int rank) {
    switch (rank) {
      case 1:
        return const Color(0xFFFFD700); // 金色
      case 2:
        return const Color(0xFFC0C0C0); // 银色
      case 3:
        return const Color(0xFFCD7F32); // 铜色
      default:
        return AppColors.surface;
    }
  }

  /// 格式化成交额
  String _formatTurnover(double turnover) {
    if (turnover >= 100000000) {
      return '${(turnover / 100000000).toStringAsFixed(1)}亿';
    } else if (turnover >= 10000) {
      return '${(turnover / 10000).toStringAsFixed(1)}万';
    } else {
      return turnover.toStringAsFixed(0);
    }
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppColors.outline.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 80,
                      height: 16,
                      decoration: BoxDecoration(
                        color: AppColors.outline.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      width: 60,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.outline.withOpacity(0.3),
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
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  /// 构建错误状态
  Widget _buildError(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            color: AppColors.textSecondary,
            size: 32,
          ),
          const SizedBox(height: 8),
          Text(
            '加载失败',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  /// 构建空状态
  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.list_alt,
            color: AppColors.textSecondary,
            size: 32,
          ),
          const SizedBox(height: 8),
          Text(
            '暂无数据',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}