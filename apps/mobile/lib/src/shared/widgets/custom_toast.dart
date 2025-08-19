import 'dart:async';
import 'package:flutter/material.dart';

class CustomToast {
  static OverlayEntry? _overlayEntry;
  static bool _isShowing = false;

  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
    ToastPosition position = ToastPosition.bottom,
  }) {
    if (_isShowing) {
      hide();
    }

    _isShowing = true;
    _overlayEntry = OverlayEntry(
      builder: (context) => _ToastWidget(
        message: message,
        type: type,
        position: position,
        onDismiss: hide,
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);

    Timer(duration, hide);
  }

  static void hide() {
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
      _isShowing = false;
    }
  }

  // 便捷方法
  static void success(BuildContext context, String message) {
    show(context, message: message, type: ToastType.success);
  }

  static void error(BuildContext context, String message) {
    show(context, message: message, type: ToastType.error);
  }

  static void warning(BuildContext context, String message) {
    show(context, message: message, type: ToastType.warning);
  }

  static void info(BuildContext context, String message) {
    show(context, message: message, type: ToastType.info);
  }
}

class _ToastWidget extends StatefulWidget {
  const _ToastWidget({
    required this.message,
    required this.type,
    required this.position,
    required this.onDismiss,
  });

  final String message;
  final ToastType type;
  final ToastPosition position;
  final VoidCallback onDismiss;

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
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ),);

    _slideAnimation = Tween<Offset>(
      begin: widget.position == ToastPosition.top
          ? const Offset(0, -1)
          : const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ),);

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Positioned(
      top: widget.position == ToastPosition.top ? 50 : null,
      bottom: widget.position == ToastPosition.bottom ? 100 : null,
      left: 16,
      right: 16,
      child: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: _getBackgroundColor(theme),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
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
                        color: _getIconColor(theme),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.message,
                          style: TextStyle(
                            color: _getTextColor(theme),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          _animationController.reverse().then((_) {
                            widget.onDismiss();
                          });
                        },
                        child: Icon(
                          Icons.close,
                          color: _getTextColor(theme).withValues(alpha: 0.7),
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getBackgroundColor(ThemeData theme) {
    switch (widget.type) {
      case ToastType.success:
        return Colors.green.shade50;
      case ToastType.error:
        return Colors.red.shade50;
      case ToastType.warning:
        return Colors.orange.shade50;
      case ToastType.info:
        return theme.colorScheme.surface;
    }
  }

  Color _getIconColor(ThemeData theme) {
    switch (widget.type) {
      case ToastType.success:
        return Colors.green;
      case ToastType.error:
        return Colors.red;
      case ToastType.warning:
        return Colors.orange;
      case ToastType.info:
        return theme.primaryColor;
    }
  }

  Color _getTextColor(ThemeData theme) {
    switch (widget.type) {
      case ToastType.success:
        return Colors.green.shade800;
      case ToastType.error:
        return Colors.red.shade800;
      case ToastType.warning:
        return Colors.orange.shade800;
      case ToastType.info:
        return theme.textTheme.bodyMedium?.color ?? Colors.black87;
    }
  }

  IconData _getIcon() {
    switch (widget.type) {
      case ToastType.success:
        return Icons.check_circle;
      case ToastType.error:
        return Icons.error;
      case ToastType.warning:
        return Icons.warning;
      case ToastType.info:
        return Icons.info;
    }
  }
}

enum ToastType {
  success,
  error,
  warning,
  info,
}

enum ToastPosition {
  top,
  bottom,
}