import 'package:flutter/material.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('我的'),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            child: const Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.grey,
                  child: Icon(
                    Icons.person,
                    size: 30,
                    color: Colors.white,
                  ),
                ),
                SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '未登录',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '点击登录',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: ListView(
              children: const [
                ListTile(
                  leading: Icon(Icons.settings),
                  title: Text('设置'),
                  trailing: Icon(Icons.chevron_right),
                ),
                ListTile(
                  leading: Icon(Icons.help_outline),
                  title: Text('帮助'),
                  trailing: Icon(Icons.chevron_right),
                ),
                ListTile(
                  leading: Icon(Icons.info_outline),
                  title: Text('关于'),
                  trailing: Icon(Icons.chevron_right),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}