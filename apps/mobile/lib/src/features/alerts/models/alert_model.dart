import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'alert_model.freezed.dart';
part 'alert_model.g.dart';

/// 提醒项
@freezed
class AlertItem with _$AlertItem {
  const factory AlertItem({
    required String id,
    required String symbol,
    required String name,
    required AlertType type,
    required double targetPrice,
    required double currentPrice,
    required bool isEnabled,
    required DateTime createdAt,
    DateTime? triggeredAt,
    String? note,
    @Default(false) bool isRead,
  }) = _AlertItem;

  factory AlertItem.fromJson(Map<String, dynamic> json) =>
      _$AlertItemFromJson(json);
}

/// 提醒类型
enum AlertType {
  @JsonValue('price_up')
  priceUp,   // 价格上涨至
  @JsonValue('price_down')
  priceDown, // 价格下跌至
  @JsonValue('change_up')
  changeUp,  // 涨幅达到
  @JsonValue('change_down')
  changeDown, // 跌幅达到
}

/// 提醒类型扩展
extension AlertTypeExtension on AlertType {
  String get displayName {
    switch (this) {
      case AlertType.priceUp:
        return '涨到';
      case AlertType.priceDown:
        return '跌到';
      case AlertType.changeUp:
        return '涨幅达到';
      case AlertType.changeDown:
        return '跌幅达到';
    }
  }
  
  String get description {
    switch (this) {
      case AlertType.priceUp:
        return '价格上涨至目标价';
      case AlertType.priceDown:
        return '价格下跌至目标价';
      case AlertType.changeUp:
        return '涨幅达到目标百分比';
      case AlertType.changeDown:
        return '跌幅达到目标百分比';
    }
  }
  
  String get symbol {
    switch (this) {
      case AlertType.priceUp:
        return '≥';
      case AlertType.priceDown:
        return '≤';
      case AlertType.changeUp:
        return '+%';
      case AlertType.changeDown:
        return '-%';
    }
  }
  
  IconData get icon {
    switch (this) {
      case AlertType.priceUp:
        return Icons.trending_up;
      case AlertType.priceDown:
        return Icons.trending_down;
      case AlertType.changeUp:
        return Icons.arrow_upward;
      case AlertType.changeDown:
        return Icons.arrow_downward;
    }
  }
  
  Color get color {
    switch (this) {
      case AlertType.priceUp:
      case AlertType.changeUp:
        return Colors.red;
      case AlertType.priceDown:
      case AlertType.changeDown:
        return Colors.green;
    }
  }
}