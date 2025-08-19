import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainPage extends StatelessWidget {
  const MainPage({
    required this.child,
    required this.currentIndex,
    super.key,
  });

  final Widget child;
  final int currentIndex;
  
  static final List<String> _routes = [
    '/',
    '/watchlist',
    '/ai',
    '/alerts',
    '/profile',
  ];
  
  void _onItemTapped(BuildContext context, int index) {
    if (index != currentIndex) {
      context.go(_routes[index]);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.grey[100],
            child: const Text(
              '本应用仅供参考，不构成投资建议',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          BottomNavigationBar(
            currentIndex: currentIndex,
            onTap: (index) => _onItemTapped(context, index),
            type: BottomNavigationBarType.fixed,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home),
                label: '首页',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.star),
                label: '自选',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.psychology),
                label: 'AI分析',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.notifications),
                label: '提醒',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: '我的',
              ),
            ],
          ),
        ],
      ),
    );
  }
}