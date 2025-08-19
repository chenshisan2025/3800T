import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Toast类型枚举
enum AppToastType {
  success,
  error,
  warning,
  info,
}

/// Toast位置枚举
enum AppToastPosition {
  top,
  center,
  bottom,
}

/// 应用Toast管理器
class AppToast {
  static OverlayEntry? _overlayEntry;
  static bool _isShowing = false;

  /// 显示成功Toast
  static void showSuccess(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 2),
    AppToastPosition position = AppToastPosition.top,
  }) {
    _showToast(
      context,
      message,
      AppToastType.success,
      duration: duration,
      position: position,
    );
  }

  /// 显示错误Toast
  static void showError(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 3),
    AppToastPosition position = AppToastPosition.top,
  }) {
    _showToast(
      context,
      message,
      AppToastType.error,
      duration: duration,
      position: position,
    );
  }

  /// 显示警告Toast
  static void showWarning(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 2),
    AppToastPosition position = AppToastPosition.top,
  }) {
    _showToast(
      context,
      message,
      AppToastType.warning,
      duration: duration,
      position: position,
    );
  }

  /// 显示信息Toast
  static void showInfo(
    BuildContext context,
    String message, {
    Duration duration = const Duration(seconds: 2),
    AppToastPosition position = AppToastPosition.top,
  }) {
    _showToast(
      context,
      message,
      AppToastType.info,
      duration: duration,
      position: position,
    );
  }

  /// 显示自定义Toast
  static void show(
    BuildContext context,
    String message, {
    AppToastType type = AppToastType.info,
    Duration duration = const Duration(seconds: 2),
    AppToastPosition position = AppToastPosition.top,
    IconData? icon,
    Color? backgroundColor,
    Color? textColor,
  }) {
    _showToast(
      context,
      message,
      type,
      duration: duration,
      position: position,
      icon: icon,
      backgroundColor: backgroundColor,
      textColor: textColor,
    );
  }

  /// 隐藏Toast
  static void hide() {
    if (_isShowing && _overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
      _isShowing = false;
    }
  }

  static void _showToast(
    BuildContext context,
    String message,
    AppToastType type, {
    Duration duration = const Duration(seconds: 2),
    AppToastPosition position = AppToastPosition.top,
    IconData? icon,
    Color? backgroundColor,
    Color? textColor,
  }) {
    // 如果已经有Toast在显示，先隐藏
    if (_isShowing) {
      hide();
    }

    final overlay = Overlay.of(context);
    _overlayEntry = OverlayEntry(
      builder: (context) => _ToastWidget(
        message: message,
        type: type,
        position: position,
        icon: icon,
        backgroundColor: backgroundColor,
        textColor: textColor,
      ),
    );

    overlay.insert(_overlayEntry!);
    _isShowing = true;

    // 自动隐藏
    Future.delayed(duration, () {
      hide();
    });
  }
}

/// Toast组件
class _ToastWidget extends StatefulWidget {
  const _ToastWidget({
    required this.message,
    required this.type,
    required this.position,
    this.icon,
    this.backgroundColor,
    this.textColor,
  });

  final String message;
  final AppToastType type;
  final AppToastPosition position;
  final IconData? icon;
  final Color? backgroundColor;
  final Color? textColor;

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _slideAnimation = Tween<Offset>(
      begin: _getInitialOffset(),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Offset _getInitialOffset() {
    switch (widget.position) {
      case AppToastPosition.top:
        return const Offset(0, -1);
      case AppToastPosition.center:
        return const Offset(0, 0);
      case AppToastPosition.bottom:
        return const Offset(0, 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final mediaQuery = MediaQuery.of(context);
    
    return Positioned(
      top: _getTopPosition(mediaQuery),
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: _getBackgroundColor(isDark),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getIcon(),
                    color: _getTextColor(isDark),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.message,
                      style: TextStyle(
                        color: _getTextColor(isDark),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  double? _getTopPosition(MediaQueryData mediaQuery) {
    switch (widget.position) {
      case AppToastPosition.top:
        return mediaQuery.padding.top + 16;
      case AppToastPosition.center:
        return (mediaQuery.size.height - 60) / 2;
      case AppToastPosition.bottom:
        return mediaQuery.size.height - mediaQuery.padding.bottom - 80;
    }
  }

  Color _getBackgroundColor(bool isDark) {
    if (widget.backgroundColor != null) return widget.backgroundColor!;

    switch (widget.type) {
      case AppToastType.success:
        return AppTheme.successColor;
      case AppToastType.error:
        return AppTheme.errorColor;
      case AppToastType.warning:
        return AppTheme.warningColor;
      case AppToastType.info:
        return isDark ? const Color(0xFF2D3748) : const Color(0xFF4A5568);
    }
  }

  Color _getTextColor(bool isDark) {
    if (widget.textColor != null) return widget.textColor!;

    switch (widget.type) {
      case AppToastType.success:
      case AppToastType.error:
      case AppToastType.warning:
        return Colors.white;
      case AppToastType.info:
        return Colors.white;
    }
  }

  IconData _getIcon() {
    if (widget.icon != null) return widget.icon!;

    switch (widget.type) {
      case AppToastType.success:
        return Icons.check_circle;
      case AppToastType.error:
        return Icons.error;
      case AppToastType.warning:
        return Icons.warning;
      case AppToastType.info:
        return Icons.info;
    }
  }
}

/// 股票专用Toast扩展
class StockToast {
  /// 显示买入成功Toast
  static void showBuySuccess(
    BuildContext context,
    String symbol,
    double price,
  ) {
    AppToast.showSuccess(
      context,
      '买入 $symbol 成功，价格：¥${price.toStringAsFixed(2)}',
      duration: const Duration(seconds: 3),
    );
  }

  /// 显示卖出成功Toast
  static void showSellSuccess(
    BuildContext context,
    String symbol,
    double price,
  ) {
    AppToast.showSuccess(
      context,
      '卖出 $symbol 成功，价格：¥${price.toStringAsFixed(2)}',
      duration: const Duration(seconds: 3),
    );
  }

  /// 显示添加自选成功Toast
  static void showAddToWatchlistSuccess(
    BuildContext context,
    String symbol,
  ) {
    AppToast.showSuccess(
      context,
      '$symbol 已添加到自选',
    );
  }

  /// 显示移除自选成功Toast
  static void showRemoveFromWatchlistSuccess(
    BuildContext context,
    String symbol,
  ) {
    AppToast.showInfo(
      context,
      '$symbol 已从自选中移除',
    );
  }

  /// 显示价格提醒设置成功Toast
  static void showPriceAlertSuccess(
    BuildContext context,
    String symbol,
    double price,
  ) {
    AppToast.showSuccess(
      context,
      '$symbol 价格提醒已设置：¥${price.toStringAsFixed(2)}',
    );
  }

  /// 显示网络错误Toast
  static void showNetworkError(BuildContext context) {
    AppToast.showError(
      context,
      '网络连接失败，请检查网络设置',
      duration: const Duration(seconds: 3),
    );
  }

  /// 显示数据加载失败Toast
  static void showDataLoadError(BuildContext context) {
    AppToast.showError(
      context,
      '数据加载失败，请稍后重试',
    );
  }

  /// 显示登录提示Toast
  static void showLoginRequired(BuildContext context) {
    AppToast.showWarning(
      context,
      '请先登录后再进行此操作',
    );
  }

  /// 显示市场休市提示Toast
  static void showMarketClosed(BuildContext context) {
    AppToast.showInfo(
      context,
      '当前市场已休市，数据可能有延迟',
      duration: const Duration(seconds: 3),
    );
  }
}

/// 简化的Toast调用方法
extension ToastExtension on BuildContext {
  void showSuccessToast(String message) {
    AppToast.showSuccess(this, message);
  }

  void showErrorToast(String message) {
    AppToast.showError(this, message);
  }

  void showWarningToast(String message) {
    AppToast.showWarning(this, message);
  }

  void showInfoToast(String message) {
    AppToast.showInfo(this, message);
  }
}