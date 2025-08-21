// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'watchlist_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$WatchlistItemImpl _$$WatchlistItemImplFromJson(Map<String, dynamic> json) =>
    _$WatchlistItemImpl(
      symbol: json['symbol'] as String,
      name: json['name'] as String,
      market: $enumDecode(_$MarketTypeEnumMap, json['market']),
      addedAt: DateTime.parse(json['addedAt'] as String),
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      quote: json['quote'] == null
          ? null
          : StockQuote.fromJson(json['quote'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$WatchlistItemImplToJson(_$WatchlistItemImpl instance) =>
    <String, dynamic>{
      'symbol': instance.symbol,
      'name': instance.name,
      'market': _$MarketTypeEnumMap[instance.market]!,
      'addedAt': instance.addedAt.toIso8601String(),
      'sortOrder': instance.sortOrder,
      'quote': instance.quote,
    };

const _$MarketTypeEnumMap = {
  MarketType.sh: 'sh',
  MarketType.sz: 'sz',
  MarketType.gem: 'gem',
  MarketType.star: 'star',
};

_$StockQuoteImpl _$$StockQuoteImplFromJson(Map<String, dynamic> json) =>
    _$StockQuoteImpl(
      symbol: json['symbol'] as String,
      price: (json['price'] as num).toDouble(),
      change: (json['change'] as num).toDouble(),
      changePercent: (json['changePercent'] as num).toDouble(),
      open: (json['open'] as num).toDouble(),
      high: (json['high'] as num).toDouble(),
      low: (json['low'] as num).toDouble(),
      previousClose: (json['previousClose'] as num).toDouble(),
      volume: (json['volume'] as num).toInt(),
      updateTime: DateTime.parse(json['updateTime'] as String),
    );

Map<String, dynamic> _$$StockQuoteImplToJson(_$StockQuoteImpl instance) =>
    <String, dynamic>{
      'symbol': instance.symbol,
      'price': instance.price,
      'change': instance.change,
      'changePercent': instance.changePercent,
      'open': instance.open,
      'high': instance.high,
      'low': instance.low,
      'previousClose': instance.previousClose,
      'volume': instance.volume,
      'updateTime': instance.updateTime.toIso8601String(),
    };

_$PriceAlertImpl _$$PriceAlertImplFromJson(Map<String, dynamic> json) =>
    _$PriceAlertImpl(
      id: json['id'] as String,
      symbol: json['symbol'] as String,
      name: json['name'] as String,
      type: $enumDecode(_$AlertTypeEnumMap, json['type']),
      targetPrice: (json['targetPrice'] as num).toDouble(),
      currentPrice: (json['currentPrice'] as num).toDouble(),
      isEnabled: json['isEnabled'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      triggeredAt: json['triggeredAt'] == null
          ? null
          : DateTime.parse(json['triggeredAt'] as String),
      note: json['note'] as String?,
    );

Map<String, dynamic> _$$PriceAlertImplToJson(_$PriceAlertImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'symbol': instance.symbol,
      'name': instance.name,
      'type': _$AlertTypeEnumMap[instance.type]!,
      'targetPrice': instance.targetPrice,
      'currentPrice': instance.currentPrice,
      'isEnabled': instance.isEnabled,
      'createdAt': instance.createdAt.toIso8601String(),
      'triggeredAt': instance.triggeredAt?.toIso8601String(),
      'note': instance.note,
    };

const _$AlertTypeEnumMap = {
  AlertType.priceUp: 'price_up',
  AlertType.priceDown: 'price_down',
  AlertType.changeUp: 'change_up',
  AlertType.changeDown: 'change_down',
};
