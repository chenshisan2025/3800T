import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/network_service.dart';
import '../../../core/services/storage_service.dart';
import '../models/alert_model.dart';
import '../services/alert_service.dart';

/// 提醒服务提供者
final alertServiceProvider = Provider<AlertService>((ref) {
  final networkService = ref.read(networkServiceProvider);
  final storageService = ref.read(storageServiceProvider);
  
  return AlertService(
    networkService: networkService,
    storageService: storageService,
  );
});

/// 提醒列表状态
class AlertState {
  final List<AlertItem> items;
  final bool isLoading;
  final String? error;
  final bool isEditMode;
  final Set<String> selectedItems;
  final int unreadCount;

  const AlertState({
    this.items = const [],
    this.isLoading = false,
    this.error,
    this.isEditMode = false,
    this.selectedItems = const {},
    this.unreadCount = 0,
  });

  AlertState copyWith({
    List<AlertItem>? items,
    bool? isLoading,
    String? error,
    bool? isEditMode,
    Set<String>? selectedItems,
    int? unreadCount,
  }) {
    return AlertState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isEditMode: isEditMode ?? this.isEditMode,
      selectedItems: selectedItems ?? this.selectedItems,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

/// 提醒状态管理
class AlertNotifier extends StateNotifier<AlertState> {
  final AlertService _alertService;
  
  AlertNotifier(this._alertService) : super(const AlertState()) {
    loadAlerts();
  }

  /// 加载提醒列表
  Future<void> loadAlerts() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final items = await _alertService.getAlerts();
      final unreadCount = await _alertService.getUnreadCount();
      
      // 按创建时间倒序排列
      items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      
      state = state.copyWith(
        items: items,
        isLoading: false,
        unreadCount: unreadCount,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// 创建提醒
  Future<void> createAlert({
    required String symbol,
    required String name,
    required AlertType type,
    required double targetPrice,
    required double currentPrice,
    String? note,
  }) async {
    try {
      await _alertService.createAlert(
        symbol: symbol,
        name: name,
        type: type,
        targetPrice: targetPrice,
        currentPrice: currentPrice,
        note: note,
      );
      
      await loadAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 更新提醒
  Future<void> updateAlert(AlertItem alert) async {
    try {
      await _alertService.updateAlert(alert);
      await loadAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 删除提醒
  Future<void> deleteAlert(String alertId) async {
    try {
      await _alertService.deleteAlert(alertId);
      await loadAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 批量删除提醒
  Future<void> deleteSelectedAlerts() async {
    if (state.selectedItems.isEmpty) return;
    
    try {
      await _alertService.deleteMultipleAlerts(
        state.selectedItems.toList(),
      );
      
      state = state.copyWith(selectedItems: {});
      await loadAlerts();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 标记为已读
  Future<void> markAsRead(String alertId) async {
    try {
      await _alertService.markAsRead(alertId);
      
      // 更新本地状态
      final updatedItems = state.items.map((item) {
        if (item.id == alertId) {
          return item.copyWith(isRead: true);
        }
        return item;
      }).toList();
      
      final unreadCount = updatedItems.where((item) => !item.isRead).length;
      
      state = state.copyWith(
        items: updatedItems,
        unreadCount: unreadCount,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// 切换编辑模式
  void toggleEditMode() {
    state = state.copyWith(
      isEditMode: !state.isEditMode,
      selectedItems: {},
    );
  }

  /// 切换项目选择状态
  void toggleItemSelection(String alertId) {
    final selectedItems = Set<String>.from(state.selectedItems);
    
    if (selectedItems.contains(alertId)) {
      selectedItems.remove(alertId);
    } else {
      selectedItems.add(alertId);
    }
    
    state = state.copyWith(selectedItems: selectedItems);
  }

  /// 全选/取消全选
  void toggleSelectAll() {
    final allIds = state.items.map((item) => item.id).toSet();
    
    if (state.selectedItems.length == allIds.length) {
      // 当前全选，取消全选
      state = state.copyWith(selectedItems: {});
    } else {
      // 全选
      state = state.copyWith(selectedItems: allIds);
    }
  }

  /// 切换提醒启用状态
  Future<void> toggleAlertEnabled(String alertId) async {
    final alert = state.items.firstWhere((item) => item.id == alertId);
    final updatedAlert = alert.copyWith(isEnabled: !alert.isEnabled);
    
    await updateAlert(updatedAlert);
  }

  /// 获取活跃提醒数量
  int get activeAlertsCount {
    return state.items.where((item) => item.isEnabled).length;
  }

  /// 获取已触发提醒数量
  int get triggeredAlertsCount {
    return state.items.where((item) => item.triggeredAt != null).length;
  }

  /// 清除错误
  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// 提醒状态提供者
final alertProvider = StateNotifierProvider<AlertNotifier, AlertState>((ref) {
  final alertService = ref.read(alertServiceProvider);
  return AlertNotifier(alertService);
});

/// 未读提醒数量提供者
final unreadAlertCountProvider = Provider<int>((ref) {
  final alertState = ref.watch(alertProvider);
  return alertState.unreadCount;
});