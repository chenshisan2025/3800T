import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/router/app_routes.dart';
import '../../stock/models/stock_model.dart';
import '../../stock/providers/stock_provider.dart';
import '../widgets/market_filter_bar.dart';
import '../widgets/stock_list_item.dart';

/// 市场页面
class MarketPage extends ConsumerStatefulWidget {
  const MarketPage({super.key});

  @override
  ConsumerState<MarketPage> createState() => _MarketPageState();
}

class _MarketPageState extends ConsumerState<MarketPage>
    with AutomaticKeepAliveClientMixin {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  
  String _selectedMarket = 'all';
  String _sortBy = 'change_percent';
  bool _isAscending = false;
  String _searchKeyword = '';

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadStocks();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  /// 滚动监听
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreStocks();
    }
  }

  /// 加载股票列表
  void _loadStocks() {
    final notifier = ref.read(stockListProvider.notifier);
    notifier.loadStocks(
      keyword: _searchKeyword,
      market: _selectedMarket,
      sortBy: _sortBy,
      isAscending: _isAscending,
    );
  }

  /// 加载更多股票
  void _loadMoreStocks() {
    final notifier = ref.read(stockListProvider.notifier);
    notifier.loadMoreStocks();
  }

  /// 刷新股票列表
  Future<void> _refreshStocks() async {
    final notifier = ref.read(stockListProvider.notifier);
    await notifier.refreshStocks();
  }

  /// 搜索股票
  void _searchStocks(String keyword) {
    setState(() {
      _searchKeyword = keyword;
    });
    _loadStocks();
  }

  /// 筛选变化
  void _onFilterChanged({
    String? market,
    String? sortBy,
    bool? isAscending,
  }) {
    setState(() {
      if (market != null) _selectedMarket = market;
      if (sortBy != null) _sortBy = sortBy;
      if (isAscending != null) _isAscending = isAscending;
    });
    _loadStocks();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    
    final stockListState = ref.watch(stockListProvider);
    
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // 搜索栏
          _buildSearchBar(),
          
          // 筛选栏
          MarketFilterBar(
            selectedMarket: _selectedMarket,
            sortBy: _sortBy,
            isAscending: _isAscending,
            onFilterChanged: _onFilterChanged,
          ),
          
          // 股票列表
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refreshStocks,
              child: _buildStockList(stockListState),
            ),
          ),
        ],
      ),
    );
  }

  /// 构建搜索栏
  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: '搜索股票代码或名称',
                  hintStyle: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  prefixIcon: Icon(
                    Icons.search,
                    color: AppColors.textSecondary,
                    size: 20,
                  ),
                  suffixIcon: _searchKeyword.isNotEmpty
                      ? GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            _searchStocks('');
                          },
                          child: Icon(
                            Icons.clear,
                            color: AppColors.textSecondary,
                            size: 20,
                          ),
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                ),
                style: AppTextStyles.bodyMedium,
                onChanged: (value) {
                  if (value.isEmpty || value.length >= 2) {
                    _searchStocks(value);
                  }
                },
                onSubmitted: _searchStocks,
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () {
              context.push(AppRoutes.stockSearch);
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(
                Icons.tune,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 构建股票列表
  Widget _buildStockList(StockListState state) {
    if (state.isLoading && state.stocks.isEmpty) {
      return _buildLoading();
    }
    
    if (state.error != null && state.stocks.isEmpty) {
      return _buildError(state.error!);
    }
    
    if (state.stocks.isEmpty) {
      return _buildEmpty();
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: state.stocks.length + (state.hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index >= state.stocks.length) {
          // 加载更多指示器
          return _buildLoadMoreIndicator(state.isLoadingMore);
        }
        
        final stock = state.stocks[index];
        return StockListItem(
          stock: stock,
          onTap: () {
            context.push('${AppRoutes.stockDetail}/${stock.symbol}');
          },
        );
      },
    );
  }

  /// 构建加载更多指示器
  Widget _buildLoadMoreIndicator(bool isLoading) {
    return Container(
      height: 60,
      child: Center(
        child: isLoading
            ? const CircularProgressIndicator()
            : Text(
                '没有更多数据了',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
      ),
    );
  }

  /// 构建加载状态
  Widget _buildLoading() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: 10,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
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
                    const SizedBox(height: 8),
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
            ],
          ),
        );
      },
    );
  }

  /// 构建错误状态
  Widget _buildError(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            color: AppColors.textSecondary,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            '加载失败',
            style: AppTextStyles.titleMedium.copyWith(
              color: AppColors.textSecondary,
            ),
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
            onPressed: _loadStocks,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('重试'),
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
            Icons.search_off,
            color: AppColors.textSecondary,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            '没有找到相关股票',
            style: AppTextStyles.titleMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '请尝试其他搜索关键词',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}