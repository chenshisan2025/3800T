import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../../../core/constants/app_strings.dart';

class CustomBottomNavigationBar extends StatelessWidget {
  const CustomBottomNavigationBar({super.key});

  @override
  Widget build(BuildContext context) {
    final currentLocation = GoRouterState.of(context).location;
    
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _getCurrentIndex(currentLocation),
        onTap: (index) => _onTabTapped(context, index),
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey[600],
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            label: AppStrings.home,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.star_outline),
            activeIcon: const Icon(Icons.star),
            label: AppStrings.watchlist,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.smart_toy_outlined),
            activeIcon: const Icon(Icons.smart_toy),
            label: AppStrings.aiAnalysis,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.notifications_outlined),
            activeIcon: const Icon(Icons.notifications),
            label: AppStrings.alerts,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: AppStrings.profile,
          ),
        ],
      ),
    );
  }

  int _getCurrentIndex(String location) {
    switch (location) {
      case AppRoutes.home:
        return 0;
      case AppRoutes.watchlist:
        return 1;
      case AppRoutes.ai:
        return 2;
      case '/alerts': // 提醒页面路由
        return 3;
      case AppRoutes.profile:
        return 4;
      default:
        return 0;
    }
  }

  void _onTabTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRoutes.home);
        break;
      case 1:
        context.go(AppRoutes.watchlist);
        break;
      case 2:
        context.go(AppRoutes.ai);
        break;
      case 3:
        context.go('/alerts'); // 提醒页面路由
        break;
      case 4:
        context.go(AppRoutes.profile);
        break;
    }
  }
}