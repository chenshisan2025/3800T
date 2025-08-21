import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_strings.dart';
import '../models/watchlist_model.dart';
import '../providers/watchlist_provider.dart';
import 'stock_search_dialog.dart';

class WatchlistEmpty extends ConsumerWidget {
  final VoidCallback? onAddStock;
  final VoidCallback? onBrowseMarket;
  
  const WatchlistEmpty({
    super.key,
    this.onAddStock,
    this.onBrowseMarket,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.star_border,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              AppStrings.noWatchlistYet,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              AppStrings.addInterestedStocksToWatchlist + '\n' + AppStrings.quickViewStockPriceChanges,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            
            // 操作按钮
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: onAddStock ?? () {
                    showDialog(
                      context: context,
                      builder: (context) => const StockSearchDialog(),
                    );
                  },
                  icon: const Icon(Icons.search),
                  label: Text(AppStrings.searchStocks),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                OutlinedButton.icon(
                  onPressed: onBrowseMarket ?? () {
                    context.go('/market');
                  },
                  icon: const Icon(Icons.trending_up),
                  label: Text(AppStrings.browseMarket),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 48),
            
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
            const SizedBox(height: 16),
            
            // 推荐股票列表
            ...[
              _buildRecommendedStock(
                context,
                ref,
                name: '贵州茅台',
                symbol: '600519',
                market: MarketType.sh,
              ),
              _buildRecommendedStock(
                context,
                ref,
                name: '五粮液',
                symbol: '000858',
                market: MarketType.sz,
              ),
              _buildRecommendedStock(
                context,
                ref,
                name: '宁德时代',
                symbol: '300750',
                market: MarketType.gem,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendedStock(
    BuildContext context,
    WidgetRef ref, {
    required String name,
    required String symbol,
    required MarketType market,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      symbol,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: _getMarketColor(market),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _getMarketName(market),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
              onPressed: () => _addToWatchlist(
                context,
                ref,
                symbol: symbol,
                name: name,
                market: market,
              ),
              icon: const Icon(
                Icons.add_circle_outline,
                color: Colors.blue,
              ),
              tooltip: AppStrings.addToWatchlist,
            ),
        ],
      ),
    );
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

  Future<void> _addToWatchlist(
    BuildContext context,
    WidgetRef ref, {
    required String symbol,
    required String name,
    required MarketType market,
  }) async {
    try {
      await ref.read(watchlistProvider.notifier).addToWatchlist(
        symbol: symbol,
        name: name,
        market: market,
      );
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.addedToWatchlist.replaceFirst('{name}', name)),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppStrings.addFailed.replaceFirst('{error}', e.toString())),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}