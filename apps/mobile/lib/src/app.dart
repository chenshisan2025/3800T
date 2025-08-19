import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'shared/widgets/main_page.dart';
import 'features/home/pages/home_page.dart';
import 'features/watchlist/pages/watchlist_page.dart';
import 'features/ai/pages/ai_page.dart';
import 'features/alerts/pages/alerts_page.dart';
import 'features/profile/pages/profile_page.dart';
import 'features/stock/pages/stock_detail_page.dart';
import 'core/theme/app_theme.dart';

class GulingtongApp extends StatelessWidget {
  const GulingtongApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: '股灵通',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

final GoRouter _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainPage(child: child),
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomePage(),
        ),
        GoRoute(
          path: '/watchlist',
          builder: (context, state) => const WatchlistPage(),
        ),
        GoRoute(
          path: '/ai',
          builder: (context, state) => const AiPage(),
        ),
        GoRoute(
          path: '/alerts',
          builder: (context, state) => const AlertsPage(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfilePage(),
        ),
      ],
    ),
    GoRoute(
      path: '/stock/:symbol',
      builder: (context, state) {
        final symbol = state.pathParameters['symbol']!;
        return StockDetailPage(symbol: symbol);
      },
    ),
  ],
);