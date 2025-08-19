import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../widgets/bottom_navigation_bar.dart';

class MainPage extends StatelessWidget {
  const MainPage({super.key, required this.child});
  
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: const CustomBottomNavigationBar(),
      // 添加页脚免责声明
      persistentFooterButtons: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Text(
            '本应用所提供信息仅供参考，不构成投资建议',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
              fontSize: 10,
            ),
          ),
        ),
      ],
    );
  }
}