import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/providers/auth_provider.dart';
import '../../features/auth/pages/login_page.dart';
import '../../features/auth/pages/register_page.dart';
import '../../features/splash/pages/splash_page.dart';
import '../../features/main/pages/main_page.dart';
import '../../features/home/pages/home_page.dart';
import '../../features/market/pages/market_page.dart';
import '../../features/portfolio/pages/portfolio_page.dart';
import '../../features/ai/pages/ai_page.dart';
import '../../features/profile/pages/profile_page.dart';
import '../../features/stock/pages/stock_detail_page.dart';
import '../../features/watchlist/pages/watchlist_page.dart';
import '../../features/settings/pages/settings_page.dart';
import '../../features/alerts/pages/alerts_page.dart';
import 'app_routes.dart';

/// 路由配置提供者
final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    
    // 路由重定向逻辑
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final currentLocation = state.location;
      
      // 如果正在加载，显示启动页
      if (isLoading) {
        return AppRoutes.splash;
      }
      
      // 如果在启动页且已认证，跳转到主页
      if (currentLocation == AppRoutes.splash && isLoggedIn) {
        return AppRoutes.main;
      }
      
      // 如果在启动页且未认证，跳转到登录页
      if (currentLocation == AppRoutes.splash && !isLoggedIn) {
        return AppRoutes.login;
      }
      
      // 如果未认证且不在认证相关页面，跳转到登录页
      if (!isLoggedIn && !_isAuthRoute(currentLocation)) {
        return AppRoutes.login;
      }
      
      // 如果已认证且在认证相关页面，跳转到主页
      if (isLoggedIn && _isAuthRoute(currentLocation)) {
        return AppRoutes.main;
      }
      
      return null; // 不需要重定向
    },
    
    routes: [
      // 启动页
      GoRoute(
        path: AppRoutes.splash,
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      
      // 认证相关路由
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      
      GoRoute(
        path: AppRoutes.register,
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),
      
      // 主页面路由（包含底部导航）
      ShellRoute(
        builder: (context, state, child) => MainPage(child: child),
        routes: [
          // 首页
          GoRoute(
            path: AppRoutes.home,
            name: 'home',
            builder: (context, state) => const HomePage(),
          ),
          
          // 市场
          GoRoute(
            path: AppRoutes.market,
            name: 'market',
            builder: (context, state) => const MarketPage(),
          ),
          
          // 投资组合
          GoRoute(
            path: AppRoutes.portfolio,
            name: 'portfolio',
            builder: (context, state) => const PortfolioPage(),
          ),
          
          // 自选股
          GoRoute(
            path: AppRoutes.watchlist,
            name: 'watchlist',
            builder: (context, state) => const WatchlistPage(),
          ),
          
          // AI 分析
          GoRoute(
            path: AppRoutes.ai,
            name: 'ai',
            builder: (context, state) => const AiPage(),
          ),
          
          // 提醒
          GoRoute(
            path: '/alerts',
            name: 'alerts',
            builder: (context, state) => const AlertsPage(),
          ),
          
          // 个人中心
          GoRoute(
            path: AppRoutes.profile,
            name: 'profile',
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
      
      // 主页面（重定向到首页）
      GoRoute(
        path: AppRoutes.main,
        name: 'main',
        redirect: (context, state) => AppRoutes.home,
      ),
      
      // 股票详情页
      GoRoute(
        path: '${AppRoutes.stockDetail}/:symbol',
        name: 'stock_detail',
        builder: (context, state) {
          final symbol = state.pathParameters['symbol']!;
          return StockDetailPage(symbol: symbol);
        },
      ),
      

      
      // 设置页面
      GoRoute(
        path: AppRoutes.settings,
        name: 'settings',
        builder: (context, state) => const SettingsPage(),
      ),
    ],
    
    // 错误页面
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(
        title: const Text('页面未找到'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              '页面未找到',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              '请检查网址是否正确',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.home),
              child: const Text('返回首页'),
            ),
          ],
        ),
      ),
    ),
  );
});

/// 判断是否为认证相关路由
bool _isAuthRoute(String location) {
  return location == AppRoutes.login || 
         location == AppRoutes.register ||
         location == AppRoutes.splash;
}

/// 路由扩展方法
extension GoRouterExtension on GoRouter {
  /// 清除堆栈并导航到指定路由
  void goAndClearStack(String location) {
    while (canPop()) {
      pop();
    }
    go(location);
  }
  
  /// 安全的返回操作
  void safePop([dynamic result]) {
    if (canPop()) {
      pop(result);
    } else {
      go(AppRoutes.home);
    }
  }
}

/// 路由观察者（用于调试和分析）
class AppRouteObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    debugPrint('路由推入: ${route.settings.name}');
  }
  
  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    debugPrint('路由弹出: ${route.settings.name}');
  }
  
  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    debugPrint('路由替换: ${oldRoute?.settings.name} -> ${newRoute?.settings.name}');
  }
}