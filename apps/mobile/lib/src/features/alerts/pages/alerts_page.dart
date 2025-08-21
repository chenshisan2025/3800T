import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../core/constants/app_strings.dart';
import '../models/alert_model.dart';
import '../providers/alert_provider.dart';
import '../widgets/alert_item.dart';
import '../widgets/alert_empty.dart';
import '../widgets/create_alert_dialog.dart';

class AlertsPage extends ConsumerStatefulWidget {
  const AlertsPage({super.key});

  @override
  ConsumerState<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends ConsumerState<AlertsPage> {
  @override
  void initState() {
    super.initState();
    // 页面加载时刷新提醒列表
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(alertProvider.notifier).loadAlerts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final alertState = ref.watch(alertProvider);
    final alertNotifier = ref.read(alertProvider.notifier);
    
    // 未登录状态
    if (authState.value == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(AppStrings.priceAlerts),
        ),
        body: const Center(
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
                AppStrings.loginToSetPriceAlerts,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Text(AppStrings.priceAlerts),
            if (alertState.unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${alertState.unreadCount}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (alertState.items.isNotEmpty) ...[
            if (alertState.isEditMode) ...[
              // 编辑模式下的操作按钮
              TextButton(
                onPressed: alertNotifier.toggleSelectAll,
                child: Text(
                  alertState.selectedItems.length == alertState.items.length
                      ? AppStrings.deselectAll
                      : AppStrings.selectAll,
                ),
              ),
              IconButton(
                onPressed: alertState.selectedItems.isNotEmpty
                    ? () => _showDeleteConfirmDialog(context, alertNotifier)
                    : null,
                icon: const Icon(Icons.delete),
                tooltip: AppStrings.deleteSelected,
              ),
              TextButton(
                onPressed: alertNotifier.toggleEditMode,
                child: const Text(AppStrings.done),
              ),
            ] else ...[
              // 正常模式下的操作按钮
              IconButton(
                onPressed: () => _showCreateAlertDialog(context),
                icon: const Icon(Icons.add),
                tooltip: AppStrings.addAlert,
              ),
              if (alertState.items.isNotEmpty)
                IconButton(
                  onPressed: alertNotifier.toggleEditMode,
                  icon: const Icon(Icons.edit),
                  tooltip: AppStrings.edit,
                ),
            ],
          ],
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => alertNotifier.loadAlerts(),
        child: _buildBody(context, alertState, alertNotifier),
      ),
      floatingActionButton: alertState.items.isEmpty && !alertState.isLoading
          ? FloatingActionButton(
              onPressed: () => _showCreateAlertDialog(context),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildBody(
    BuildContext context,
    AlertState state,
    AlertNotifier notifier,
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
              onPressed: () {
                notifier.clearError();
                notifier.loadAlerts();
              },
              child: Text(AppStrings.retry),
            ),
          ],
        ),
      );
    }

    if (state.items.isEmpty) {
      return AlertEmpty(
        onCreateAlert: () => _showCreateAlertDialog(context),
        onBrowseWatchlist: () => context.go('/watchlist'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.items.length,
      itemBuilder: (context, index) {
        final alert = state.items[index];
        return AlertItemWidget(
          key: ValueKey(alert.id),
          alert: alert,
          isEditMode: state.isEditMode,
          isSelected: state.selectedItems.contains(alert.id),
          onTap: state.isEditMode
              ? () => notifier.toggleItemSelection(alert.id)
              : () => _handleAlertTap(context, alert, notifier),
          onLongPress: state.isEditMode
              ? null
              : () => _showAlertOptions(context, alert, notifier),
        );
      },
    );
  }

  void _showCreateAlertDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const CreateAlertDialog(),
    );
  }

  void _showDeleteConfirmDialog(
    BuildContext context,
    AlertNotifier notifier,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(AppStrings.deleteAlert),
        content: Text('${AppStrings.confirmDeleteSelected} ${notifier.state.selectedItems.length} ${AppStrings.alertsUnit}？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(AppStrings.cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              notifier.deleteSelectedAlerts();
            },
            child: const Text(
              AppStrings.delete,
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  void _handleAlertTap(
    BuildContext context,
    AlertItem alert,
    AlertNotifier notifier,
  ) {
    // 标记为已读
    if (!alert.isRead) {
      notifier.markAsRead(alert.id);
    }
    
    // 跳转到股票详情页
    context.go('/stock/${alert.symbol}');
  }

  void _showAlertOptions(
    BuildContext context,
    AlertItem alert,
    AlertNotifier notifier,
  ) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(
                alert.isEnabled ? Icons.notifications_off : Icons.notifications,
              ),
              title: Text(alert.isEnabled ? AppStrings.disableAlert : AppStrings.enableAlert),
              onTap: () {
                Navigator.of(context).pop();
                notifier.toggleAlertEnabled(alert.id);
              },
            ),
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text(AppStrings.editAlert),
              onTap: () {
                Navigator.of(context).pop();
                _showEditAlertDialog(context, alert);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.red),
              title: const Text(
                AppStrings.deleteAlert,
                style: TextStyle(color: Colors.red),
              ),
              onTap: () {
                Navigator.of(context).pop();
                _showSingleDeleteConfirmDialog(context, alert, notifier);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditAlertDialog(BuildContext context, AlertItem alert) {
    showDialog(
      context: context,
      builder: (context) => CreateAlertDialog(alert: alert),
    );
  }

  void _showSingleDeleteConfirmDialog(
    BuildContext context,
    AlertItem alert,
    AlertNotifier notifier,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(AppStrings.deleteAlert),
        content: Text('${AppStrings.confirmDeleteAlert}「${alert.name}」${AppStrings.priceAlertQuestion}？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text(AppStrings.cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              notifier.deleteAlert(alert.id);
            },
            child: const Text(
              AppStrings.delete,
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}