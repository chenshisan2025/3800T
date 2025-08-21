import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'shared/widgets/main_page.dart';
import 'features/home/pages/home_page.dart';
import 'features/market/pages/market_page.dart';
import 'features/watchlist/pages/watchlist_page.dart';
import 'features/ai/pages/ai_page.dart';
import 'features/alerts/pages/alerts_page.dart';
import 'features/profile/pages/profile_page.dart';
import 'features/stock/pages/stock_detail_page.dart';
import 'core/services/theme_service.dart' as theme_service;
import 'core/constants/app_strings.dart';

// 主题提供者
final themeServiceProvider = Provider<theme_service.ThemeService>((ref) => theme_service.ThemeService());

final themeNotifierProvider = StateNotifierProvider<ThemeNotifier, theme_service.ThemeMode>(
  (ref) => ThemeNotifier(ref.read(themeServiceProvider)),
);

class ThemeNotifier extends StateNotifier<theme_service.ThemeMode> {
  final theme_service.ThemeService _themeService;
  
  ThemeNotifier(this._themeService) : super(theme_service.ThemeMode.system) {
    _init();
  }
  
  void _init() async {
    await _themeService.initialize();
    state = _themeService.currentTheme;
    _themeService.themeNotifier.addListener(() {
      state = _themeService.currentTheme;
    });
  }
  
  Future<void> setThemeMode(theme_service.ThemeMode themeMode) async {
    await _themeService.setThemeMode(themeMode);
    state = themeMode;
  }
  
  Future<void> toggleTheme() async {
    await _themeService.toggleTheme();
    state = _themeService.currentTheme;
  }
}

class GulingtongApp extends ConsumerWidget {
  const GulingtongApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeNotifierProvider);
    
    return MaterialApp.router(
      title: AppStrings.appName,
      theme: theme_service.ThemeService.lightTheme,
      darkTheme: theme_service.ThemeService.darkTheme,
      themeMode: _convertThemeMode(themeMode),
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
  
  /// 转换主题模式
  ThemeMode _convertThemeMode(theme_service.ThemeMode customThemeMode) {
    switch (customThemeMode) {
      case theme_service.ThemeMode.light:
        return ThemeMode.light;
      case theme_service.ThemeMode.dark:
        return ThemeMode.dark;
      case theme_service.ThemeMode.system:
        return ThemeMode.system;
    }
  }
}

final GoRouter _router = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        // 根据当前路径确定底部导航栏的索引
        int currentIndex = 0;
        final location = state.uri.path;
        if (location == '/') {
          currentIndex = 0;
        } else if (location == '/market') {
          currentIndex = 1;
        } else if (location == '/ai') {
          currentIndex = 2;
        } else if (location == '/watchlist') {
          currentIndex = 3;
        } else if (location == '/profile') {
          currentIndex = 4;
        }
        return MainPage(child: child, currentIndex: currentIndex);
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomePage(),
        ),
        GoRoute(
          path: '/market',
          builder: (context, state) => const MarketPage(),
        ),
        GoRoute(
          path: '/ai',
          builder: (context, state) => const AiPage(),
        ),
        GoRoute(
          path: '/watchlist',
          builder: (context, state) => const WatchlistPage(),
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