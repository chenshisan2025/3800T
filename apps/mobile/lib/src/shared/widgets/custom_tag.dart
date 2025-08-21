import 'package:flutter/material.dart';
import 'custom_card.dart';

class CustomTag extends StatelessWidget {
  final String text;
  final TagType type;
  final TagSize size;
  final VoidCallback? onTap;
  final VoidCallback? onClose;
  final bool isSelected;
  final Color? customColor;

  const CustomTag({
    super.key,
    required this.text,
    this.type = TagType.default_,
    this.size = TagSize.medium,
    this.onTap,
    this.onClose,
    this.isSelected = false,
    this.customColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    Widget tagContent = Container(
      padding: EdgeInsets.symmetric(
        horizontal: _getHorizontalPadding(),
        vertical: _getVerticalPadding(),
      ),
      decoration: BoxDecoration(
        color: _getBackgroundColor(theme),
        borderRadius: BorderRadius.circular(_getBorderRadius()),
        border: Border.all(
          color: _getBorderColor(theme),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            text,
            style: TextStyle(
              fontSize: _getFontSize(),
              color: _getTextColor(theme),
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
          if (onClose != null) ...[
            const SizedBox(width: 4),
            GestureDetector(
              onTap: onClose,
              child: Icon(
                Icons.close,
                size: _getFontSize() + 2,
                color: _getTextColor(theme),
              ),
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      tagContent = GestureDetector(
        onTap: onTap,
        child: tagContent,
      );
    }

    return tagContent;
  }

  double _getHorizontalPadding() {
    switch (size) {
      case TagSize.small:
        return 8;
      case TagSize.medium:
        return 12;
      case TagSize.large:
        return 16;
    }
  }

  double _getVerticalPadding() {
    switch (size) {
      case TagSize.small:
        return 4;
      case TagSize.medium:
        return 6;
      case TagSize.large:
        return 8;
    }
  }

  double _getFontSize() {
    switch (size) {
      case TagSize.small:
        return 10;
      case TagSize.medium:
        return 12;
      case TagSize.large:
        return 14;
    }
  }

  double _getBorderRadius() {
    switch (size) {
      case TagSize.small:
        return 12;
      case TagSize.medium:
        return 14;
      case TagSize.large:
        return 16;
    }
  }

  Color _getBackgroundColor(ThemeData theme) {
    if (customColor != null) {
      return isSelected ? customColor! : customColor!.withOpacity(0.1);
    }

    switch (type) {
      case TagType.default_:
        return isSelected ? theme.primaryColor : theme.primaryColor.withOpacity(0.1);
      case TagType.success:
        return isSelected ? Colors.green : Colors.green.withOpacity(0.1);
      case TagType.warning:
        return isSelected ? Colors.orange : Colors.orange.withOpacity(0.1);
      case TagType.danger:
        return isSelected ? Colors.red : Colors.red.withOpacity(0.1);
      case TagType.info:
        return isSelected ? Colors.blue : Colors.blue.withOpacity(0.1);
      case TagType.rise:
        final riseColor = theme.extension<StockColors>()?.riseColor ?? Colors.red;
        return isSelected ? riseColor : riseColor.withOpacity(0.1);
      case TagType.fall:
        final fallColor = theme.extension<StockColors>()?.fallColor ?? Colors.green;
        return isSelected ? fallColor : fallColor.withOpacity(0.1);
    }
  }

  Color _getBorderColor(ThemeData theme) {
    if (customColor != null) {
      return customColor!;
    }

    switch (type) {
      case TagType.default_:
        return theme.primaryColor;
      case TagType.success:
        return Colors.green;
      case TagType.warning:
        return Colors.orange;
      case TagType.danger:
        return Colors.red;
      case TagType.info:
        return Colors.blue;
      case TagType.rise:
        return theme.extension<StockColors>()?.riseColor ?? Colors.red;
      case TagType.fall:
        return theme.extension<StockColors>()?.fallColor ?? Colors.green;
    }
  }

  Color _getTextColor(ThemeData theme) {
    if (customColor != null) {
      return isSelected ? Colors.white : customColor!;
    }

    switch (type) {
      case TagType.default_:
        return isSelected ? Colors.white : theme.primaryColor;
      case TagType.success:
        return isSelected ? Colors.white : Colors.green;
      case TagType.warning:
        return isSelected ? Colors.white : Colors.orange;
      case TagType.danger:
        return isSelected ? Colors.white : Colors.red;
      case TagType.info:
        return isSelected ? Colors.white : Colors.blue;
      case TagType.rise:
        final riseColor = theme.extension<StockColors>()?.riseColor ?? Colors.red;
        return isSelected ? Colors.white : riseColor;
      case TagType.fall:
        final fallColor = theme.extension<StockColors>()?.fallColor ?? Colors.green;
        return isSelected ? Colors.white : fallColor;
    }
  }
}


// 股票标签组件
class StockTag extends StatelessWidget {
  const StockTag({
    required this.text,
    required this.isRise,
    super.key,
    this.size = TagSize.medium,
    this.onTap,
  });

  final String text;
  final bool isRise;
  final TagSize size;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return CustomTag(
      text: text,
      type: isRise ? TagType.rise : TagType.fall,
      size: size,
      onTap: onTap,
    );
  }
}

enum TagType {
  default_,
  success,
  warning,
  danger,
  info,
  rise,
  fall,
}

enum TagSize {
  small,
  medium,
  large,
}