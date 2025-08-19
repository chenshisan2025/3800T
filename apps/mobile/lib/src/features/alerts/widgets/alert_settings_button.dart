import 'package:flutter/material.dart';

class AlertSettingsButton extends StatelessWidget {
  const AlertSettingsButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.settings),
      onPressed: () {
        _showSettingsBottomSheet(context);
      },
    );
  }

  void _showSettingsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '提醒设置',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            _buildSettingItem(
              context,
              '价格提醒',
              '股价达到设定值时提醒',
              Icons.trending_up,
              true,
            ),
            _buildSettingItem(
              context,
              '新闻提醒',
              '重要新闻发布时提醒',
              Icons.article,
              true,
            ),
            _buildSettingItem(
              context,
              '财报提醒',
              '财报发布时提醒',
              Icons.assessment,
              false,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('确定'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingItem(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    bool isEnabled,
  ) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).primaryColor),
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.grey[600],
        ),
      ),
      trailing: Switch(
        value: isEnabled,
        onChanged: (value) {
          // 处理开关状态变化
        },
      ),
    );
  }
}