// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stock_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$StockModelImpl _$$StockModelImplFromJson(Map<String, dynamic> json) =>
    _$StockModelImpl(
      symbol: json['symbol'] as String,
      name: json['name'] as String,
      currentPrice: (json['currentPrice'] as num).toDouble(),
      change: (json['change'] as num).toDouble(),
      changePercent: (json['changePercent'] as num).toDouble(),
      open: (json['open'] as num).toDouble(),
      high: (json['high'] as num).toDouble(),
      low: (json['low'] as num).toDouble(),
      previousClose: (json['previousClose'] as num).toDouble(),
      volume: (json['volume'] as num).toInt(),
      marketCap: (json['marketCap'] as num).toDouble(),
      pe: (json['pe'] as num).toDouble(),
      pb: (json['pb'] as num).toDouble(),
      updateTime: json['updateTime'] as String,
    );

Map<String, dynamic> _$$StockModelImplToJson(_$StockModelImpl instance) =>
    <String, dynamic>{
      'symbol': instance.symbol,
      'name': instance.name,
      'currentPrice': instance.currentPrice,
      'change': instance.change,
      'changePercent': instance.changePercent,
      'open': instance.open,
      'high': instance.high,
      'low': instance.low,
      'previousClose': instance.previousClose,
      'volume': instance.volume,
      'marketCap': instance.marketCap,
      'pe': instance.pe,
      'pb': instance.pb,
      'updateTime': instance.updateTime,
    };

_$KLineDataImpl _$$KLineDataImplFromJson(Map<String, dynamic> json) =>
    _$KLineDataImpl(
      time: DateTime.parse(json['time'] as String),
      open: (json['open'] as num).toDouble(),
      high: (json['high'] as num).toDouble(),
      low: (json['low'] as num).toDouble(),
      close: (json['close'] as num).toDouble(),
      volume: (json['volume'] as num).toInt(),
    );

Map<String, dynamic> _$$KLineDataImplToJson(_$KLineDataImpl instance) =>
    <String, dynamic>{
      'time': instance.time.toIso8601String(),
      'open': instance.open,
      'high': instance.high,
      'low': instance.low,
      'close': instance.close,
      'volume': instance.volume,
    };

_$TechnicalIndicatorImpl _$$TechnicalIndicatorImplFromJson(
        Map<String, dynamic> json) =>
    _$TechnicalIndicatorImpl(
      name: json['name'] as String,
      values: (json['values'] as List<dynamic>)
          .map((e) => (e as num).toDouble())
          .toList(),
    );

Map<String, dynamic> _$$TechnicalIndicatorImplToJson(
        _$TechnicalIndicatorImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
      'values': instance.values,
    };
