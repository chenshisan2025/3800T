import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/providers/auth_provider.dart';
import '../models/watchlist_model.dart';
import '../providers/watchlist_provider.dart';
import '../widgets/price_alert_dialog.dart';

class PriceAlertsPage extends ConsumerStatefulWidget {
  const PriceAlertsPage({super.key});

  @override
  ConsumerState<PriceAlertsPage> createState() => _PriceAlertsPageState();
}

class _PriceAlertsPageState extends ConsumerState<PriceAlertsPage> {
  @override
  void initState() {
    super.initState();
    // 页面初始化时加载价格提醒
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authProvider);
      if (authState.isAuthenticated) {
        ref.read(priceAlertsProvider.notifier).loadAlerts();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final alertsState = ref.watch(priceAlertsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('价格提醒'),
        actions: [
          if (authState.isAuthenticated && alertsState.alerts.isNotEmpty)
            IconButton(
              onPressed: _showAddAlertDialog,
              icon: const Icon(Icons.add),
              tooltip: '添加提醒',
            ),
        ],
      ),
      body: _buildBody(authState, alertsState),
      floatingActionButton: authState.isAuthenticated && alertsState.alerts.isNotEmpty
          ? FloatingActionButton(
              onPressed: _showAddAlertDialog,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildBody(AuthState authState, PriceAlertsState alertsState) {
    // 未登录状态
    if (!authState.isAuthenticated) {
      return _buildNotLoggedIn();
    }

    // 加载中状态
    if (alertsState.isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    // 错误状态
    if (alertsState.error != null) {
      return _buildError(alertsState.error!);
    }

    // 空状态
    if (alertsState.alerts.isEmpty) {
      return _buildEmpty();
    }

    // 提醒列表
    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(priceAlertsProvider.notifier).loadAlerts();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: alertsState.alerts.length,
        itemBuilder: (context, index) {
          final alert = alertsState.alerts[index];
          return _buildAlertItem(alert);
        },
      ),
    );
  }

  Widget _buildNotLoggedIn() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_off,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              '请先登录',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '登录后可以设置价格提醒\n及时获取股价变化通知',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                context.go('/profile/login');
              },
              child: const Text('立即登录'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              '加载失败',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              error,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                ref.read(priceAlertsProvider.notifier).loadAlerts();
              },
              child: const Text('重试'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 24),
            Text(
              '暂无价格提醒',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '设置价格提醒，当股价达到目标价时\n我们会及时通知您',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[500],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _showAddAlertDialog,
              icon: const Icon(Icons.add),
              label: const Text('添加提醒'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertItem(PriceAlert alert) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        alert.stockName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        alert.stockSymbol,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: alert.isEnabled,
                  onChanged: (value) {
                    ref.read(priceAlertsProvider.notifier).toggleAlert(
                      alert.id,
                      value,
                    );
                  },
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    switch (value) {
                      case 'edit':
                        _showEditAlertDialog(alert);
                        break;
                      case 'delete':
                        _showDeleteConfirmDialog(alert);
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit, size: 20),
                          SizedBox(width: 8),
                          Text('编辑'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, size: 20, color: Colors.red),
                          SizedBox(width: 8),
                          Text('删除', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    alert.type == AlertType.priceUp
                        ? Icons.trending_up
                        : Icons.trending_down,
                    color: alert.type == AlertType.priceUp
                        ? Colors.red
                        : Colors.green,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    alert.type == AlertType.priceUp ? '涨到' : '跌到',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '¥${alert.targetPrice.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: alert.type == AlertType.priceUp
                          ? Colors.red
                          : Colors.green,
                    ),
                  ),
                ],
              ),
            ),
            if (alert.note.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                '备注：${alert.note}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              '创建时间：${_formatDateTime(alert.createdAt)}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddAlertDialog() {
    showDialog(
      context: context,
      builder: (context) => const PriceAlertDialog(),
    );
  }

  void _showEditAlertDialog(PriceAlert alert) {
    showDialog(
      context: context,
      builder: (context) => PriceAlertDialog(
        alert: alert,
      ),
    );
  }

  void _showDeleteConfirmDialog(PriceAlert alert) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除提醒'),
        content: Text('确定要删除「${alert.stockName}」的价格提醒吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(priceAlertsProvider.notifier).removeAlert(alert.id);
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} '
        '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}