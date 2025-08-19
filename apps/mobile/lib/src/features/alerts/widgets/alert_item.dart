import 'package:flutter/material.dart';

enum AlertType {
  price,
  news,
  earnings,
}

class AlertItem extends StatelessWidget {
  const AlertItem({
    super.key,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.type,
    this.isRead = false,
  });

  final String title;
  final String subtitle;
  final String time;
  final AlertType type;
  final bool isRead;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isRead ? Theme.of(context).cardColor : Theme.of(context).primaryColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRead ? Colors.grey.withOpacity(0.2) : Theme.of(context).primaryColor.withOpacity(0.3),
        ),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getTypeColor().withOpacity(0.1),
          child: Icon(
            _getTypeIcon(),
            color: _getTypeColor(),
            size: 20,
          ),
        ),
        title: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.grey[600],
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              time,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
            if (!isRead) ..[
              const SizedBox(height: 4),
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
        onTap: () {
          // 处理点击事件
        },
      ),
    );
  }

  Color _getTypeColor() {
    switch (type) {
      case AlertType.price:
        return Colors.blue;
      case AlertType.news:
        return Colors.green;
      case AlertType.earnings:
        return Colors.orange;
    }
  }

  IconData _getTypeIcon() {
    switch (type) {
      case AlertType.price:
        return Icons.trending_up;
      case AlertType.news:
        return Icons.article;
      case AlertType.earnings:
        return Icons.assessment;
    }
  }
}