import 'package:freezed_annotation/freezed_annotation.dart';

import '../../alerts/models/alert_model.dart';

part 'watchlist_model.freezed.dart';
part 'watchlist_model.g.dart';

/// 自选股项目
@freezed
class WatchlistItem with _$WatchlistItem {
  const factory WatchlistItem({
    required String symbol,
    required String name,
    required MarketType market,
    required DateTime addedAt,
    @Default(0) int sortOrder,
    StockQuote? quote,
  }) = _WatchlistItem;

  factory WatchlistItem.fromJson(Map<String, dynamic> json) =>
      _$WatchlistItemFromJson(json);
}

/// 股票报价信息
@freezed
class StockQuote with _$StockQuote {
  const factory StockQuote({
    required String symbol,
    required double price,
    required double change,
    required double changePercent,
    required double open,
    required double high,
    required double low,
    required double previousClose,
    required int volume,
    required DateTime updateTime,
  }) = _StockQuote;

  factory StockQuote.fromJson(Map<String, dynamic> json) =>
      _$StockQuoteFromJson(json);
}

/// 价格提醒
@freezed
class PriceAlert with _$PriceAlert {
  const factory PriceAlert({
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
  }) = _PriceAlert;

  factory PriceAlert.fromJson(Map<String, dynamic> json) =>
      _$PriceAlertFromJson(json);

  // copyWith方法由freezed自动生成，不需要手动定义
}

/// 市场类型
enum MarketType {
  sh,   // 上海证券交易所
  sz,   // 深圳证券交易所
  gem,  // 创业板
  star, // 科创板
}

// AlertType枚举已在alerts/models/alert_model.dart中定义

/// 市场类型扩展
extension MarketTypeExtension on MarketType {
  String get displayName {
    switch (this) {
      case MarketType.sh:
        return '沪市';
      case MarketType.sz:
        return '深市';
      case MarketType.gem:
        return '创业板';
      case MarketType.star:
        return '科创板';
    }
  }
  
  String get code {
    switch (this) {
      case MarketType.sh:
        return 'SH';
      case MarketType.sz:
        return 'SZ';
      case MarketType.gem:
        return 'GEM';
      case MarketType.star:
        return 'STAR';
    }
  }
}

// AlertType扩展已在alerts/models/alert_model.dart中定义