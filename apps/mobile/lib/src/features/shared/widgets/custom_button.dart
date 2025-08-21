import 'package:flutter/material.dart';

/// 自定义按钮类型
enum CustomButtonType {
  primary,
  secondary,
  outline,
  text,
  danger,
}

/// 自定义按钮尺寸
enum CustomButtonSize {
  small,
  medium,
  large,
}

/// 自定义按钮组件
class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final CustomButtonType type;
  final CustomButtonSize size;
  final bool isLoading;
  final bool isFullWidth;
  final Widget? icon;
  final Color? backgroundColor;
  final Color? textColor;
  final BorderRadius? borderRadius;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.type = CustomButtonType.primary,
    this.size = CustomButtonSize.medium,
    this.isLoading = false,
    this.isFullWidth = false,
    this.icon,
    this.backgroundColor,
    this.textColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    // 获取按钮样式
    final buttonStyle = _getButtonStyle(theme, colorScheme);
    final textStyle = _getTextStyle(theme);
    final padding = _getPadding();
    
    Widget buttonChild = isLoading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                _getLoadingColor(colorScheme),
              ),
            ),
          )
        : Row(
            mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                icon!,
                const SizedBox(width: 8),
              ],
              Text(text, style: textStyle),
            ],
          );

    Widget button;
    
    switch (type) {
      case CustomButtonType.primary:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        );
        break;
      case CustomButtonType.secondary:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        );
        break;
      case CustomButtonType.outline:
        button = OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        );
        break;
      case CustomButtonType.text:
        button = TextButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        );
        break;
      case CustomButtonType.danger:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: buttonStyle,
          child: buttonChild,
        );
        break;
    }

    if (isFullWidth) {
      return SizedBox(
        width: double.infinity,
        child: button,
      );
    }
    
    return button;
  }

  ButtonStyle _getButtonStyle(ThemeData theme, ColorScheme colorScheme) {
    Color? bgColor = backgroundColor;
    Color? fgColor = textColor;
    
    switch (type) {
      case CustomButtonType.primary:
        bgColor ??= colorScheme.primary;
        fgColor ??= colorScheme.onPrimary;
        break;
      case CustomButtonType.secondary:
        bgColor ??= colorScheme.secondary;
        fgColor ??= colorScheme.onSecondary;
        break;
      case CustomButtonType.outline:
        bgColor ??= Colors.transparent;
        fgColor ??= colorScheme.primary;
        break;
      case CustomButtonType.text:
        bgColor ??= Colors.transparent;
        fgColor ??= colorScheme.primary;
        break;
      case CustomButtonType.danger:
        bgColor ??= colorScheme.error;
        fgColor ??= colorScheme.onError;
        break;
    }

    return ButtonStyle(
      backgroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) {
          return colorScheme.onSurface.withOpacity(0.12);
        }
        return bgColor;
      }),
      foregroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.disabled)) {
          return colorScheme.onSurface.withOpacity(0.38);
        }
        return fgColor;
      }),
      padding: WidgetStateProperty.all(_getPadding()),
      shape: WidgetStateProperty.all(
        RoundedRectangleBorder(
          borderRadius: borderRadius ?? BorderRadius.circular(8),
        ),
      ),
      side: type == CustomButtonType.outline
          ? WidgetStateProperty.all(
              BorderSide(color: fgColor ?? colorScheme.primary),
            )
          : null,
    );
  }

  TextStyle _getTextStyle(ThemeData theme) {
    TextStyle baseStyle;
    
    switch (size) {
      case CustomButtonSize.small:
        baseStyle = theme.textTheme.labelSmall ?? const TextStyle();
        break;
      case CustomButtonSize.medium:
        baseStyle = theme.textTheme.labelMedium ?? const TextStyle();
        break;
      case CustomButtonSize.large:
        baseStyle = theme.textTheme.labelLarge ?? const TextStyle();
        break;
    }
    
    return baseStyle.copyWith(
      fontWeight: FontWeight.w600,
      color: textColor,
    );
  }

  EdgeInsetsGeometry _getPadding() {
    switch (size) {
      case CustomButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 8);
      case CustomButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 12);
      case CustomButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 16);
    }
  }

  Color _getLoadingColor(ColorScheme colorScheme) {
    switch (type) {
      case CustomButtonType.primary:
        return colorScheme.onPrimary;
      case CustomButtonType.secondary:
        return colorScheme.onSecondary;
      case CustomButtonType.outline:
      case CustomButtonType.text:
        return colorScheme.primary;
      case CustomButtonType.danger:
        return colorScheme.onError;
    }
  }
}

/// 图标按钮组件
class CustomIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? color;
  final double? size;
  final String? tooltip;

  const CustomIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.color,
    this.size,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onPressed,
      icon: Icon(icon, size: size),
      color: color,
      tooltip: tooltip,
    );
  }
}