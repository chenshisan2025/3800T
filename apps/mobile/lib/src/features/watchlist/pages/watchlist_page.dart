import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/constants/app_strings.dart';
import '../../auth/models/user_model.dart';
import '../models/watchlist_model.dart';
import '../providers/watchlist_provider.dart';
import '../widgets/watchlist_empty.dart';
import '../widgets/watchlist_item.dart';
import '../widgets/price_alert_dialog.dart';
import '../widgets/stock_search_dialog.dart';

class WatchlistPage extends ConsumerStatefulWidget {
  const WatchlistPage({super.key});

  @override
  ConsumerState<WatchlistPage> createState() => _WatchlistPageState();
}

class _WatchlistPageState extends ConsumerState<WatchlistPage> {
  @override
  void initState() {
    super.initState();
    // 页面加载时刷新自选股
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(watchlistProvider.notifier).loadWatchlist();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final watchlistState = ref.watch(watchlistProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.watchlist),
        actions: [
          if (authState.asData?.value != null && watchlistState.items.isNotEmpty)
            if (watchlistState.isEditMode)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextButton(
                    onPressed: () {
                      ref.read(watchlistProvider.notifier).toggleSelectAll();
                    },
                    child: Text(
                      watchlistState.isAllSelected ? AppStrings.deselectAll : AppStrings.selectAll,
                    ),
                  ),
                  TextButton(
                    onPressed: watchlistState.selectedItems.isEmpty
                        ? null
                        : () => _showDeleteConfirmDialog(context),
                    child: Text(AppStrings.delete),
                  ),
                  TextButton(
                    onPressed: () {
                      ref.read(watchlistProvider.notifier).toggleEditMode();
                    },
                    child: Text(AppStrings.done),
                  ),
                ],
              )
            else
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: () => _showSearchDialog(context),
                    icon: const Icon(Icons.add),
                    tooltip: AppStrings.addToWatchlist,
                  ),
                  IconButton(
                    onPressed: () {
                      ref.read(watchlistProvider.notifier).toggleEditMode();
                    },
                    icon: const Icon(Icons.edit),
                    tooltip: AppStrings.edit,
                  ),
                ],
              ),
        ],
      ),
      body: _buildBody(context, authState, watchlistState),
    );
  }

  Widget _buildBody(
    BuildContext context,
    AsyncValue<UserModel?> authState,
    WatchlistState watchlistState,
  ) {
    // 未登录状态
    if (authState.asData?.value == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person_outline,
              size: 64,
              color: Colors.grey,
            ),
            SizedBox(height: 16),
            Text(
              AppStrings.pleaseLoginFirst,
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 8),
            Text(
              AppStrings.loginToAddWatchlist,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(watchlistProvider.notifier).loadWatchlist(),
      child: _buildWatchlistContent(context, watchlistState),
    );
  }

  Widget _buildWatchlistContent(
    BuildContext context,
    WatchlistState state,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              AppStrings.loadFailed,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              state.error!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(watchlistProvider.notifier).loadWatchlist(),
              child: Text(AppStrings.retry),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return WatchlistEmpty(
        onAddStock: () => _showSearchDialog(context),
        onBrowseMarket: () => context.go('/market'),
      );
    }

    return ReorderableListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.items.length,
      onReorder: (oldIndex, newIndex) {
        ref.read(watchlistProvider.notifier).reorderItems(oldIndex, newIndex);
      },
      itemBuilder: (context, index) {
        final item = state.items[index];
        return WatchlistItemWidget(
          key: ValueKey(item.symbol),
          item: item,
          isEditMode: state.isEditMode,
          isSelected: state.selectedItems.contains(item.symbol),
          onTap: state.isEditMode
              ? () => ref.read(watchlistProvider.notifier).toggleItemSelection(item.symbol)
              : () => context.go('/stock/${item.symbol}'),
          onLongPress: state.isEditMode
              ? null
              : () => _showItemOptions(context, item),
        );
      },
    );
  }

  void _showDeleteConfirmDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppStrings.confirmDelete),
        content: Text(AppStrings.confirmDeleteSelectedStocks.replaceAll('{count}', '${ref.read(watchlistProvider).selectedItems.length}')),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(AppStrings.cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(watchlistProvider.notifier).removeSelectedItems();
            },
            child: Text(AppStrings.delete),
          ),
        ],
      ),
    );
  }

  void _showSearchDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const StockSearchDialog(),
    );
  }

  void _showItemOptions(
    BuildContext context,
    WatchlistItem item,
  ) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.show_chart),
              title: Text(AppStrings.viewDetails),
              onTap: () {
                Navigator.of(context).pop();
                context.go('/stock/${item.symbol}');
              },
            ),
            ListTile(
              leading: const Icon(Icons.notifications),
              title: Text(AppStrings.setAlert),
              onTap: () {
                Navigator.of(context).pop();
                _showPriceAlertDialog(context, item);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: Text(AppStrings.removeFromWatchlist, style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.of(context).pop();
                ref.read(watchlistProvider.notifier).removeFromWatchlist(item.symbol);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showPriceAlertDialog(BuildContext context, WatchlistItem item) {
    showDialog(
      context: context,
      builder: (context) => PriceAlertDialog(
        initialSymbol: item.symbol,
        initialName: item.name,
        initialPrice: item.quote?.price ?? 0.0,
      ),
    );
  }
}