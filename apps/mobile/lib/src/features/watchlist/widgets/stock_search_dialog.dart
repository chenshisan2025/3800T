import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_strings.dart';
import '../../shared/services/stock_service.dart';
import '../models/watchlist_model.dart';
import '../providers/watchlist_provider.dart';

class StockSearchDialog extends ConsumerStatefulWidget {
  const StockSearchDialog({super.key});

  @override
  ConsumerState<StockSearchDialog> createState() => _StockSearchDialogState();
}

class _StockSearchDialogState extends ConsumerState<StockSearchDialog> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  List<StockSearchResult> _searchResults = [];
  bool _isSearching = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        height: MediaQuery.of(context).size.height * 0.7,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 标题栏
            Row(
              children: [
                Text(
                  AppStrings.searchStocks,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // 搜索框
            TextField(
              controller: _searchController,
              focusNode: _focusNode,
              decoration: InputDecoration(
                hintText: AppStrings.enterStockCodeOrName,
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                            _searchResults = [];
                          });
                        },
                        icon: const Icon(Icons.clear),
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onChanged: _onSearchChanged,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _performSearch(),
            ),
            const SizedBox(height: 16),
            
            // 搜索结果
            Expanded(
              child: _buildSearchResults(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_searchQuery.isEmpty) {
      return _buildSearchTips();
    }

    if (_isSearching) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              AppStrings.noStocksFound,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              AppStrings.tryOtherKeywords,
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final stock = _searchResults[index];
        return _buildStockItem(stock);
      },
    );
  }

  Widget _buildSearchTips() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.lightbulb_outline,
                    color: Colors.blue[600],
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    AppStrings.searchTips,
                    style: TextStyle(
                      color: Colors.blue[600],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                AppStrings.searchTipsContent,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        
        // 热门股票推荐
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            AppStrings.hotRecommendations,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(height: 12),
        
        Expanded(
          child: ListView(
            children: [
              _buildRecommendedStock(
                name: AppStrings.guizhouMoutai,
                symbol: '600519',
                market: MarketType.sh,
              ),
              _buildRecommendedStock(
                name: AppStrings.chinaPingAn,
                symbol: '601318',
                market: MarketType.sh,
              ),
              _buildRecommendedStock(
                name: AppStrings.cmb,
                symbol: '600036',
                market: MarketType.sh,
              ),
              _buildRecommendedStock(
                name: AppStrings.wuliangye,
                symbol: '000858',
                market: MarketType.sz,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStockItem(StockSearchResult stock) {
    final watchlistState = ref.watch(watchlistProvider);
    final isInWatchlist = watchlistState.items.any(
      (item) => item.symbol == stock.symbol,
    );

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: _getMarketColor(stock.market),
        child: Text(
          _getMarketName(stock.market),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      title: Text(
        stock.name,
        style: const TextStyle(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        stock.symbol,
        style: TextStyle(
          color: Colors.grey[600],
        ),
      ),
      trailing: isInWatchlist
          ? Icon(
              Icons.check_circle,
              color: Colors.green[600],
            )
          : IconButton(
              onPressed: () => _addToWatchlist(stock),
              icon: const Icon(
                Icons.add_circle_outline,
                color: Colors.blue,
              ),
            ),
      onTap: isInWatchlist
          ? () {
              Navigator.of(context).pop();
              context.go('/stock/${stock.symbol}');
            }
          : () => _addToWatchlist(stock),
    );
  }

  Widget _buildRecommendedStock({
    required String name,
    required String symbol,
    required MarketType market,
  }) {
    final watchlistState = ref.watch(watchlistProvider);
    final isInWatchlist = watchlistState.items.any(
      (item) => item.symbol == symbol,
    );

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: _getMarketColor(market),
        child: Text(
          _getMarketName(market),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      title: Text(
        name,
        style: const TextStyle(
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(
        symbol,
        style: TextStyle(
          color: Colors.grey[600],
        ),
      ),
      trailing: isInWatchlist
          ? Icon(
              Icons.check_circle,
              color: Colors.green[600],
            )
          : IconButton(
              onPressed: () => _addToWatchlist(StockSearchResult(
                symbol: symbol,
                name: name,
                market: market,
              )),
              icon: const Icon(
                Icons.add_circle_outline,
                color: Colors.blue,
              ),
            ),
      onTap: isInWatchlist
          ? () {
              Navigator.of(context).pop();
              context.go('/stock/$symbol');
            }
          : () => _addToWatchlist(StockSearchResult(
              symbol: symbol,
              name: name,
              market: market,
            )),
    );
  }

  Timer? _debounceTimer;
  
  void _onSearchChanged(String value) {
    setState(() {
      _searchQuery = value;
    });

    if (value.isEmpty) {
      setState(() {
        _searchResults = [];
      });
      return;
    }

    // 取消之前的定时器
    _debounceTimer?.cancel();
    
    // 设置新的防抖定时器
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (_searchQuery == value && value.isNotEmpty) {
        _performSearch();
      }
    });
  }

  Future<void> _performSearch() async {
    if (_searchQuery.isEmpty) return;

    setState(() {
      _isSearching = true;
    });

    try {
      final stockService = ref.read(stockServiceProvider);
      final results = await stockService.searchStocks(_searchQuery);
      
      if (mounted) {
        setState(() {
          _searchResults = results;
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _searchResults = [];
          _isSearching = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.searchFailed.replaceFirst('{error}', e.toString())),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _addToWatchlist(StockSearchResult stock) async {
    try {
      await ref.read(watchlistProvider.notifier).addToWatchlist(
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.addedToWatchlist.replaceFirst('{name}', stock.name)),
            backgroundColor: Colors.green,
          ),
        );
        
        // 刷新搜索结果以更新状态
        setState(() {});
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.addFailed.replaceFirst('{error}', e.toString())),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Color _getMarketColor(MarketType market) {
    switch (market) {
      case MarketType.sh:
        return Colors.orange;
      case MarketType.sz:
        return Colors.purple;
      case MarketType.gem:
        return Colors.green;
      case MarketType.star:
        return Colors.blue;
    }
  }

  String _getMarketName(MarketType market) {
    switch (market) {
      case MarketType.sh:
        return '沪';
      case MarketType.sz:
        return '深';
      case MarketType.gem:
        return '创';
      case MarketType.star:
        return '科';
    }
  }
}

// 股票搜索结果模型
class StockSearchResult {
  final String symbol;
  final String name;
  final MarketType market;

  StockSearchResult({
    required this.symbol,
    required this.name,
    required this.market,
  });

  factory StockSearchResult.fromJson(Map<String, dynamic> json) {
    return StockSearchResult(
      symbol: json['symbol'] ?? '',
      name: json['name'] ?? '',
      market: MarketType.values.firstWhere(
        (e) => e.name == json['market'],
        orElse: () => MarketType.sh,
      ),
    );
  }
}