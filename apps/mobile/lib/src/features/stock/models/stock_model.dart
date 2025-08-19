import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'stock_model.freezed.dart';
part 'stock_model.g.dart';

@freezed
class StockModel with _$StockModel {
  const factory StockModel({
    required String symbol,
    required String name,
    required double currentPrice,
    required double change,
    required double changePercent,
    required double open,
    required double high,
    required double low,
    required double previousClose,
    required int volume,
    required double marketCap,
    required double pe,
    required double pb,
    required String updateTime,
  }) = _StockModel;

  factory StockModel.fromJson(Map<String, dynamic> json) =>
      _$StockModelFromJson(json);
}

@freezed
class KLineData with _$KLineData {
  const factory KLineData({
    required DateTime time,
    required double open,
    required double high,
    required double low,
    required double close,
    required int volume,
  }) = _KLineData;

  factory KLineData.fromJson(Map<String, dynamic> json) =>
      _$KLineDataFromJson(json);
}

@freezed
class TechnicalIndicator with _$TechnicalIndicator {
  const factory TechnicalIndicator({
    required String name,
    required List<double> values,
    required Color color,
  }) = _TechnicalIndicator;

  factory TechnicalIndicator.fromJson(Map<String, dynamic> json) =>
      _$TechnicalIndicatorFromJson(json);
}

enum ChartPeriod {
  minute,
  daily,
  weekly,
  monthly,
}

enum IndicatorType {
  ma5,
  ma10,
  ma20,
  ma60,
  macd,
  kdj,
  rsi,
}

extension ChartPeriodExtension on ChartPeriod {
  String get displayName {
    switch (this) {
      case ChartPeriod.minute:
        return '分时';
      case ChartPeriod.daily:
        return '日K';
      case ChartPeriod.weekly:
        return '周K';
      case ChartPeriod.monthly:
        return '月K';
    }
  }
  
  String get apiValue {
    switch (this) {
      case ChartPeriod.minute:
        return '1m';
      case ChartPeriod.daily:
        return '1d';
      case ChartPeriod.weekly:
        return '1w';
      case ChartPeriod.monthly:
        return '1M';
    }
  }
}

extension IndicatorTypeExtension on IndicatorType {
  String get displayName {
    switch (this) {
      case IndicatorType.ma5:
        return 'MA5';
      case IndicatorType.ma10:
        return 'MA10';
      case IndicatorType.ma20:
        return 'MA20';
      case IndicatorType.ma60:
        return 'MA60';
      case IndicatorType.macd:
        return 'MACD';
      case IndicatorType.kdj:
        return 'KDJ';
      case IndicatorType.rsi:
        return 'RSI';
    }
  }
  
  Color get color {
    switch (this) {
      case IndicatorType.ma5:
        return const Color(0xFFFFFFFF); // 白色
      case IndicatorType.ma10:
        return const Color(0xFFFFEB3B); // 黄色
      case IndicatorType.ma20:
        return const Color(0xFFE91E63); // 粉色
      case IndicatorType.ma60:
        return const Color(0xFF9C27B0); // 紫色
      case IndicatorType.macd:
        return const Color(0xFF2196F3); // 蓝色
      case IndicatorType.kdj:
        return const Color(0xFF4CAF50); // 绿色
      case IndicatorType.rsi:
        return const Color(0xFFFF9800); // 橙色
    }
  }
}