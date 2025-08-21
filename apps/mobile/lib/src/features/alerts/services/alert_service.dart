import 'dart:convert';

import '../../../core/services/network_service.dart';
import '../../../core/services/storage_service.dart';
import '../models/alert_model.dart';

class AlertService {
  final NetworkService _networkService;
  final StorageService _storageService;
  
  static const String _alertsKey = 'alerts';
  
  AlertService({
    required NetworkService networkService,
    required StorageService storageService,
  }) : _networkService = networkService,
       _storageService = storageService;

  /// 获取所有提醒
  Future<List<AlertItem>> getAlerts() async {
    try {
      // 尝试从服务器获取
      final response = await _networkService.get('/alerts');
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300 && response.data != null) {
        final List<dynamic> alertsJson = response.data['alerts'] ?? [];
        final alerts = alertsJson
            .map((json) => AlertItem.fromJson(json))
            .toList();
        
        // 缓存到本地
        await _cacheAlerts(alerts);
        return alerts;
      }
    } catch (e) {
      print('Failed to fetch alerts from server: $e');
    }
    
    // 从本地缓存获取
    return await _getCachedAlerts();
  }

  /// 创建提醒
  Future<AlertItem> createAlert({
    required String symbol,
    required String name,
    required AlertType type,
    required double targetPrice,
    required double currentPrice,
    String? note,
  }) async {
    final alertData = {
      'symbol': symbol,
      'name': name,
      'type': type.name,
      'target_price': targetPrice,
      'current_price': currentPrice,
      'note': note,
    };

    try {
      // 发送到服务器
      final response = await _networkService.post('/alerts', data: alertData);
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300 && response.data != null) {
        final alert = AlertItem.fromJson(response.data['alert']);
        
        // 更新本地缓存
        await _addToCache(alert);
        return alert;
      }
    } catch (e) {
      print('Failed to create alert on server: $e');
    }
    
    // 创建本地提醒
    final alert = AlertItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      symbol: symbol,
      name: name,
      type: type,
      targetPrice: targetPrice,
      currentPrice: currentPrice,
      isEnabled: true,
      createdAt: DateTime.now(),
      note: note,
    );
    
    await _addToCache(alert);
    return alert;
  }

  /// 更新提醒
  Future<AlertItem> updateAlert(AlertItem alert) async {
    try {
      // 发送到服务器
      final response = await _networkService.put(
        '/alerts/${alert.id}',
        data: alert.toJson(),
      );
      if (response.statusCode != null && response.statusCode! >= 200 && response.statusCode! < 300 && response.data != null) {
        final updatedAlert = AlertItem.fromJson(response.data['alert']);
        
        // 更新本地缓存
        await _updateInCache(updatedAlert);
        return updatedAlert;
      }
    } catch (e) {
      print('Failed to update alert on server: $e');
    }
    
    // 更新本地缓存
    await _updateInCache(alert);
    return alert;
  }

  /// 删除提醒
  Future<void> deleteAlert(String alertId) async {
    try {
      // 从服务器删除
      await _networkService.delete('/alerts/$alertId');
    } catch (e) {
      print('Failed to delete alert from server: $e');
    }
    
    // 从本地缓存删除
    await _removeFromCache(alertId);
  }

  /// 批量删除提醒
  Future<void> deleteMultipleAlerts(List<String> alertIds) async {
    try {
      // 从服务器批量删除
      await _networkService.delete('/alerts/batch', data: {
        'alert_ids': alertIds,
      });
    } catch (e) {
      print('Failed to delete alerts from server: $e');
    }
    
    // 从本地缓存删除
    for (final alertId in alertIds) {
      await _removeFromCache(alertId);
    }
  }

  /// 标记提醒为已读
  Future<void> markAsRead(String alertId) async {
    try {
      await _networkService.patch('/alerts/$alertId/read');
    } catch (e) {
      print('Failed to mark alert as read on server: $e');
    }
    
    // 更新本地缓存
    final alerts = await _getCachedAlerts();
    final updatedAlerts = alerts.map((alert) {
      if (alert.id == alertId) {
        return alert.copyWith(isRead: true);
      }
      return alert;
    }).toList();
    
    await _cacheAlerts(updatedAlerts);
  }

  /// 获取未读提醒数量
  Future<int> getUnreadCount() async {
    final alerts = await getAlerts();
    return alerts.where((alert) => !alert.isRead).length;
  }

  // 私有方法：缓存管理
  Future<List<AlertItem>> _getCachedAlerts() async {
    try {
      final alertsJson = await _storageService.getStringList(_alertsKey);
      if (alertsJson != null) {
        return alertsJson
            .map((json) => AlertItem.fromJson(jsonDecode(json)))
            .toList();
      }
    } catch (e) {
      print('Failed to get cached alerts: $e');
    }
    return [];
  }

  Future<void> _cacheAlerts(List<AlertItem> alerts) async {
    try {
      final alertsJson = alerts
          .map((alert) => jsonEncode(alert.toJson()))
          .toList();
      await _storageService.setStringList(_alertsKey, alertsJson);
    } catch (e) {
      print('Failed to cache alerts: $e');
    }
  }

  Future<void> _addToCache(AlertItem alert) async {
    final alerts = await _getCachedAlerts();
    alerts.add(alert);
    await _cacheAlerts(alerts);
  }

  Future<void> _updateInCache(AlertItem updatedAlert) async {
    final alerts = await _getCachedAlerts();
    final index = alerts.indexWhere((alert) => alert.id == updatedAlert.id);
    if (index != -1) {
      alerts[index] = updatedAlert;
      await _cacheAlerts(alerts);
    }
  }

  Future<void> _removeFromCache(String alertId) async {
    final alerts = await _getCachedAlerts();
    alerts.removeWhere((alert) => alert.id == alertId);
    await _cacheAlerts(alerts);
  }
}