// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'stock_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

StockModel _$StockModelFromJson(Map<String, dynamic> json) {
  return _StockModel.fromJson(json);
}

/// @nodoc
mixin _$StockModel {
  String get symbol => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  double get currentPrice => throw _privateConstructorUsedError;
  double get change => throw _privateConstructorUsedError;
  double get changePercent => throw _privateConstructorUsedError;
  double get open => throw _privateConstructorUsedError;
  double get high => throw _privateConstructorUsedError;
  double get low => throw _privateConstructorUsedError;
  double get previousClose => throw _privateConstructorUsedError;
  int get volume => throw _privateConstructorUsedError;
  double get marketCap => throw _privateConstructorUsedError;
  double get pe => throw _privateConstructorUsedError;
  double get pb => throw _privateConstructorUsedError;
  String get updateTime => throw _privateConstructorUsedError;

  /// Serializes this StockModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of StockModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $StockModelCopyWith<StockModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $StockModelCopyWith<$Res> {
  factory $StockModelCopyWith(
          StockModel value, $Res Function(StockModel) then) =
      _$StockModelCopyWithImpl<$Res, StockModel>;
  @useResult
  $Res call(
      {String symbol,
      String name,
      double currentPrice,
      double change,
      double changePercent,
      double open,
      double high,
      double low,
      double previousClose,
      int volume,
      double marketCap,
      double pe,
      double pb,
      String updateTime});
}

/// @nodoc
class _$StockModelCopyWithImpl<$Res, $Val extends StockModel>
    implements $StockModelCopyWith<$Res> {
  _$StockModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of StockModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
    Object? name = null,
    Object? currentPrice = null,
    Object? change = null,
    Object? changePercent = null,
    Object? open = null,
    Object? high = null,
    Object? low = null,
    Object? previousClose = null,
    Object? volume = null,
    Object? marketCap = null,
    Object? pe = null,
    Object? pb = null,
    Object? updateTime = null,
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
      currentPrice: null == currentPrice
          ? _value.currentPrice
          : currentPrice // ignore: cast_nullable_to_non_nullable
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
      marketCap: null == marketCap
          ? _value.marketCap
          : marketCap // ignore: cast_nullable_to_non_nullable
              as double,
      pe: null == pe
          ? _value.pe
          : pe // ignore: cast_nullable_to_non_nullable
              as double,
      pb: null == pb
          ? _value.pb
          : pb // ignore: cast_nullable_to_non_nullable
              as double,
      updateTime: null == updateTime
          ? _value.updateTime
          : updateTime // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$StockModelImplCopyWith<$Res>
    implements $StockModelCopyWith<$Res> {
  factory _$$StockModelImplCopyWith(
          _$StockModelImpl value, $Res Function(_$StockModelImpl) then) =
      __$$StockModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String symbol,
      String name,
      double currentPrice,
      double change,
      double changePercent,
      double open,
      double high,
      double low,
      double previousClose,
      int volume,
      double marketCap,
      double pe,
      double pb,
      String updateTime});
}

/// @nodoc
class __$$StockModelImplCopyWithImpl<$Res>
    extends _$StockModelCopyWithImpl<$Res, _$StockModelImpl>
    implements _$$StockModelImplCopyWith<$Res> {
  __$$StockModelImplCopyWithImpl(
      _$StockModelImpl _value, $Res Function(_$StockModelImpl) _then)
      : super(_value, _then);

  /// Create a copy of StockModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? symbol = null,
    Object? name = null,
    Object? currentPrice = null,
    Object? change = null,
    Object? changePercent = null,
    Object? open = null,
    Object? high = null,
    Object? low = null,
    Object? previousClose = null,
    Object? volume = null,
    Object? marketCap = null,
    Object? pe = null,
    Object? pb = null,
    Object? updateTime = null,
  }) {
    return _then(_$StockModelImpl(
      symbol: null == symbol
          ? _value.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      currentPrice: null == currentPrice
          ? _value.currentPrice
          : currentPrice // ignore: cast_nullable_to_non_nullable
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
      marketCap: null == marketCap
          ? _value.marketCap
          : marketCap // ignore: cast_nullable_to_non_nullable
              as double,
      pe: null == pe
          ? _value.pe
          : pe // ignore: cast_nullable_to_non_nullable
              as double,
      pb: null == pb
          ? _value.pb
          : pb // ignore: cast_nullable_to_non_nullable
              as double,
      updateTime: null == updateTime
          ? _value.updateTime
          : updateTime // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$StockModelImpl implements _StockModel {
  const _$StockModelImpl(
      {required this.symbol,
      required this.name,
      required this.currentPrice,
      required this.change,
      required this.changePercent,
      required this.open,
      required this.high,
      required this.low,
      required this.previousClose,
      required this.volume,
      required this.marketCap,
      required this.pe,
      required this.pb,
      required this.updateTime});

  factory _$StockModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$StockModelImplFromJson(json);

  @override
  final String symbol;
  @override
  final String name;
  @override
  final double currentPrice;
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
  final double marketCap;
  @override
  final double pe;
  @override
  final double pb;
  @override
  final String updateTime;

  @override
  String toString() {
    return 'StockModel(symbol: $symbol, name: $name, currentPrice: $currentPrice, change: $change, changePercent: $changePercent, open: $open, high: $high, low: $low, previousClose: $previousClose, volume: $volume, marketCap: $marketCap, pe: $pe, pb: $pb, updateTime: $updateTime)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StockModelImpl &&
            (identical(other.symbol, symbol) || other.symbol == symbol) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.currentPrice, currentPrice) ||
                other.currentPrice == currentPrice) &&
            (identical(other.change, change) || other.change == change) &&
            (identical(other.changePercent, changePercent) ||
                other.changePercent == changePercent) &&
            (identical(other.open, open) || other.open == open) &&
            (identical(other.high, high) || other.high == high) &&
            (identical(other.low, low) || other.low == low) &&
            (identical(other.previousClose, previousClose) ||
                other.previousClose == previousClose) &&
            (identical(other.volume, volume) || other.volume == volume) &&
            (identical(other.marketCap, marketCap) ||
                other.marketCap == marketCap) &&
            (identical(other.pe, pe) || other.pe == pe) &&
            (identical(other.pb, pb) || other.pb == pb) &&
            (identical(other.updateTime, updateTime) ||
                other.updateTime == updateTime));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      symbol,
      name,
      currentPrice,
      change,
      changePercent,
      open,
      high,
      low,
      previousClose,
      volume,
      marketCap,
      pe,
      pb,
      updateTime);

  /// Create a copy of StockModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$StockModelImplCopyWith<_$StockModelImpl> get copyWith =>
      __$$StockModelImplCopyWithImpl<_$StockModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$StockModelImplToJson(
      this,
    );
  }
}

abstract class _StockModel implements StockModel {
  const factory _StockModel(
      {required final String symbol,
      required final String name,
      required final double currentPrice,
      required final double change,
      required final double changePercent,
      required final double open,
      required final double high,
      required final double low,
      required final double previousClose,
      required final int volume,
      required final double marketCap,
      required final double pe,
      required final double pb,
      required final String updateTime}) = _$StockModelImpl;

  factory _StockModel.fromJson(Map<String, dynamic> json) =
      _$StockModelImpl.fromJson;

  @override
  String get symbol;
  @override
  String get name;
  @override
  double get currentPrice;
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
  double get marketCap;
  @override
  double get pe;
  @override
  double get pb;
  @override
  String get updateTime;

  /// Create a copy of StockModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$StockModelImplCopyWith<_$StockModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

KLineData _$KLineDataFromJson(Map<String, dynamic> json) {
  return _KLineData.fromJson(json);
}

/// @nodoc
mixin _$KLineData {
  DateTime get time => throw _privateConstructorUsedError;
  double get open => throw _privateConstructorUsedError;
  double get high => throw _privateConstructorUsedError;
  double get low => throw _privateConstructorUsedError;
  double get close => throw _privateConstructorUsedError;
  int get volume => throw _privateConstructorUsedError;

  /// Serializes this KLineData to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of KLineData
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $KLineDataCopyWith<KLineData> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $KLineDataCopyWith<$Res> {
  factory $KLineDataCopyWith(KLineData value, $Res Function(KLineData) then) =
      _$KLineDataCopyWithImpl<$Res, KLineData>;
  @useResult
  $Res call(
      {DateTime time,
      double open,
      double high,
      double low,
      double close,
      int volume});
}

/// @nodoc
class _$KLineDataCopyWithImpl<$Res, $Val extends KLineData>
    implements $KLineDataCopyWith<$Res> {
  _$KLineDataCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of KLineData
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? time = null,
    Object? open = null,
    Object? high = null,
    Object? low = null,
    Object? close = null,
    Object? volume = null,
  }) {
    return _then(_value.copyWith(
      time: null == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as DateTime,
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
      close: null == close
          ? _value.close
          : close // ignore: cast_nullable_to_non_nullable
              as double,
      volume: null == volume
          ? _value.volume
          : volume // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$KLineDataImplCopyWith<$Res>
    implements $KLineDataCopyWith<$Res> {
  factory _$$KLineDataImplCopyWith(
          _$KLineDataImpl value, $Res Function(_$KLineDataImpl) then) =
      __$$KLineDataImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {DateTime time,
      double open,
      double high,
      double low,
      double close,
      int volume});
}

/// @nodoc
class __$$KLineDataImplCopyWithImpl<$Res>
    extends _$KLineDataCopyWithImpl<$Res, _$KLineDataImpl>
    implements _$$KLineDataImplCopyWith<$Res> {
  __$$KLineDataImplCopyWithImpl(
      _$KLineDataImpl _value, $Res Function(_$KLineDataImpl) _then)
      : super(_value, _then);

  /// Create a copy of KLineData
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? time = null,
    Object? open = null,
    Object? high = null,
    Object? low = null,
    Object? close = null,
    Object? volume = null,
  }) {
    return _then(_$KLineDataImpl(
      time: null == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as DateTime,
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
      close: null == close
          ? _value.close
          : close // ignore: cast_nullable_to_non_nullable
              as double,
      volume: null == volume
          ? _value.volume
          : volume // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$KLineDataImpl implements _KLineData {
  const _$KLineDataImpl(
      {required this.time,
      required this.open,
      required this.high,
      required this.low,
      required this.close,
      required this.volume});

  factory _$KLineDataImpl.fromJson(Map<String, dynamic> json) =>
      _$$KLineDataImplFromJson(json);

  @override
  final DateTime time;
  @override
  final double open;
  @override
  final double high;
  @override
  final double low;
  @override
  final double close;
  @override
  final int volume;

  @override
  String toString() {
    return 'KLineData(time: $time, open: $open, high: $high, low: $low, close: $close, volume: $volume)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$KLineDataImpl &&
            (identical(other.time, time) || other.time == time) &&
            (identical(other.open, open) || other.open == open) &&
            (identical(other.high, high) || other.high == high) &&
            (identical(other.low, low) || other.low == low) &&
            (identical(other.close, close) || other.close == close) &&
            (identical(other.volume, volume) || other.volume == volume));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, time, open, high, low, close, volume);

  /// Create a copy of KLineData
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$KLineDataImplCopyWith<_$KLineDataImpl> get copyWith =>
      __$$KLineDataImplCopyWithImpl<_$KLineDataImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$KLineDataImplToJson(
      this,
    );
  }
}

abstract class _KLineData implements KLineData {
  const factory _KLineData(
      {required final DateTime time,
      required final double open,
      required final double high,
      required final double low,
      required final double close,
      required final int volume}) = _$KLineDataImpl;

  factory _KLineData.fromJson(Map<String, dynamic> json) =
      _$KLineDataImpl.fromJson;

  @override
  DateTime get time;
  @override
  double get open;
  @override
  double get high;
  @override
  double get low;
  @override
  double get close;
  @override
  int get volume;

  /// Create a copy of KLineData
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$KLineDataImplCopyWith<_$KLineDataImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TechnicalIndicator _$TechnicalIndicatorFromJson(Map<String, dynamic> json) {
  return _TechnicalIndicator.fromJson(json);
}

/// @nodoc
mixin _$TechnicalIndicator {
  String get name => throw _privateConstructorUsedError;
  List<double> get values => throw _privateConstructorUsedError;
  @JsonKey(includeFromJson: false, includeToJson: false)
  Color? get color => throw _privateConstructorUsedError;

  /// Serializes this TechnicalIndicator to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TechnicalIndicator
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TechnicalIndicatorCopyWith<TechnicalIndicator> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TechnicalIndicatorCopyWith<$Res> {
  factory $TechnicalIndicatorCopyWith(
          TechnicalIndicator value, $Res Function(TechnicalIndicator) then) =
      _$TechnicalIndicatorCopyWithImpl<$Res, TechnicalIndicator>;
  @useResult
  $Res call(
      {String name,
      List<double> values,
      @JsonKey(includeFromJson: false, includeToJson: false) Color? color});
}

/// @nodoc
class _$TechnicalIndicatorCopyWithImpl<$Res, $Val extends TechnicalIndicator>
    implements $TechnicalIndicatorCopyWith<$Res> {
  _$TechnicalIndicatorCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TechnicalIndicator
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? values = null,
    Object? color = freezed,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      values: null == values
          ? _value.values
          : values // ignore: cast_nullable_to_non_nullable
              as List<double>,
      color: freezed == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as Color?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TechnicalIndicatorImplCopyWith<$Res>
    implements $TechnicalIndicatorCopyWith<$Res> {
  factory _$$TechnicalIndicatorImplCopyWith(_$TechnicalIndicatorImpl value,
          $Res Function(_$TechnicalIndicatorImpl) then) =
      __$$TechnicalIndicatorImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String name,
      List<double> values,
      @JsonKey(includeFromJson: false, includeToJson: false) Color? color});
}

/// @nodoc
class __$$TechnicalIndicatorImplCopyWithImpl<$Res>
    extends _$TechnicalIndicatorCopyWithImpl<$Res, _$TechnicalIndicatorImpl>
    implements _$$TechnicalIndicatorImplCopyWith<$Res> {
  __$$TechnicalIndicatorImplCopyWithImpl(_$TechnicalIndicatorImpl _value,
      $Res Function(_$TechnicalIndicatorImpl) _then)
      : super(_value, _then);

  /// Create a copy of TechnicalIndicator
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? values = null,
    Object? color = freezed,
  }) {
    return _then(_$TechnicalIndicatorImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      values: null == values
          ? _value._values
          : values // ignore: cast_nullable_to_non_nullable
              as List<double>,
      color: freezed == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as Color?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TechnicalIndicatorImpl implements _TechnicalIndicator {
  const _$TechnicalIndicatorImpl(
      {required this.name,
      required final List<double> values,
      @JsonKey(includeFromJson: false, includeToJson: false) this.color})
      : _values = values;

  factory _$TechnicalIndicatorImpl.fromJson(Map<String, dynamic> json) =>
      _$$TechnicalIndicatorImplFromJson(json);

  @override
  final String name;
  final List<double> _values;
  @override
  List<double> get values {
    if (_values is EqualUnmodifiableListView) return _values;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_values);
  }

  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  final Color? color;

  @override
  String toString() {
    return 'TechnicalIndicator(name: $name, values: $values, color: $color)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TechnicalIndicatorImpl &&
            (identical(other.name, name) || other.name == name) &&
            const DeepCollectionEquality().equals(other._values, _values) &&
            (identical(other.color, color) || other.color == color));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, name, const DeepCollectionEquality().hash(_values), color);

  /// Create a copy of TechnicalIndicator
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TechnicalIndicatorImplCopyWith<_$TechnicalIndicatorImpl> get copyWith =>
      __$$TechnicalIndicatorImplCopyWithImpl<_$TechnicalIndicatorImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TechnicalIndicatorImplToJson(
      this,
    );
  }
}

abstract class _TechnicalIndicator implements TechnicalIndicator {
  const factory _TechnicalIndicator(
      {required final String name,
      required final List<double> values,
      @JsonKey(includeFromJson: false, includeToJson: false)
      final Color? color}) = _$TechnicalIndicatorImpl;

  factory _TechnicalIndicator.fromJson(Map<String, dynamic> json) =
      _$TechnicalIndicatorImpl.fromJson;

  @override
  String get name;
  @override
  List<double> get values;
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  Color? get color;

  /// Create a copy of TechnicalIndicator
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TechnicalIndicatorImplCopyWith<_$TechnicalIndicatorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
