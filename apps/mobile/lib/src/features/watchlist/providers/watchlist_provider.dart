import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../../core/services/network_service.dart';
import '../../../core/services/storage_service.dart';
import '../../alerts/models/alert_model.dart';
import '../models/watchlist_model.dart';
import '../services/watchlist_service.dart';

/// 自选股服务提供者
final watchlistServiceProvider = Provider<WatchlistService>((ref) {
  final networkService = ref.read(networkServiceProvider);
  final storageService = ref.read(storageServiceProvider);
  
  return WatchlistService(
    networkService: networkService,
    storageService: storageService,
  );
});

/// 自选股列表状态
class WatchlistState {
  final List<WatchlistItem> items;
  final bool isLoading;
  final String? error;
  final bool isEditMode;
  final Set<String> selectedItems;

  const WatchlistState({
    this.items = const [],
    this.isLoading = false,
    this.error,
    this.isEditMode = false,
    this.selectedItems = const {},
  });

  /// 是否全选
  bool get isAllSelected => selectedItems.isNotEmpty && selectedItems.length == items.length;

  WatchlistState copyWith({
    List<WatchlistItem>? items,
    bool? isLoading,
    String? error,
    bool? isEditMode,
    Set<String>? selectedItems,
  }) {
    return WatchlistState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isEditMode: isEditMode ?? this.isEditMode,
      selectedItems: selectedItems ?? this.selectedItems,
    );
  }
}

/// 自选股状态管理
class WatchlistNotifier extends StateNotifier<WatchlistState> {
  final WatchlistService _watchlistService;
  
  WatchlistNotifier(this._watchlistService) : super(const WatchlistState()) {
    loadWatchlist();
  }

  /// 加载自选股列表
  Future<void> loadWatchlist() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final items = await _watchlistService.getWatchlist();
      // 按排序顺序排列
      items.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      
      state = state.copyWith(
        items: items,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// 添加到自选股
  Future<void> addToWatchlist({
    required String symbol,
    required String name,
    required MarketType market,
  }) async {
    try {
      final item = WatchlistItem(
        symbol: symbol,
        name: name,
        market: market,
        addedAt: DateTime.now(),
        sortOrder: state.items.length,
      );
      
      await _watchlistService.addToWatchlist(item);
      await loadWatchlist();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 从自选股移除
  Future<void> removeFromWatchlist(String symbol) async {
    try {
      await _watchlistService.removeFromWatchlist(symbol);
      await loadWatchlist();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 批量移除自选股
  Future<void> removeSelectedItems() async {
    if (state.selectedItems.isEmpty) return;
    
    try {
      await _watchlistService.removeMultipleFromWatchlist(
        state.selectedItems.toList(),
      );
      
      state = state.copyWith(selectedItems: {});
      await loadWatchlist();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 更新自选股排序
  Future<void> reorderWatchlist(int oldIndex, int newIndex) async {
    final items = List<WatchlistItem>.from(state.items);
    
    if (newIndex > oldIndex) {
      newIndex -= 1;
    }
    
    final item = items.removeAt(oldIndex);
    items.insert(newIndex, item);
    
    // 更新本地状态
    state = state.copyWith(items: items);
    
    try {
      // 保存到存储
      await _watchlistService.updateWatchlistOrder(items);
    } catch (e) {
      // 如果保存失败，恢复原状态
      await loadWatchlist();
      state = state.copyWith(error: e.toString());
    }
  }

  /// reorderItems方法别名
  Future<void> reorderItems(int oldIndex, int newIndex) async {
    await reorderWatchlist(oldIndex, newIndex);
  }

  /// 切换编辑模式
  void toggleEditMode() {
    state = state.copyWith(
      isEditMode: !state.isEditMode,
      selectedItems: {},
    );
  }

  /// 切换项目选择状态
  void toggleItemSelection(String symbol) {
    final selectedItems = Set<String>.from(state.selectedItems);
    
    if (selectedItems.contains(symbol)) {
      selectedItems.remove(symbol);
    } else {
      selectedItems.add(symbol);
    }
    
    state = state.copyWith(selectedItems: selectedItems);
  }

  /// 全选/取消全选
  void toggleSelectAll() {
    final allSymbols = state.items.map((item) => item.symbol).toSet();
    
    if (state.selectedItems.length == allSymbols.length) {
      // 当前全选，取消全选
      state = state.copyWith(selectedItems: {});
    } else {
      // 全选
      state = state.copyWith(selectedItems: allSymbols);
    }
  }

  /// 检查是否在自选股中
  Future<bool> isInWatchlist(String symbol) async {
    return await _watchlistService.isInWatchlist(symbol);
  }

  /// 清除错误
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// 自选股状态提供者
final watchlistProvider = StateNotifierProvider<WatchlistNotifier, WatchlistState>((ref) {
  final service = ref.read(watchlistServiceProvider);
  return WatchlistNotifier(service);
});

/// 股票报价提供者
final stockQuoteProvider = FutureProvider.family<StockQuote, String>((ref, symbol) async {
  final service = ref.read(watchlistServiceProvider);
  return await service.getStockQuote(symbol);
});

/// 多个股票报价提供者
final multipleStockQuotesProvider = FutureProvider.family<Map<String, StockQuote>, List<String>>((ref, symbols) async {
  final service = ref.read(watchlistServiceProvider);
  return await service.getMultipleStockQuotes(symbols);
});

/// 价格提醒状态
class PriceAlertsState {
  final List<PriceAlert> alerts;
  final bool isLoading;
  final String? error;

  const PriceAlertsState({
    this.alerts = const [],
    this.isLoading = false,
    this.error,
  });

  PriceAlertsState copyWith({
    List<PriceAlert>? alerts,
    bool? isLoading,
    String? error,
  }) {
    return PriceAlertsState(
      alerts: alerts ?? this.alerts,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// 价格提醒状态管理
class PriceAlertsNotifier extends StateNotifier<PriceAlertsState> {
  final WatchlistService _watchlistService;
  
  PriceAlertsNotifier(this._watchlistService) : super(const PriceAlertsState()) {
    loadPriceAlerts();
  }

  /// 加载价格提醒
  Future<void> loadPriceAlerts() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final alerts = await _watchlistService.getPriceAlerts();
      // 按创建时间倒序排列
      alerts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      
      state = state.copyWith(
        alerts: alerts,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// 添加价格提醒
  Future<void> addPriceAlert({
    required String symbol,
    required String name,
    required AlertType type,
    required double targetPrice,
    required double currentPrice,
    String? note,
  }) async {
    try {
      const uuid = Uuid();
      final alert = PriceAlert(
        id: uuid.v4(),
        symbol: symbol,
        name: name,
        type: type,
        targetPrice: targetPrice,
        currentPrice: currentPrice,
        isEnabled: true,
        createdAt: DateTime.now(),
        note: note,
      );
      
      await _watchlistService.addPriceAlert(alert);
      await loadPriceAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 删除价格提醒
  Future<void> removePriceAlert(String alertId) async {
    try {
      await _watchlistService.removePriceAlert(alertId);
      await loadPriceAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 切换提醒启用状态
  Future<void> toggleAlertEnabled(String alertId) async {
    try {
      final alert = state.alerts.firstWhere((a) => a.id == alertId);
      final updatedAlert = alert.copyWith(isEnabled: !alert.isEnabled);
      
      await _watchlistService.updatePriceAlert(updatedAlert);
      await loadPriceAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 检查价格提醒
  Future<List<PriceAlert>> checkPriceAlerts() async {
    try {
      final triggeredAlerts = await _watchlistService.checkPriceAlerts();
      if (triggeredAlerts.isNotEmpty) {
        await loadPriceAlerts();
      }
      return triggeredAlerts;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return [];
    }
  }

  /// 清除错误
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// 价格提醒状态提供者
final priceAlertsProvider = StateNotifierProvider<PriceAlertsNotifier, PriceAlertsState>((ref) {
  final service = ref.read(watchlistServiceProvider);
  return PriceAlertsNotifier(service);
});