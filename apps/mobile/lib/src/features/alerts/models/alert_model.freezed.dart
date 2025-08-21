// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'alert_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AlertItem _$AlertItemFromJson(Map<String, dynamic> json) {
  return _AlertItem.fromJson(json);
}

/// @nodoc
mixin _$AlertItem {
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
  bool get isRead => throw _privateConstructorUsedError;

  /// Serializes this AlertItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AlertItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AlertItemCopyWith<AlertItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AlertItemCopyWith<$Res> {
  factory $AlertItemCopyWith(AlertItem value, $Res Function(AlertItem) then) =
      _$AlertItemCopyWithImpl<$Res, AlertItem>;
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
      String? note,
      bool isRead});
}

/// @nodoc
class _$AlertItemCopyWithImpl<$Res, $Val extends AlertItem>
    implements $AlertItemCopyWith<$Res> {
  _$AlertItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AlertItem
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
    Object? isRead = null,
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
      isRead: null == isRead
          ? _value.isRead
          : isRead // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AlertItemImplCopyWith<$Res>
    implements $AlertItemCopyWith<$Res> {
  factory _$$AlertItemImplCopyWith(
          _$AlertItemImpl value, $Res Function(_$AlertItemImpl) then) =
      __$$AlertItemImplCopyWithImpl<$Res>;
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
      String? note,
      bool isRead});
}

/// @nodoc
class __$$AlertItemImplCopyWithImpl<$Res>
    extends _$AlertItemCopyWithImpl<$Res, _$AlertItemImpl>
    implements _$$AlertItemImplCopyWith<$Res> {
  __$$AlertItemImplCopyWithImpl(
      _$AlertItemImpl _value, $Res Function(_$AlertItemImpl) _then)
      : super(_value, _then);

  /// Create a copy of AlertItem
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
    Object? isRead = null,
  }) {
    return _then(_$AlertItemImpl(
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
      isRead: null == isRead
          ? _value.isRead
          : isRead // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AlertItemImpl implements _AlertItem {
  const _$AlertItemImpl(
      {required this.id,
      required this.symbol,
      required this.name,
      required this.type,
      required this.targetPrice,
      required this.currentPrice,
      required this.isEnabled,
      required this.createdAt,
      this.triggeredAt,
      this.note,
      this.isRead = false});

  factory _$AlertItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$AlertItemImplFromJson(json);

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
  @JsonKey()
  final bool isRead;

  @override
  String toString() {
    return 'AlertItem(id: $id, symbol: $symbol, name: $name, type: $type, targetPrice: $targetPrice, currentPrice: $currentPrice, isEnabled: $isEnabled, createdAt: $createdAt, triggeredAt: $triggeredAt, note: $note, isRead: $isRead)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AlertItemImpl &&
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
            (identical(other.note, note) || other.note == note) &&
            (identical(other.isRead, isRead) || other.isRead == isRead));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      symbol,
      name,
      type,
      targetPrice,
      currentPrice,
      isEnabled,
      createdAt,
      triggeredAt,
      note,
      isRead);

  /// Create a copy of AlertItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AlertItemImplCopyWith<_$AlertItemImpl> get copyWith =>
      __$$AlertItemImplCopyWithImpl<_$AlertItemImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AlertItemImplToJson(
      this,
    );
  }
}

abstract class _AlertItem implements AlertItem {
  const factory _AlertItem(
      {required final String id,
      required final String symbol,
      required final String name,
      required final AlertType type,
      required final double targetPrice,
      required final double currentPrice,
      required final bool isEnabled,
      required final DateTime createdAt,
      final DateTime? triggeredAt,
      final String? note,
      final bool isRead}) = _$AlertItemImpl;

  factory _AlertItem.fromJson(Map<String, dynamic> json) =
      _$AlertItemImpl.fromJson;

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
  @override
  bool get isRead;

  /// Create a copy of AlertItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AlertItemImplCopyWith<_$AlertItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
