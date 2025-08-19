/// 应用路由常量定义
class AppRoutes {
  AppRoutes._();
  
  // 启动和认证相关
  static const String splash = '/splash';
  static const String login = '/login';
  static const String register = '/register';
  
  // 主要页面
  static const String main = '/main';
  static const String home = '/home';
  static const String market = '/market';
  static const String portfolio = '/portfolio';
  static const String ai = '/ai';
  static const String profile = '/profile';
  
  // 功能页面
  static const String stockDetail = '/stock';
  static const String watchlist = '/watchlist';
  static const String settings = '/settings';
  static const String search = '/search';
  static const String news = '/news';
  static const String newsDetail = '/news/detail';
  static const String analysis = '/analysis';
  static const String tradingHistory = '/trading-history';
  static const String notifications = '/notifications';
  static const String help = '/help';
  static const String about = '/about';
  static const String privacy = '/privacy';
  static const String terms = '/terms';
  
  // 账户相关
  static const String accountSettings = '/account/settings';
  static const String securitySettings = '/account/security';
  static const String notificationSettings = '/account/notifications';
  static const String themeSettings = '/account/theme';
  
  // 交易相关
  static const String trade = '/trade';
  static const String buyStock = '/trade/buy';
  static const String sellStock = '/trade/sell';
  static const String orderHistory = '/orders';
  static const String orderDetail = '/orders/detail';
  
  // AI 相关
  static const String aiChat = '/ai/chat';
  static const String aiReports = '/ai/reports';
  static const String aiReportDetail = '/ai/reports/detail';
  static const String aiInsights = '/ai/insights';
  
  // 市场相关
  static const String marketSectors = '/market/sectors';
  static const String marketIndices = '/market/indices';
  static const String marketHotStocks = '/market/hot';
  static const String marketGainers = '/market/gainers';
  static const String marketLosers = '/market/losers';
  
  // 投资组合相关
  static const String portfolioAnalysis = '/portfolio/analysis';
  static const String portfolioPerformance = '/portfolio/performance';
  static const String portfolioRisk = '/portfolio/risk';
  
  /// 获取所有路由列表
  static List<String> get allRoutes => [
    splash,
    login,
    register,
    main,
    home,
    market,
    portfolio,
    ai,
    profile,
    stockDetail,
    watchlist,
    settings,
    search,
    news,
    newsDetail,
    analysis,
    tradingHistory,
    notifications,
    help,
    about,
    privacy,
    terms,
    accountSettings,
    securitySettings,
    notificationSettings,
    themeSettings,
    trade,
    buyStock,
    sellStock,
    orderHistory,
    orderDetail,
    aiChat,
    aiReports,
    aiReportDetail,
    aiInsights,
    marketSectors,
    marketIndices,
    marketHotStocks,
    marketGainers,
    marketLosers,
    portfolioAnalysis,
    portfolioPerformance,
    portfolioRisk,
  ];
  
  /// 获取底部导航栏路由
  static List<String> get bottomNavRoutes => [
    home,
    market,
    portfolio,
    ai,
    profile,
  ];
  
  /// 获取需要认证的路由
  static List<String> get authenticatedRoutes => [
    main,
    home,
    market,
    portfolio,
    ai,
    profile,
    stockDetail,
    watchlist,
    settings,
    search,
    analysis,
    tradingHistory,
    notifications,
    accountSettings,
    securitySettings,
    notificationSettings,
    themeSettings,
    trade,
    buyStock,
    sellStock,
    orderHistory,
    orderDetail,
    aiChat,
    aiReports,
    aiReportDetail,
    aiInsights,
    marketSectors,
    marketIndices,
    marketHotStocks,
    marketGainers,
    marketLosers,
    portfolioAnalysis,
    portfolioPerformance,
    portfolioRisk,
  ];
  
  /// 获取公开路由（无需认证）
  static List<String> get publicRoutes => [
    splash,
    login,
    register,
    news,
    newsDetail,
    help,
    about,
    privacy,
    terms,
  ];
  
  /// 判断路由是否需要认证
  static bool requiresAuth(String route) {
    return authenticatedRoutes.contains(route);
  }
  
  /// 判断路由是否为底部导航路由
  static bool isBottomNavRoute(String route) {
    return bottomNavRoutes.contains(route);
  }
  
  /// 获取股票详情路由
  static String getStockDetailRoute(String symbol) {
    return '$stockDetail/$symbol';
  }
  
  /// 获取新闻详情路由
  static String getNewsDetailRoute(String newsId) {
    return '$newsDetail/$newsId';
  }
  
  /// 获取订单详情路由
  static String getOrderDetailRoute(String orderId) {
    return '$orderDetail/$orderId';
  }
  
  /// 获取AI报告详情路由
  static String getAiReportDetailRoute(String reportId) {
    return '$aiReportDetail/$reportId';
  }
}

/// 路由参数常量
class RouteParams {
  RouteParams._();
  
  static const String symbol = 'symbol';
  static const String newsId = 'newsId';
  static const String orderId = 'orderId';
  static const String reportId = 'reportId';
  static const String userId = 'userId';
  static const String stockId = 'stockId';
  static const String portfolioId = 'portfolioId';
}

/// 路由查询参数常量
class RouteQuery {
  RouteQuery._();
  
  static const String tab = 'tab';
  static const String page = 'page';
  static const String limit = 'limit';
  static const String sort = 'sort';
  static const String filter = 'filter';
  static const String search = 'search';
  static const String category = 'category';
  static const String type = 'type';
  static const String from = 'from';
  static const String to = 'to';
  static const String period = 'period';
}