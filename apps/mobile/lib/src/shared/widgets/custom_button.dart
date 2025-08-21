import 'package:flutter/material.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final ButtonType type;
  final ButtonSize size;
  final bool isLoading;
  final Widget? icon;

  const CustomButton({
    super.key,
    required this.text,
    this.onPressed,
    this.type = ButtonType.primary,
    this.size = ButtonSize.medium,
    this.isLoading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return SizedBox(
      height: _getHeight(),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _getBackgroundColor(theme),
          foregroundColor: _getForegroundColor(theme),
          elevation: type == ButtonType.ghost ? 0 : 2,
          side: type == ButtonType.ghost 
              ? BorderSide(color: _getBorderColor(theme))
              : null,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: _getHorizontalPadding(),
            vertical: _getVerticalPadding(),
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _getForegroundColor(theme),
                  ),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: _getFontSize(),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  double _getHeight() {
    switch (size) {
      case ButtonSize.small:
        return 32;
      case ButtonSize.medium:
        return 40;
      case ButtonSize.large:
        return 48;
    }
  }

  double _getHorizontalPadding() {
    switch (size) {
      case ButtonSize.small:
        return 12;
      case ButtonSize.medium:
        return 16;
      case ButtonSize.large:
        return 20;
    }
  }

  double _getVerticalPadding() {
    switch (size) {
      case ButtonSize.small:
        return 6;
      case ButtonSize.medium:
        return 8;
      case ButtonSize.large:
        return 12;
    }
  }

  double _getFontSize() {
    switch (size) {
      case ButtonSize.small:
        return 12;
      case ButtonSize.medium:
        return 14;
      case ButtonSize.large:
        return 16;
    }
  }

  Color _getBackgroundColor(ThemeData theme) {
    switch (type) {
      case ButtonType.primary:
        return theme.primaryColor;
      case ButtonType.secondary:
        return theme.colorScheme.secondary;
      case ButtonType.success:
        return Colors.green;
      case ButtonType.danger:
        return Colors.red;
      case ButtonType.ghost:
        return Colors.transparent;
    }
  }

  Color _getForegroundColor(ThemeData theme) {
    switch (type) {
      case ButtonType.primary:
        return Colors.white;
      case ButtonType.secondary:
        return Colors.white;
      case ButtonType.success:
        return Colors.white;
      case ButtonType.danger:
        return Colors.white;
      case ButtonType.ghost:
        return theme.primaryColor;
    }
  }

  Color _getBorderColor(ThemeData theme) {
    return theme.primaryColor;
  }
}

enum ButtonType {
  primary,
  secondary,
  success,
  danger,
  ghost,
}

enum ButtonSize {
  small,
  medium,
  large,
}