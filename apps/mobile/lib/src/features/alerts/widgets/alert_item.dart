import 'package:flutter/material.dart';
import '../../../core/constants/app_strings.dart';
import '../models/alert_model.dart';

class AlertItemWidget extends StatelessWidget {
  final AlertItem alert;
  final bool isEditMode;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const AlertItemWidget({
    super.key,
    required this.alert,
    this.isEditMode = false,
    this.isSelected = false,
    this.onTap,
    this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: isSelected ? 4 : 1,
      color: isSelected 
          ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
          : null,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // 选择框（编辑模式）
              if (isEditMode) ...[
                Checkbox(
                  value: isSelected,
                  onChanged: (_) => onTap?.call(),
                ),
                const SizedBox(width: 12),
              ],
              
              // 提醒类型图标
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: alert.type.color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  alert.type.icon,
                  color: alert.type.color,
                  size: 24,
                ),
              ),
              
              const SizedBox(width: 16),
              
              // 主要内容
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 股票名称和代码
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${alert.name} (${alert.symbol})',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: alert.isRead ? FontWeight.normal : FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (!alert.isRead && !isEditMode)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.error,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    
                    const SizedBox(height: 4),
                    
                    // 提醒描述
                    Text(
                      _getAlertDescription(),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    
                    const SizedBox(height: 4),
                    
                    // 价格信息
                    Row(
                      children: [
                        Text(
                          '${AppStrings.current}: \$${alert.currentPrice.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(width: 16),
                        Text(
                          '${AppStrings.target}: ${_getTargetPriceText()}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: alert.type.color,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    
                    if (alert.note != null && alert.note!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        alert.note!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                          fontStyle: FontStyle.italic,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    
                    const SizedBox(height: 8),
                    
                    // 底部信息
                    Row(
                      children: [
                        // 创建时间
                        Icon(
                          Icons.access_time,
                          size: 14,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatTime(alert.createdAt),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[500],
                          ),
                        ),
                        
                        const Spacer(),
                        
                        // 启用状态
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: alert.isEnabled 
                                ? Colors.green.withOpacity(0.1)
                                : Colors.grey.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            alert.isEnabled ? AppStrings.enabled : AppStrings.disabled,
                            style: TextStyle(
                              fontSize: 12,
                              color: alert.isEnabled ? Colors.green : Colors.grey,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getAlertDescription() {
    switch (alert.type) {
      case AlertType.priceUp:
        return AppStrings.priceUpAlertDesc;
      case AlertType.priceDown:
        return AppStrings.priceDownAlertDesc;
      case AlertType.changeUp:
        return AppStrings.changeUpAlertDesc;
      case AlertType.changeDown:
        return AppStrings.changeDownAlertDesc;
    }
  }

  String _getTargetPriceText() {
    switch (alert.type) {
      case AlertType.priceUp:
      case AlertType.priceDown:
        return '\$${alert.targetPrice.toStringAsFixed(2)}';
      case AlertType.changeUp:
      case AlertType.changeDown:
        return '${alert.targetPrice.toStringAsFixed(1)}%';
    }
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays > 0) {
      return AppStrings.daysAgo(difference.inDays);
    } else if (difference.inHours > 0) {
      return AppStrings.hoursAgo(difference.inHours);
    } else if (difference.inMinutes > 0) {
      return AppStrings.minutesAgo(difference.inMinutes);
    } else {
      return AppStrings.justNow;
    }
  }
}