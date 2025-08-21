// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'alert_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AlertItemImpl _$$AlertItemImplFromJson(Map<String, dynamic> json) =>
    _$AlertItemImpl(
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
      isRead: json['isRead'] as bool? ?? false,
    );

Map<String, dynamic> _$$AlertItemImplToJson(_$AlertItemImpl instance) =>
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
      'isRead': instance.isRead,
    };

const _$AlertTypeEnumMap = {
  AlertType.priceUp: 'price_up',
  AlertType.priceDown: 'price_down',
  AlertType.changeUp: 'change_up',
  AlertType.changeDown: 'change_down',
};
