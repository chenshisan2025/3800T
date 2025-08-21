import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../../core/constants/app_strings.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';
import '../widgets/portfolio_overview.dart';
import '../widgets/position_list.dart';
import '../widgets/trade_record_list.dart';
import '../widgets/trading_quick_actions.dart';

/// 交易页面
class TradingPage extends ConsumerStatefulWidget {
  const TradingPage({super.key});

  @override
  ConsumerState<TradingPage> createState() => _TradingPageState();
}

class _TradingPageState extends ConsumerState<TradingPage>
    with AutomaticKeepAliveClientMixin, TickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// 加载数据
  void _loadData() {
    // 加载持仓数据
    ref.read(positionsProvider.notifier).loadPositions();
    // 加载交易记录
    ref.read(tradeRecordsProvider.notifier).loadTradeRecords();
  }

  /// 刷新数据
  Future<void> _refreshData() async {
    await Future.wait([
      ref.read(positionsProvider.notifier).refreshPositions(),
      ref.read(tradeRecordsProvider.notifier).refreshTradeRecords(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    
    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            // 应用栏
            SliverAppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              pinned: true,
              expandedHeight: 200,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.primary,
                        AppColors.primary.withOpacity(0.8),
                      ],
                    ),
                  ),
                  child: const SafeArea(
                    child: PortfolioOverview(),
                  ),
                ),
              ),
              title: Text(
                AppStrings.trading,
                style: AppTextStyles.titleLarge.copyWith(
                  color: innerBoxIsScrolled ? AppColors.textPrimary : Colors.white,
                ),
              ),
              actions: [
                IconButton(
                  onPressed: () {
                    context.push(AppRoutes.tradingHistory);
                  },
                  icon: Icon(
                    Icons.history,
                    color: innerBoxIsScrolled ? AppColors.textPrimary : Colors.white,
                  ),
                ),
                IconButton(
                  onPressed: () {
                    context.push(AppRoutes.tradingSettings);
                  },
                  icon: Icon(
                    Icons.settings,
                    color: innerBoxIsScrolled ? AppColors.textPrimary : Colors.white,
                  ),
                ),
              ],
            ),
            
            // Tab栏
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverTabBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  indicatorColor: AppColors.primary,
                  indicatorWeight: 3,
                  labelStyle: AppTextStyles.titleSmall,
                  unselectedLabelStyle: AppTextStyles.bodyMedium,
                  tabs: [
                    Tab(text: AppStrings.positions),
                    Tab(text: AppStrings.transactions),
                  ],
                ),
              ),
            ),
          ];
        },
        body: Column(
          children: [
            // 快捷操作
            const TradingQuickActions(),
            
            // Tab内容
            Expanded(
              child: RefreshIndicator(
                onRefresh: _refreshData,
                child: TabBarView(
                  controller: _tabController,
                  children: const [
                    PositionList(),
                    TradeRecordList(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Tab栏代理
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverTabBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;

  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}