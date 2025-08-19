import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 按钮类型枚举
enum AppButtonType {
  primary,
  secondary,
  outline,
  text,
  danger,
}

/// 按钮尺寸枚举
enum AppButtonSize {
  small,
  medium,
  large,
}

/// 应用通用按钮组件
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.type = AppButtonType.primary,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
    this.width,
    this.height,
  });

  final String text;
  final VoidCallback? onPressed;
  final AppButtonType type;
  final AppButtonSize size;
  final bool isLoading;
  final bool isDisabled;
  final IconData? icon;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return SizedBox(
      width: width,
      height: height ?? _getButtonHeight(),
      child: _buildButton(context, isDark),
    );
  }

  Widget _buildButton(BuildContext context, bool isDark) {
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    
    switch (type) {
      case AppButtonType.primary:
        return ElevatedButton(
          onPressed: isEnabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: _getBackgroundColor(isDark),
            foregroundColor: _getForegroundColor(isDark),
            elevation: 0,
            padding: _getPadding(),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: _getTextStyle(),
          ),
          child: _buildButtonContent(),
        );
        
      case AppButtonType.secondary:
        return ElevatedButton(
          onPressed: isEnabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: isDark ? AppTheme.secondaryColor : Colors.grey.shade100,
            foregroundColor: isDark ? Colors.white : AppTheme.textPrimaryColor,
            elevation: 0,
            padding: _getPadding(),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: _getTextStyle(),
          ),
          child: _buildButtonContent(),
        );
        
      case AppButtonType.outline:
        return OutlinedButton(
          onPressed: isEnabled ? onPressed : null,
          style: OutlinedButton.styleFrom(
            foregroundColor: _getOutlineColor(isDark),
            side: BorderSide(color: _getOutlineColor(isDark)),
            padding: _getPadding(),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: _getTextStyle(),
          ),
          child: _buildButtonContent(),
        );
        
      case AppButtonType.text:
        return TextButton(
          onPressed: isEnabled ? onPressed : null,
          style: TextButton.styleFrom(
            foregroundColor: _getTextButtonColor(isDark),
            padding: _getPadding(),
            textStyle: _getTextStyle(),
          ),
          child: _buildButtonContent(),
        );
        
      case AppButtonType.danger:
        return ElevatedButton(
          onPressed: isEnabled ? onPressed : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.errorColor,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: _getPadding(),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: _getTextStyle(),
          ),
          child: _buildButtonContent(),
        );
    }
  }

  Widget _buildButtonContent() {
    if (isLoading) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: _getIconSize(),
            height: _getIconSize(),
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                type == AppButtonType.outline || type == AppButtonType.text
                    ? AppTheme.primaryColor
                    : Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _getIconSize()),
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    return Text(text);
  }

  double _getButtonHeight() {
    switch (size) {
      case AppButtonSize.small:
        return 32;
      case AppButtonSize.medium:
        return 40;
      case AppButtonSize.large:
        return 48;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case AppButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
      case AppButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal:16, vertical: 8);
      case AppButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 12);
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case AppButtonSize.small:
        return const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        );
      case AppButtonSize.medium:
        return const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        );
      case AppButtonSize.large:
        return const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        );
    }
  }

  double _getIconSize() {
    switch (size) {
      case AppButtonSize.small:
        return 14;
      case AppButtonSize.medium:
        return 16;
      case AppButtonSize.large:
        return 18;
    }
  }

  Color _getBackgroundColor(bool isDark) {
    if (isDisabled) {
      return isDark ? Colors.grey.shade700 : Colors.grey.shade300;
    }
    return AppTheme.primaryColor;
  }

  Color _getForegroundColor(bool isDark) {
    if (isDisabled) {
      return isDark ? Colors.grey.shade500 : Colors.grey.shade500;
    }
    return Colors.white;
  }

  Color _getOutlineColor(bool isDark) {
    if (isDisabled) {
      return isDark ? Colors.grey.shade600 : Colors.grey.shade400;
    }
    return AppTheme.primaryColor;
  }

  Color _getTextButtonColor(bool isDark) {
    if (isDisabled) {
      return isDark ? Colors.grey.shade600 : Colors.grey.shade400;
    }
    return AppTheme.primaryColor;
  }
}

/// 股票专用按钮组件
class StockButton extends StatelessWidget {
  const StockButton({
    super.key,
    required this.text,
    required this.onPressed,
    required this.isRise,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.isDisabled = false,
    this.icon,
  });

  final String text;
  final VoidCallback? onPressed;
  final bool isRise; // true为涨(红色)，false为跌(绿色)
  final AppButtonSize size;
  final bool isLoading;
  final bool isDisabled;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isEnabled = !isDisabled && !isLoading && onPressed != null;
    
    final backgroundColor = isRise ? AppTheme.riseColor : AppTheme.fallColor;
    final foregroundColor = Colors.white;
    
    return SizedBox(
      height: _getButtonHeight(),
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: isEnabled ? backgroundColor : Colors.grey.shade400,
          foregroundColor: foregroundColor,
          elevation: 0,
          padding: _getPadding(),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: _getTextStyle(),
        ),
        child: _buildButtonContent(),
      ),
    );
  }

  Widget _buildButtonContent() {
    if (isLoading) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: _getIconSize(),
            height: _getIconSize(),
            child: const CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _getIconSize()),
          const SizedBox(width: 8),
          Text(text),
        ],
      );
    }

    return Text(text);
  }

  double _getButtonHeight() {
    switch (size) {
      case AppButtonSize.small:
        return 32;
      case AppButtonSize.medium:
        return 40;
      case AppButtonSize.large:
        return 48;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case AppButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
      case AppButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case AppButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 12);
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case AppButtonSize.small:
        return const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        );
      case AppButtonSize.medium:
        return const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        );
      case AppButtonSize.large:
        return const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        );
    }
  }

  double _getIconSize() {
    switch (size) {
      case AppButtonSize.small:
        return 14;
      case AppButtonSize.medium:
        return 16;
      case AppButtonSize.large:
        return 18;
    }
  }
}