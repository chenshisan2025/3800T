// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'watchlist_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

WatchlistItem _$WatchlistItemFromJson(Map<String, dynamic> json) {
  return _WatchlistItem.fromJson(json);
}

/// @nodoc
mixin _$WatchlistItem {
  String get symbol => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  MarketType get market => throw _privateConstructorUsedError;
  DateTime get addedAt => throw _privateConstructorUsedError;
  int get sortOrder => throw _privateConstructorUsedError;
  StockQuote? get quote => throw _privateConstructorUsedError;

  /// Serializes this WatchlistItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of WatchlistItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $WatchlistItemCopyWith<WatchlistItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $WatchlistItemCopyWith<$Res> {
  factory $WatchlistItemCopyWith(
          WatchlistItem value, $Res Function(WatchlistItem) then) =
      _$WatchlistItemCopyWithImpl<$Res, WatchlistItem>;
  @useResult
  $Res call(
      {String symbol,
      String name,
      MarketType market,
      DateTime addedAt,
      int sortOrder,
      StockQuote? quote});

  $StockQuoteCopyWith<$Res>? get quote;
}

/// @nodoc
class _$WatchlistItemCopyWithImpl<$Res, $Val extends WatchlistItem>
    implements $WatchlistItemCopyWith<$Res> {
  _$WatchlistItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of WatchlistItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
    Object? name = null,
    Object? market = null,
    Object? addedAt = null,
    Object? sortOrder = null,
    Object? quote = freezed,
  }) {
    return _then(_value.copyWith(
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      market: null == market
          ? _value.market
          : market // ignore: cast_nullable_to_non_nullable
              as MarketType,
      addedAt: null == addedAt
          ? _value.addedAt
          : addedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      sortOrder: null == sortOrder
          ? _value.sortOrder
          : sortOrder // ignore: cast_nullable_to_non_nullable
              as int,
      quote: freezed == quote
          ? _value.quote
          : quote // ignore: cast_nullable_to_non_nullable
              as StockQuote?,
    ) as $Val);
  }

  /// Create a copy of WatchlistItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $StockQuoteCopyWith<$Res>? get quote {
    if (_value.quote == null) {
      return null;
    }

    return $StockQuoteCopyWith<$Res>(_value.quote!, (value) {
      return _then(_value.copyWith(quote: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$WatchlistItemImplCopyWith<$Res>
    implements $WatchlistItemCopyWith<$Res> {
  factory _$$WatchlistItemImplCopyWith(
          _$WatchlistItemImpl value, $Res Function(_$WatchlistItemImpl) then) =
      __$$WatchlistItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String symbol,
      String name,
      MarketType market,
      DateTime addedAt,
      int sortOrder,
      StockQuote? quote});

  @override
  $StockQuoteCopyWith<$Res>? get quote;
}

/// @nodoc
class __$$WatchlistItemImplCopyWithImpl<$Res>
    extends _$WatchlistItemCopyWithImpl<$Res, _$WatchlistItemImpl>
    implements _$$WatchlistItemImplCopyWith<$Res> {
  __$$WatchlistItemImplCopyWithImpl(
      _$WatchlistItemImpl _value, $Res Function(_$WatchlistItemImpl) _then)
      : super(_value, _then);

  /// Create a copy of WatchlistItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
    Object? name = null,
    Object? market = null,
    Object? addedAt = null,
    Object? sortOrder = null,
    Object? quote = freezed,
  }) {
    return _then(_$WatchlistItemImpl(
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      market: null == market
          ? _value.market
          : market // ignore: cast_nullable_to_non_nullable
              as MarketType,
      addedAt: null == addedAt
          ? _value.addedAt
          : addedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      sortOrder: null == sortOrder
          ? _value.sortOrder
          : sortOrder // ignore: cast_nullable_to_non_nullable
              as int,
      quote: freezed == quote
          ? _value.quote
          : quote // ignore: cast_nullable_to_non_nullable
              as StockQuote?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$WatchlistItemImpl implements _WatchlistItem {
  const _$WatchlistItemImpl(
      {required this.symbol,
      required this.name,
      required this.market,
      required this.addedAt,
      this.sortOrder = 0,
      this.quote});

  factory _$WatchlistItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$WatchlistItemImplFromJson(json);

  @override
  final String symbol;
  @override
  final String name;
  @override
  final MarketType market;
  @override
  final DateTime addedAt;
  @override
  @JsonKey()
  final int sortOrder;
  @override
  final StockQuote? quote;

  @override
  String toString() {
    return 'WatchlistItem(symbol: $symbol, name: $name, market: $market, addedAt: $addedAt, sortOrder: $sortOrder, quote: $quote)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$WatchlistItemImpl &&
            (identical(other.symbol, symbol) || other.symbol == symbol) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.market, market) || other.market == market) &&
            (identical(other.addedAt, addedAt) || other.addedAt == addedAt) &&
            (identical(other.sortOrder, sortOrder) ||
                other.sortOrder == sortOrder) &&
            (identical(other.quote, quote) || other.quote == quote));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, symbol, name, market, addedAt, sortOrder, quote);

  /// Create a copy of WatchlistItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$WatchlistItemImplCopyWith<_$WatchlistItemImpl> get copyWith =>
      __$$WatchlistItemImplCopyWithImpl<_$WatchlistItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$WatchlistItemImplToJson(
      this,
    );
  }
}

abstract class _WatchlistItem implements WatchlistItem {
  const factory _WatchlistItem(
      {required final String symbol,
      required final String name,
      required final MarketType market,
      required final DateTime addedAt,
      final int sortOrder,
      final StockQuote? quote}) = _$WatchlistItemImpl;

  factory _WatchlistItem.fromJson(Map<String, dynamic> json) =
      _$WatchlistItemImpl.fromJson;

  @override
  String get symbol;
  @override
  String get name;
  @override
  MarketType get market;
  @override
  DateTime get addedAt;
  @override
  int get sortOrder;
  @override
  StockQuote? get quote;

  /// Create a copy of WatchlistItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$WatchlistItemImplCopyWith<_$WatchlistItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

StockQuote _$StockQuoteFromJson(Map<String, dynamic> json) {
  return _StockQuote.fromJson(json);
}

/// @nodoc
mixin _$StockQuote {
  String get symbol => throw _privateConstructorUsedError;
  double get price => throw _privateConstructorUsedError;
  double get change => throw _privateConstructorUsedError;
  double get changePercent => throw _privateConstructorUsedError;
  double get open => throw _privateConstructorUsedError;
  double get high => throw _privateConstructorUsedError;
  double get low => throw _privateConstructorUsedError;
  double get previousClose => throw _privateConstructorUsedError;
  int get volume => throw _privateConstructorUsedError;
  DateTime get updateTime => throw _privateConstructorUsedError;

  /// Serializes this StockQuote to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of StockQuote
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $StockQuoteCopyWith<StockQuote> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $StockQuoteCopyWith<$Res> {
  factory $StockQuoteCopyWith(
          StockQuote value, $Res Function(StockQuote) then) =
      _$StockQuoteCopyWithImpl<$Res, StockQuote>;
  @useResult
  $Res call(
      {String symbol,
      double price,
      double change,
      double changePercent,
      double open,
      double high,
      double low,
      double previousClose,
      int volume,
      DateTime updateTime});
}

/// @nodoc
class _$StockQuoteCopyWithImpl<$Res, $Val extends StockQuote>
    implements $StockQuoteCopyWith<$Res> {
  _$StockQuoteCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of StockQuote
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
    Object? price = null,
    Object? change = null,
    Object? changePercent = null,
    Object? open = null,
    Object? high = null,
    Object? low = null,
    Object? previousClose = null,
    Object? volume = null,
    Object? updateTime = null,
  }) {
    return _then(_value.copyWith(
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      change: null == change
          ? _value.change
          : change // ignore: cast_nullable_to_non_nullable
              as double,
      changePercent: null == changePercent
          ? _value.changePercent
          : changePercent // ignore: cast_nullable_to_non_nullable
              as double,
      open: null == open
          ? _value.open
          : open // ignore: cast_nullable_to_non_nullable
              as double,
      high: null == high
          ? _value.high
          : high // ignore: cast_nullable_to_non_nullable
              as double,
      low: null == low
          ? _value.low
          : low // ignore: cast_nullable_to_non_nullable
              as double,
      previousClose: null == previousClose
          ? _value.previousClose
          : previousClose // ignore: cast_nullable_to_non_nullable
              as double,
      volume: null == volume
          ? _value.volume
          : volume // ignore: cast_nullable_to_non_nullable
              as int,
      updateTime: null == updateTime
          ? _value.updateTime
          : updateTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$StockQuoteImplCopyWith<$Res>
    implements $StockQuoteCopyWith<$Res> {
  factory _$$StockQuoteImplCopyWith(
          _$StockQuoteImpl value, $Res Function(_$StockQuoteImpl) then) =
      __$$StockQuoteImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String symbol,
      double price,
      double change,
      double changePercent,
      double open,
      double high,
      double low,
      double previousClose,
      int volume,
      DateTime updateTime});
}

/// @nodoc
class __$$StockQuoteImplCopyWithImpl<$Res>
    extends _$StockQuoteCopyWithImpl<$Res, _$StockQuoteImpl>
    implements _$$StockQuoteImplCopyWith<$Res> {
  __$$StockQuoteImplCopyWithImpl(
      _$StockQuoteImpl _value, $Res Function(_$StockQuoteImpl) _then)
      : super(_value, _then);

  /// Create a copy of StockQuote
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
    Object? price = null,
    Object? change = null,
    Object? changePercent = null,
    Object? open = null,
    Object? high = null,
    Object? low = null,
    Object? previousClose = null,
    Object? volume = null,
    Object? updateTime = null,
  }) {
    return _then(_$StockQuoteImpl(
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      price: null == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as double,
      change: null == change
          ? _value.change
          : change // ignore: cast_nullable_to_non_nullable
              as double,
      changePercent: null == changePercent
          ? _value.changePercent
          : changePercent // ignore: cast_nullable_to_non_nullable
              as double,
      open: null == open
          ? _value.open
          : open // ignore: cast_nullable_to_non_nullable
              as double,
      high: null == high
          ? _value.high
          : high // ignore: cast_nullable_to_non_nullable
              as double,
      low: null == low
          ? _value.low
          : low // ignore: cast_nullable_to_non_nullable
              as double,
      previousClose: null == previousClose
          ? _value.previousClose
          : previousClose // ignore: cast_nullable_to_non_nullable
              as double,
      volume: null == volume
          ? _value.volume
          : volume // ignore: cast_nullable_to_non_nullable
              as int,
      updateTime: null == updateTime
          ? _value.updateTime
          : updateTime // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$StockQuoteImpl implements _StockQuote {
  const _$StockQuoteImpl(
      {required this.symbol,
      required this.price,
      required this.change,
      required this.changePercent,
      required this.open,
      required this.high,
      required this.low,
      required this.previousClose,
      required this.volume,
      required this.updateTime});

  factory _$StockQuoteImpl.fromJson(Map<String, dynamic> json) =>
      _$$StockQuoteImplFromJson(json);

  @override
  final String symbol;
  @override
  final double price;
  @override
  final double change;
  @override
  final double changePercent;
  @override
  final double open;
  @override
  final double high;
  @override
  final double low;
  @override
  final double previousClose;
  @override
  final int volume;
  @override
  final DateTime updateTime;

  @override
  String toString() {
    return 'StockQuote(symbol: $symbol, price: $price, change: $change, changePercent: $changePercent, open: $open, high: $high, low: $low, previousClose: $previousClose, volume: $volume, updateTime: $updateTime)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StockQuoteImpl &&
            (identical(other.symbol, symbol) || other.symbol == symbol) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.change, change) || other.change == change) &&
            (identical(other.changePercent, changePercent) ||
                other.changePercent == changePercent) &&
            (identical(other.open, open) || other.open == open) &&
            (identical(other.high, high) || other.high == high) &&
            (identical(other.low, low) || other.low == low) &&
            (identical(other.previousClose, previousClose) ||
                other.previousClose == previousClose) &&
            (identical(other.volume, volume) || other.volume == volume) &&
            (identical(other.updateTime, updateTime) ||
                other.updateTime == updateTime));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, symbol, price, change,
      changePercent, open, high, low, previousClose, volume, updateTime);

  /// Create a copy of StockQuote
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$StockQuoteImplCopyWith<_$StockQuoteImpl> get copyWith =>
      __$$StockQuoteImplCopyWithImpl<_$StockQuoteImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$StockQuoteImplToJson(
      this,
    );
  }
}

abstract class _StockQuote implements StockQuote {
  const factory _StockQuote(
      {required final String symbol,
      required final double price,
      required final double change,
      required final double changePercent,
      required final double open,
      required final double high,
      required final double low,
      required final double previousClose,
      required final int volume,
      required final DateTime updateTime}) = _$StockQuoteImpl;

  factory _StockQuote.fromJson(Map<String, dynamic> json) =
      _$StockQuoteImpl.fromJson;

  @override
  String get symbol;
  @override
  double get price;
  @override
  double get change;
  @override
  double get changePercent;
  @override
  double get open;
  @override
  double get high;
  @override
  double get low;
  @override
  double get previousClose;
  @override
  int get volume;
  @override
  DateTime get updateTime;

  /// Create a copy of StockQuote
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$StockQuoteImplCopyWith<_$StockQuoteImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

PriceAlert _$PriceAlertFromJson(Map<String, dynamic> json) {
  return _PriceAlert.fromJson(json);
}

/// @nodoc
mixin _$PriceAlert {
  String get id => throw _privateConstructorUsedError;
  String get symbol => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  AlertType get type => throw _privateConstructorUsedError;
  double get targetPrice => throw _privateConstructorUsedError;
  double get currentPrice => throw _privateConstructorUsedError;
  bool get isEnabled => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  DateTime? get triggeredAt => throw _privateConstructorUsedError;
  String? get note => throw _privateConstructorUsedError;

  /// Serializes this PriceAlert to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PriceAlert
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PriceAlertCopyWith<PriceAlert> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PriceAlertCopyWith<$Res> {
  factory $PriceAlertCopyWith(
          PriceAlert value, $Res Function(PriceAlert) then) =
      _$PriceAlertCopyWithImpl<$Res, PriceAlert>;
  @useResult
  $Res call(
      {String id,
      String symbol,
      String name,
      AlertType type,
      double targetPrice,
      double currentPrice,
      bool isEnabled,
      DateTime createdAt,
      DateTime? triggeredAt,
      String? note});
}

/// @nodoc
class _$PriceAlertCopyWithImpl<$Res, $Val extends PriceAlert>
    implements $PriceAlertCopyWith<$Res> {
  _$PriceAlertCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PriceAlert
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? symbol = null,
    Object? name = null,
    Object? type = null,
    Object? targetPrice = null,
    Object? currentPrice = null,
    Object? isEnabled = null,
    Object? createdAt = null,
    Object? triggeredAt = freezed,
    Object? note = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as AlertType,
      targetPrice: null == targetPrice
          ? _value.targetPrice
          : targetPrice // ignore: cast_nullable_to_non_nullable
              as double,
      currentPrice: null == currentPrice
          ? _value.currentPrice
          : currentPrice // ignore: cast_nullable_to_non_nullable
              as double,
      isEnabled: null == isEnabled
          ? _value.isEnabled
          : isEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      triggeredAt: freezed == triggeredAt
          ? _value.triggeredAt
          : triggeredAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PriceAlertImplCopyWith<$Res>
    implements $PriceAlertCopyWith<$Res> {
  factory _$$PriceAlertImplCopyWith(
          _$PriceAlertImpl value, $Res Function(_$PriceAlertImpl) then) =
      __$$PriceAlertImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String symbol,
      String name,
      AlertType type,
      double targetPrice,
      double currentPrice,
      bool isEnabled,
      DateTime createdAt,
      DateTime? triggeredAt,
      String? note});
}

/// @nodoc
class __$$PriceAlertImplCopyWithImpl<$Res>
    extends _$PriceAlertCopyWithImpl<$Res, _$PriceAlertImpl>
    implements _$$PriceAlertImplCopyWith<$Res> {
  __$$PriceAlertImplCopyWithImpl(
      _$PriceAlertImpl _value, $Res Function(_$PriceAlertImpl) _then)
      : super(_value, _then);

  /// Create a copy of PriceAlert
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? symbol = null,
    Object? name = null,
    Object? type = null,
    Object? targetPrice = null,
    Object? currentPrice = null,
    Object? isEnabled = null,
    Object? createdAt = null,
    Object? triggeredAt = freezed,
    Object? note = freezed,
  }) {
    return _then(_$PriceAlertImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as AlertType,
      targetPrice: null == targetPrice
          ? _value.targetPrice
          : targetPrice // ignore: cast_nullable_to_non_nullable
              as double,
      currentPrice: null == currentPrice
          ? _value.currentPrice
          : currentPrice // ignore: cast_nullable_to_non_nullable
              as double,
      isEnabled: null == isEnabled
          ? _value.isEnabled
          : isEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      triggeredAt: freezed == triggeredAt
          ? _value.triggeredAt
          : triggeredAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PriceAlertImpl implements _PriceAlert {
  const _$PriceAlertImpl(
      {required this.id,
      required this.symbol,
      required this.name,
      required this.type,
      required this.targetPrice,
      required this.currentPrice,
      required this.isEnabled,
      required this.createdAt,
      this.triggeredAt,
      this.note});

  factory _$PriceAlertImpl.fromJson(Map<String, dynamic> json) =>
      _$$PriceAlertImplFromJson(json);

  @override
  final String id;
  @override
  final String symbol;
  @override
  final String name;
  @override
  final AlertType type;
  @override
  final double targetPrice;
  @override
  final double currentPrice;
  @override
  final bool isEnabled;
  @override
  final DateTime createdAt;
  @override
  final DateTime? triggeredAt;
  @override
  final String? note;

  @override
  String toString() {
    return 'PriceAlert(id: $id, symbol: $symbol, name: $name, type: $type, targetPrice: $targetPrice, currentPrice: $currentPrice, isEnabled: $isEnabled, createdAt: $createdAt, triggeredAt: $triggeredAt, note: $note)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PriceAlertImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.symbol, symbol) || other.symbol == symbol) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.targetPrice, targetPrice) ||
                other.targetPrice == targetPrice) &&
            (identical(other.currentPrice, currentPrice) ||
                other.currentPrice == currentPrice) &&
            (identical(other.isEnabled, isEnabled) ||
                other.isEnabled == isEnabled) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.triggeredAt, triggeredAt) ||
                other.triggeredAt == triggeredAt) &&
            (identical(other.note, note) || other.note == note));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, symbol, name, type,
      targetPrice, currentPrice, isEnabled, createdAt, triggeredAt, note);

  /// Create a copy of PriceAlert
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PriceAlertImplCopyWith<_$PriceAlertImpl> get copyWith =>
      __$$PriceAlertImplCopyWithImpl<_$PriceAlertImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PriceAlertImplToJson(
      this,
    );
  }
}

abstract class _PriceAlert implements PriceAlert {
  const factory _PriceAlert(
      {required final String id,
      required final String symbol,
      required final String name,
      required final AlertType type,
      required final double targetPrice,
      required final double currentPrice,
      required final bool isEnabled,
      required final DateTime createdAt,
      final DateTime? triggeredAt,
      final String? note}) = _$PriceAlertImpl;

  factory _PriceAlert.fromJson(Map<String, dynamic> json) =
      _$PriceAlertImpl.fromJson;

  @override
  String get id;
  @override
  String get symbol;
  @override
  String get name;
  @override
  AlertType get type;
  @override
  double get targetPrice;
  @override
  double get currentPrice;
  @override
  bool get isEnabled;
  @override
  DateTime get createdAt;
  @override
  DateTime? get triggeredAt;
  @override
  String? get note;

  /// Create a copy of PriceAlert
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PriceAlertImplCopyWith<_$PriceAlertImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
