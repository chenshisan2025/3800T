// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

UserModel _$UserModelFromJson(Map<String, dynamic> json) {
  return _UserModel.fromJson(json);
}

/// @nodoc
mixin _$UserModel {
  String get id => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String? get phone => throw _privateConstructorUsedError;
  String? get avatar => throw _privateConstructorUsedError;
  bool get isEmailVerified => throw _privateConstructorUsedError;
  bool get isPhoneVerified => throw _privateConstructorUsedError;
  UserRole get role => throw _privateConstructorUsedError;
  UserStatus get status => throw _privateConstructorUsedError;
  UserPreferences? get preferences => throw _privateConstructorUsedError;
  UserProfile? get profile => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  DateTime? get lastLoginAt => throw _privateConstructorUsedError;

  /// Serializes this UserModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UserModelCopyWith<UserModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserModelCopyWith<$Res> {
  factory $UserModelCopyWith(UserModel value, $Res Function(UserModel) then) =
      _$UserModelCopyWithImpl<$Res, UserModel>;
  @useResult
  $Res call(
      {String id,
      String email,
      String name,
      String? phone,
      String? avatar,
      bool isEmailVerified,
      bool isPhoneVerified,
      UserRole role,
      UserStatus status,
      UserPreferences? preferences,
      UserProfile? profile,
      DateTime? createdAt,
      DateTime? updatedAt,
      DateTime? lastLoginAt});

  $UserPreferencesCopyWith<$Res>? get preferences;
  $UserProfileCopyWith<$Res>? get profile;
}

/// @nodoc
class _$UserModelCopyWithImpl<$Res, $Val extends UserModel>
    implements $UserModelCopyWith<$Res> {
  _$UserModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? name = null,
    Object? phone = freezed,
    Object? avatar = freezed,
    Object? isEmailVerified = null,
    Object? isPhoneVerified = null,
    Object? role = null,
    Object? status = null,
    Object? preferences = freezed,
    Object? profile = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? lastLoginAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      phone: freezed == phone
          ? _value.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String?,
      avatar: freezed == avatar
          ? _value.avatar
          : avatar // ignore: cast_nullable_to_non_nullable
              as String?,
      isEmailVerified: null == isEmailVerified
          ? _value.isEmailVerified
          : isEmailVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      isPhoneVerified: null == isPhoneVerified
          ? _value.isPhoneVerified
          : isPhoneVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as UserRole,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as UserStatus,
      preferences: freezed == preferences
          ? _value.preferences
          : preferences // ignore: cast_nullable_to_non_nullable
              as UserPreferences?,
      profile: freezed == profile
          ? _value.profile
          : profile // ignore: cast_nullable_to_non_nullable
              as UserProfile?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      lastLoginAt: freezed == lastLoginAt
          ? _value.lastLoginAt
          : lastLoginAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $UserPreferencesCopyWith<$Res>? get preferences {
    if (_value.preferences == null) {
      return null;
    }

    return $UserPreferencesCopyWith<$Res>(_value.preferences!, (value) {
      return _then(_value.copyWith(preferences: value) as $Val);
    });
  }

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $UserProfileCopyWith<$Res>? get profile {
    if (_value.profile == null) {
      return null;
    }

    return $UserProfileCopyWith<$Res>(_value.profile!, (value) {
      return _then(_value.copyWith(profile: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$UserModelImplCopyWith<$Res>
    implements $UserModelCopyWith<$Res> {
  factory _$$UserModelImplCopyWith(
          _$UserModelImpl value, $Res Function(_$UserModelImpl) then) =
      __$$UserModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String email,
      String name,
      String? phone,
      String? avatar,
      bool isEmailVerified,
      bool isPhoneVerified,
      UserRole role,
      UserStatus status,
      UserPreferences? preferences,
      UserProfile? profile,
      DateTime? createdAt,
      DateTime? updatedAt,
      DateTime? lastLoginAt});

  @override
  $UserPreferencesCopyWith<$Res>? get preferences;
  @override
  $UserProfileCopyWith<$Res>? get profile;
}

/// @nodoc
class __$$UserModelImplCopyWithImpl<$Res>
    extends _$UserModelCopyWithImpl<$Res, _$UserModelImpl>
    implements _$$UserModelImplCopyWith<$Res> {
  __$$UserModelImplCopyWithImpl(
      _$UserModelImpl _value, $Res Function(_$UserModelImpl) _then)
      : super(_value, _then);

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? email = null,
    Object? name = null,
    Object? phone = freezed,
    Object? avatar = freezed,
    Object? isEmailVerified = null,
    Object? isPhoneVerified = null,
    Object? role = null,
    Object? status = null,
    Object? preferences = freezed,
    Object? profile = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? lastLoginAt = freezed,
  }) {
    return _then(_$UserModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      phone: freezed == phone
          ? _value.phone
          : phone // ignore: cast_nullable_to_non_nullable
              as String?,
      avatar: freezed == avatar
          ? _value.avatar
          : avatar // ignore: cast_nullable_to_non_nullable
              as String?,
      isEmailVerified: null == isEmailVerified
          ? _value.isEmailVerified
          : isEmailVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      isPhoneVerified: null == isPhoneVerified
          ? _value.isPhoneVerified
          : isPhoneVerified // ignore: cast_nullable_to_non_nullable
              as bool,
      role: null == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as UserRole,
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as UserStatus,
      preferences: freezed == preferences
          ? _value.preferences
          : preferences // ignore: cast_nullable_to_non_nullable
              as UserPreferences?,
      profile: freezed == profile
          ? _value.profile
          : profile // ignore: cast_nullable_to_non_nullable
              as UserProfile?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      lastLoginAt: freezed == lastLoginAt
          ? _value.lastLoginAt
          : lastLoginAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UserModelImpl implements _UserModel {
  const _$UserModelImpl(
      {required this.id,
      required this.email,
      required this.name,
      this.phone,
      this.avatar,
      this.isEmailVerified = false,
      this.isPhoneVerified = false,
      this.role = UserRole.user,
      this.status = UserStatus.active,
      this.preferences,
      this.profile,
      this.createdAt,
      this.updatedAt,
      this.lastLoginAt});

  factory _$UserModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$UserModelImplFromJson(json);

  @override
  final String id;
  @override
  final String email;
  @override
  final String name;
  @override
  final String? phone;
  @override
  final String? avatar;
  @override
  @JsonKey()
  final bool isEmailVerified;
  @override
  @JsonKey()
  final bool isPhoneVerified;
  @override
  @JsonKey()
  final UserRole role;
  @override
  @JsonKey()
  final UserStatus status;
  @override
  final UserPreferences? preferences;
  @override
  final UserProfile? profile;
  @override
  final DateTime? createdAt;
  @override
  final DateTime? updatedAt;
  @override
  final DateTime? lastLoginAt;

  @override
  String toString() {
    return 'UserModel(id: $id, email: $email, name: $name, phone: $phone, avatar: $avatar, isEmailVerified: $isEmailVerified, isPhoneVerified: $isPhoneVerified, role: $role, status: $status, preferences: $preferences, profile: $profile, createdAt: $createdAt, updatedAt: $updatedAt, lastLoginAt: $lastLoginAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.avatar, avatar) || other.avatar == avatar) &&
            (identical(other.isEmailVerified, isEmailVerified) ||
                other.isEmailVerified == isEmailVerified) &&
            (identical(other.isPhoneVerified, isPhoneVerified) ||
                other.isPhoneVerified == isPhoneVerified) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.preferences, preferences) ||
                other.preferences == preferences) &&
            (identical(other.profile, profile) || other.profile == profile) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.lastLoginAt, lastLoginAt) ||
                other.lastLoginAt == lastLoginAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      email,
      name,
      phone,
      avatar,
      isEmailVerified,
      isPhoneVerified,
      role,
      status,
      preferences,
      profile,
      createdAt,
      updatedAt,
      lastLoginAt);

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UserModelImplCopyWith<_$UserModelImpl> get copyWith =>
      __$$UserModelImplCopyWithImpl<_$UserModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UserModelImplToJson(
      this,
    );
  }
}

abstract class _UserModel implements UserModel {
  const factory _UserModel(
      {required final String id,
      required final String email,
      required final String name,
      final String? phone,
      final String? avatar,
      final bool isEmailVerified,
      final bool isPhoneVerified,
      final UserRole role,
      final UserStatus status,
      final UserPreferences? preferences,
      final UserProfile? profile,
      final DateTime? createdAt,
      final DateTime? updatedAt,
      final DateTime? lastLoginAt}) = _$UserModelImpl;

  factory _UserModel.fromJson(Map<String, dynamic> json) =
      _$UserModelImpl.fromJson;

  @override
  String get id;
  @override
  String get email;
  @override
  String get name;
  @override
  String? get phone;
  @override
  String? get avatar;
  @override
  bool get isEmailVerified;
  @override
  bool get isPhoneVerified;
  @override
  UserRole get role;
  @override
  UserStatus get status;
  @override
  UserPreferences? get preferences;
  @override
  UserProfile? get profile;
  @override
  DateTime? get createdAt;
  @override
  DateTime? get updatedAt;
  @override
  DateTime? get lastLoginAt;

  /// Create a copy of UserModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UserModelImplCopyWith<_$UserModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

UserPreferences _$UserPreferencesFromJson(Map<String, dynamic> json) {
  return _UserPreferences.fromJson(json);
}

/// @nodoc
mixin _$UserPreferences {
  String get language => throw _privateConstructorUsedError;
  String get themeMode =>
      throw _privateConstructorUsedError; // light, dark, system
  bool get pushNotifications => throw _privateConstructorUsedError;
  bool get emailNotifications => throw _privateConstructorUsedError;
  bool get smsNotifications => throw _privateConstructorUsedError;
  bool get marketAlerts => throw _privateConstructorUsedError;
  bool get priceAlerts => throw _privateConstructorUsedError;
  bool get newsAlerts => throw _privateConstructorUsedError;
  bool get biometricAuth => throw _privateConstructorUsedError;
  int get sessionTimeout => throw _privateConstructorUsedError; // 分钟
  String get currency => throw _privateConstructorUsedError;
  String get timezone => throw _privateConstructorUsedError;
  bool get soundEnabled => throw _privateConstructorUsedError;
  bool get vibrationEnabled => throw _privateConstructorUsedError;
  bool get autoRefresh => throw _privateConstructorUsedError;
  int get refreshInterval => throw _privateConstructorUsedError; // 秒
  Map<String, dynamic>? get customSettings =>
      throw _privateConstructorUsedError;

  /// Serializes this UserPreferences to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of UserPreferences
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UserPreferencesCopyWith<UserPreferences> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserPreferencesCopyWith<$Res> {
  factory $UserPreferencesCopyWith(
          UserPreferences value, $Res Function(UserPreferences) then) =
      _$UserPreferencesCopyWithImpl<$Res, UserPreferences>;
  @useResult
  $Res call(
      {String language,
      String themeMode,
      bool pushNotifications,
      bool emailNotifications,
      bool smsNotifications,
      bool marketAlerts,
      bool priceAlerts,
      bool newsAlerts,
      bool biometricAuth,
      int sessionTimeout,
      String currency,
      String timezone,
      bool soundEnabled,
      bool vibrationEnabled,
      bool autoRefresh,
      int refreshInterval,
      Map<String, dynamic>? customSettings});
}

/// @nodoc
class _$UserPreferencesCopyWithImpl<$Res, $Val extends UserPreferences>
    implements $UserPreferencesCopyWith<$Res> {
  _$UserPreferencesCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of UserPreferences
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? language = null,
    Object? themeMode = null,
    Object? pushNotifications = null,
    Object? emailNotifications = null,
    Object? smsNotifications = null,
    Object? marketAlerts = null,
    Object? priceAlerts = null,
    Object? newsAlerts = null,
    Object? biometricAuth = null,
    Object? sessionTimeout = null,
    Object? currency = null,
    Object? timezone = null,
    Object? soundEnabled = null,
    Object? vibrationEnabled = null,
    Object? autoRefresh = null,
    Object? refreshInterval = null,
    Object? customSettings = freezed,
  }) {
    return _then(_value.copyWith(
      language: null == language
          ? _value.language
          : language // ignore: cast_nullable_to_non_nullable
              as String,
      themeMode: null == themeMode
          ? _value.themeMode
          : themeMode // ignore: cast_nullable_to_non_nullable
              as String,
      pushNotifications: null == pushNotifications
          ? _value.pushNotifications
          : pushNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      emailNotifications: null == emailNotifications
          ? _value.emailNotifications
          : emailNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      smsNotifications: null == smsNotifications
          ? _value.smsNotifications
          : smsNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      marketAlerts: null == marketAlerts
          ? _value.marketAlerts
          : marketAlerts // ignore: cast_nullable_to_non_nullable
              as bool,
      priceAlerts: null == priceAlerts
          ? _value.priceAlerts
          : priceAlerts // ignore: cast_nullable_to_non_nullable
              as bool,
      newsAlerts: null == newsAlerts
          ? _value.newsAlerts
          : newsAlerts // ignore: cast_nullable_to_non_nullable
              as bool,
      biometricAuth: null == biometricAuth
          ? _value.biometricAuth
          : biometricAuth // ignore: cast_nullable_to_non_nullable
              as bool,
      sessionTimeout: null == sessionTimeout
          ? _value.sessionTimeout
          : sessionTimeout // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      soundEnabled: null == soundEnabled
          ? _value.soundEnabled
          : soundEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      vibrationEnabled: null == vibrationEnabled
          ? _value.vibrationEnabled
          : vibrationEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      autoRefresh: null == autoRefresh
          ? _value.autoRefresh
          : autoRefresh // ignore: cast_nullable_to_non_nullable
              as bool,
      refreshInterval: null == refreshInterval
          ? _value.refreshInterval
          : refreshInterval // ignore: cast_nullable_to_non_nullable
              as int,
      customSettings: freezed == customSettings
          ? _value.customSettings
          : customSettings // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UserPreferencesImplCopyWith<$Res>
    implements $UserPreferencesCopyWith<$Res> {
  factory _$$UserPreferencesImplCopyWith(_$UserPreferencesImpl value,
          $Res Function(_$UserPreferencesImpl) then) =
      __$$UserPreferencesImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String language,
      String themeMode,
      bool pushNotifications,
      bool emailNotifications,
      bool smsNotifications,
      bool marketAlerts,
      bool priceAlerts,
      bool newsAlerts,
      bool biometricAuth,
      int sessionTimeout,
      String currency,
      String timezone,
      bool soundEnabled,
      bool vibrationEnabled,
      bool autoRefresh,
      int refreshInterval,
      Map<String, dynamic>? customSettings});
}

/// @nodoc
class __$$UserPreferencesImplCopyWithImpl<$Res>
    extends _$UserPreferencesCopyWithImpl<$Res, _$UserPreferencesImpl>
    implements _$$UserPreferencesImplCopyWith<$Res> {
  __$$UserPreferencesImplCopyWithImpl(
      _$UserPreferencesImpl _value, $Res Function(_$UserPreferencesImpl) _then)
      : super(_value, _then);

  /// Create a copy of UserPreferences
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? language = null,
    Object? themeMode = null,
    Object? pushNotifications = null,
    Object? emailNotifications = null,
    Object? smsNotifications = null,
    Object? marketAlerts = null,
    Object? priceAlerts = null,
    Object? newsAlerts = null,
    Object? biometricAuth = null,
    Object? sessionTimeout = null,
    Object? currency = null,
    Object? timezone = null,
    Object? soundEnabled = null,
    Object? vibrationEnabled = null,
    Object? autoRefresh = null,
    Object? refreshInterval = null,
    Object? customSettings = freezed,
  }) {
    return _then(_$UserPreferencesImpl(
      language: null == language
          ? _value.language
          : language // ignore: cast_nullable_to_non_nullable
              as String,
      themeMode: null == themeMode
          ? _value.themeMode
          : themeMode // ignore: cast_nullable_to_non_nullable
              as String,
      pushNotifications: null == pushNotifications
          ? _value.pushNotifications
          : pushNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      emailNotifications: null == emailNotifications
          ? _value.emailNotifications
          : emailNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      smsNotifications: null == smsNotifications
          ? _value.smsNotifications
          : smsNotifications // ignore: cast_nullable_to_non_nullable
              as bool,
      marketAlerts: null == marketAlerts
          ? _value.marketAlerts
          : marketAlerts // ignore: cast_nullable_to_non_nullable
              as bool,
      priceAlerts: null == priceAlerts
          ? _value.priceAlerts
          : priceAlerts // ignore: cast_nullable_to_non_nullable
              as bool,
      newsAlerts: null == newsAlerts
          ? _value.newsAlerts
          : newsAlerts // ignore: cast_nullable_to_non_nullable
              as bool,
      biometricAuth: null == biometricAuth
          ? _value.biometricAuth
          : biometricAuth // ignore: cast_nullable_to_non_nullable
              as bool,
      sessionTimeout: null == sessionTimeout
          ? _value.sessionTimeout
          : sessionTimeout // ignore: cast_nullable_to_non_nullable
              as int,
      currency: null == currency
          ? _value.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      timezone: null == timezone
          ? _value.timezone
          : timezone // ignore: cast_nullable_to_non_nullable
              as String,
      soundEnabled: null == soundEnabled
          ? _value.soundEnabled
          : soundEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      vibrationEnabled: null == vibrationEnabled
          ? _value.vibrationEnabled
          : vibrationEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      autoRefresh: null == autoRefresh
          ? _value.autoRefresh
          : autoRefresh // ignore: cast_nullable_to_non_nullable
              as bool,
      refreshInterval: null == refreshInterval
          ? _value.refreshInterval
          : refreshInterval // ignore: cast_nullable_to_non_nullable
              as int,
      customSettings: freezed == customSettings
          ? _value._customSettings
          : customSettings // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UserPreferencesImpl implements _UserPreferences {
  const _$UserPreferencesImpl(
      {this.language = 'zh_CN',
      this.themeMode = 'system',
      this.pushNotifications = true,
      this.emailNotifications = true,
      this.smsNotifications = true,
      this.marketAlerts = true,
      this.priceAlerts = true,
      this.newsAlerts = true,
      this.biometricAuth = false,
      this.sessionTimeout = 30,
      this.currency = 'CNY',
      this.timezone = 'Asia/Shanghai',
      this.soundEnabled = false,
      this.vibrationEnabled = false,
      this.autoRefresh = true,
      this.refreshInterval = 5,
      final Map<String, dynamic>? customSettings})
      : _customSettings = customSettings;

  factory _$UserPreferencesImpl.fromJson(Map<String, dynamic> json) =>
      _$$UserPreferencesImplFromJson(json);

  @override
  @JsonKey()
  final String language;
  @override
  @JsonKey()
  final String themeMode;
// light, dark, system
  @override
  @JsonKey()
  final bool pushNotifications;
  @override
  @JsonKey()
  final bool emailNotifications;
  @override
  @JsonKey()
  final bool smsNotifications;
  @override
  @JsonKey()
  final bool marketAlerts;
  @override
  @JsonKey()
  final bool priceAlerts;
  @override
  @JsonKey()
  final bool newsAlerts;
  @override
  @JsonKey()
  final bool biometricAuth;
  @override
  @JsonKey()
  final int sessionTimeout;
// 分钟
  @override
  @JsonKey()
  final String currency;
  @override
  @JsonKey()
  final String timezone;
  @override
  @JsonKey()
  final bool soundEnabled;
  @override
  @JsonKey()
  final bool vibrationEnabled;
  @override
  @JsonKey()
  final bool autoRefresh;
  @override
  @JsonKey()
  final int refreshInterval;
// 秒
  final Map<String, dynamic>? _customSettings;
// 秒
  @override
  Map<String, dynamic>? get customSettings {
    final value = _customSettings;
    if (value == null) return null;
    if (_customSettings is EqualUnmodifiableMapView) return _customSettings;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'UserPreferences(language: $language, themeMode: $themeMode, pushNotifications: $pushNotifications, emailNotifications: $emailNotifications, smsNotifications: $smsNotifications, marketAlerts: $marketAlerts, priceAlerts: $priceAlerts, newsAlerts: $newsAlerts, biometricAuth: $biometricAuth, sessionTimeout: $sessionTimeout, currency: $currency, timezone: $timezone, soundEnabled: $soundEnabled, vibrationEnabled: $vibrationEnabled, autoRefresh: $autoRefresh, refreshInterval: $refreshInterval, customSettings: $customSettings)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserPreferencesImpl &&
            (identical(other.language, language) ||
                other.language == language) &&
            (identical(other.themeMode, themeMode) ||
                other.themeMode == themeMode) &&
            (identical(other.pushNotifications, pushNotifications) ||
                other.pushNotifications == pushNotifications) &&
            (identical(other.emailNotifications, emailNotifications) ||
                other.emailNotifications == emailNotifications) &&
            (identical(other.smsNotifications, smsNotifications) ||
                other.smsNotifications == smsNotifications) &&
            (identical(other.marketAlerts, marketAlerts) ||
                other.marketAlerts == marketAlerts) &&
            (identical(other.priceAlerts, priceAlerts) ||
                other.priceAlerts == priceAlerts) &&
            (identical(other.newsAlerts, newsAlerts) ||
                other.newsAlerts == newsAlerts) &&
            (identical(other.biometricAuth, biometricAuth) ||
                other.biometricAuth == biometricAuth) &&
            (identical(other.sessionTimeout, sessionTimeout) ||
                other.sessionTimeout == sessionTimeout) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.timezone, timezone) ||
                other.timezone == timezone) &&
            (identical(other.soundEnabled, soundEnabled) ||
                other.soundEnabled == soundEnabled) &&
            (identical(other.vibrationEnabled, vibrationEnabled) ||
                other.vibrationEnabled == vibrationEnabled) &&
            (identical(other.autoRefresh, autoRefresh) ||
                other.autoRefresh == autoRefresh) &&
            (identical(other.refreshInterval, refreshInterval) ||
                other.refreshInterval == refreshInterval) &&
            const DeepCollectionEquality()
                .equals(other._customSettings, _customSettings));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      language,
      themeMode,
      pushNotifications,
      emailNotifications,
      smsNotifications,
      marketAlerts,
      priceAlerts,
      newsAlerts,
      biometricAuth,
      sessionTimeout,
      currency,
      timezone,
      soundEnabled,
      vibrationEnabled,
      autoRefresh,
      refreshInterval,
      const DeepCollectionEquality().hash(_customSettings));

  /// Create a copy of UserPreferences
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UserPreferencesImplCopyWith<_$UserPreferencesImpl> get copyWith =>
      __$$UserPreferencesImplCopyWithImpl<_$UserPreferencesImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UserPreferencesImplToJson(
      this,
    );
  }
}

abstract class _UserPreferences implements UserPreferences {
  const factory _UserPreferences(
      {final String language,
      final String themeMode,
      final bool pushNotifications,
      final bool emailNotifications,
      final bool smsNotifications,
      final bool marketAlerts,
      final bool priceAlerts,
      final bool newsAlerts,
      final bool biometricAuth,
      final int sessionTimeout,
      final String currency,
      final String timezone,
      final bool soundEnabled,
      final bool vibrationEnabled,
      final bool autoRefresh,
      final int refreshInterval,
      final Map<String, dynamic>? customSettings}) = _$UserPreferencesImpl;

  factory _UserPreferences.fromJson(Map<String, dynamic> json) =
      _$UserPreferencesImpl.fromJson;

  @override
  String get language;
  @override
  String get themeMode; // light, dark, system
  @override
  bool get pushNotifications;
  @override
  bool get emailNotifications;
  @override
  bool get smsNotifications;
  @override
  bool get marketAlerts;
  @override
  bool get priceAlerts;
  @override
  bool get newsAlerts;
  @override
  bool get biometricAuth;
  @override
  int get sessionTimeout; // 分钟
  @override
  String get currency;
  @override
  String get timezone;
  @override
  bool get soundEnabled;
  @override
  bool get vibrationEnabled;
  @override
  bool get autoRefresh;
  @override
  int get refreshInterval; // 秒
  @override
  Map<String, dynamic>? get customSettings;

  /// Create a copy of UserPreferences
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UserPreferencesImplCopyWith<_$UserPreferencesImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

UserProfile _$UserProfileFromJson(Map<String, dynamic> json) {
  return _UserProfile.fromJson(json);
}

/// @nodoc
mixin _$UserProfile {
  String? get firstName => throw _privateConstructorUsedError;
  String? get lastName => throw _privateConstructorUsedError;
  String? get nickname => throw _privateConstructorUsedError;
  String? get bio => throw _privateConstructorUsedError;
  String? get company => throw _privateConstructorUsedError;
  String? get position => throw _privateConstructorUsedError;
  String? get location => throw _privateConstructorUsedError;
  String? get website => throw _privateConstructorUsedError;
  DateTime? get birthday => throw _privateConstructorUsedError;
  String? get gender =>
      throw _privateConstructorUsedError; // male, female, other
  List<String>? get interests => throw _privateConstructorUsedError;
  List<String>? get skills => throw _privateConstructorUsedError;
  Map<String, String>? get socialLinks => throw _privateConstructorUsedError;
  InvestmentProfile? get investment => throw _privateConstructorUsedError;

  /// Serializes this UserProfile to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of UserProfile
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UserProfileCopyWith<UserProfile> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserProfileCopyWith<$Res> {
  factory $UserProfileCopyWith(
          UserProfile value, $Res Function(UserProfile) then) =
      _$UserProfileCopyWithImpl<$Res, UserProfile>;
  @useResult
  $Res call(
      {String? firstName,
      String? lastName,
      String? nickname,
      String? bio,
      String? company,
      String? position,
      String? location,
      String? website,
      DateTime? birthday,
      String? gender,
      List<String>? interests,
      List<String>? skills,
      Map<String, String>? socialLinks,
      InvestmentProfile? investment});

  $InvestmentProfileCopyWith<$Res>? get investment;
}

/// @nodoc
class _$UserProfileCopyWithImpl<$Res, $Val extends UserProfile>
    implements $UserProfileCopyWith<$Res> {
  _$UserProfileCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of UserProfile
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? firstName = freezed,
    Object? lastName = freezed,
    Object? nickname = freezed,
    Object? bio = freezed,
    Object? company = freezed,
    Object? position = freezed,
    Object? location = freezed,
    Object? website = freezed,
    Object? birthday = freezed,
    Object? gender = freezed,
    Object? interests = freezed,
    Object? skills = freezed,
    Object? socialLinks = freezed,
    Object? investment = freezed,
  }) {
    return _then(_value.copyWith(
      firstName: freezed == firstName
          ? _value.firstName
          : firstName // ignore: cast_nullable_to_non_nullable
              as String?,
      lastName: freezed == lastName
          ? _value.lastName
          : lastName // ignore: cast_nullable_to_non_nullable
              as String?,
      nickname: freezed == nickname
          ? _value.nickname
          : nickname // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _value.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      company: freezed == company
          ? _value.company
          : company // ignore: cast_nullable_to_non_nullable
              as String?,
      position: freezed == position
          ? _value.position
          : position // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      website: freezed == website
          ? _value.website
          : website // ignore: cast_nullable_to_non_nullable
              as String?,
      birthday: freezed == birthday
          ? _value.birthday
          : birthday // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      gender: freezed == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String?,
      interests: freezed == interests
          ? _value.interests
          : interests // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      skills: freezed == skills
          ? _value.skills
          : skills // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      socialLinks: freezed == socialLinks
          ? _value.socialLinks
          : socialLinks // ignore: cast_nullable_to_non_nullable
              as Map<String, String>?,
      investment: freezed == investment
          ? _value.investment
          : investment // ignore: cast_nullable_to_non_nullable
              as InvestmentProfile?,
    ) as $Val);
  }

  /// Create a copy of UserProfile
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $InvestmentProfileCopyWith<$Res>? get investment {
    if (_value.investment == null) {
      return null;
    }

    return $InvestmentProfileCopyWith<$Res>(_value.investment!, (value) {
      return _then(_value.copyWith(investment: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$UserProfileImplCopyWith<$Res>
    implements $UserProfileCopyWith<$Res> {
  factory _$$UserProfileImplCopyWith(
          _$UserProfileImpl value, $Res Function(_$UserProfileImpl) then) =
      __$$UserProfileImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String? firstName,
      String? lastName,
      String? nickname,
      String? bio,
      String? company,
      String? position,
      String? location,
      String? website,
      DateTime? birthday,
      String? gender,
      List<String>? interests,
      List<String>? skills,
      Map<String, String>? socialLinks,
      InvestmentProfile? investment});

  @override
  $InvestmentProfileCopyWith<$Res>? get investment;
}

/// @nodoc
class __$$UserProfileImplCopyWithImpl<$Res>
    extends _$UserProfileCopyWithImpl<$Res, _$UserProfileImpl>
    implements _$$UserProfileImplCopyWith<$Res> {
  __$$UserProfileImplCopyWithImpl(
      _$UserProfileImpl _value, $Res Function(_$UserProfileImpl) _then)
      : super(_value, _then);

  /// Create a copy of UserProfile
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? firstName = freezed,
    Object? lastName = freezed,
    Object? nickname = freezed,
    Object? bio = freezed,
    Object? company = freezed,
    Object? position = freezed,
    Object? location = freezed,
    Object? website = freezed,
    Object? birthday = freezed,
    Object? gender = freezed,
    Object? interests = freezed,
    Object? skills = freezed,
    Object? socialLinks = freezed,
    Object? investment = freezed,
  }) {
    return _then(_$UserProfileImpl(
      firstName: freezed == firstName
          ? _value.firstName
          : firstName // ignore: cast_nullable_to_non_nullable
              as String?,
      lastName: freezed == lastName
          ? _value.lastName
          : lastName // ignore: cast_nullable_to_non_nullable
              as String?,
      nickname: freezed == nickname
          ? _value.nickname
          : nickname // ignore: cast_nullable_to_non_nullable
              as String?,
      bio: freezed == bio
          ? _value.bio
          : bio // ignore: cast_nullable_to_non_nullable
              as String?,
      company: freezed == company
          ? _value.company
          : company // ignore: cast_nullable_to_non_nullable
              as String?,
      position: freezed == position
          ? _value.position
          : position // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      website: freezed == website
          ? _value.website
          : website // ignore: cast_nullable_to_non_nullable
              as String?,
      birthday: freezed == birthday
          ? _value.birthday
          : birthday // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      gender: freezed == gender
          ? _value.gender
          : gender // ignore: cast_nullable_to_non_nullable
              as String?,
      interests: freezed == interests
          ? _value._interests
          : interests // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      skills: freezed == skills
          ? _value._skills
          : skills // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      socialLinks: freezed == socialLinks
          ? _value._socialLinks
          : socialLinks // ignore: cast_nullable_to_non_nullable
              as Map<String, String>?,
      investment: freezed == investment
          ? _value.investment
          : investment // ignore: cast_nullable_to_non_nullable
              as InvestmentProfile?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UserProfileImpl implements _UserProfile {
  const _$UserProfileImpl(
      {this.firstName,
      this.lastName,
      this.nickname,
      this.bio,
      this.company,
      this.position,
      this.location,
      this.website,
      this.birthday,
      this.gender,
      final List<String>? interests,
      final List<String>? skills,
      final Map<String, String>? socialLinks,
      this.investment})
      : _interests = interests,
        _skills = skills,
        _socialLinks = socialLinks;

  factory _$UserProfileImpl.fromJson(Map<String, dynamic> json) =>
      _$$UserProfileImplFromJson(json);

  @override
  final String? firstName;
  @override
  final String? lastName;
  @override
  final String? nickname;
  @override
  final String? bio;
  @override
  final String? company;
  @override
  final String? position;
  @override
  final String? location;
  @override
  final String? website;
  @override
  final DateTime? birthday;
  @override
  final String? gender;
// male, female, other
  final List<String>? _interests;
// male, female, other
  @override
  List<String>? get interests {
    final value = _interests;
    if (value == null) return null;
    if (_interests is EqualUnmodifiableListView) return _interests;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<String>? _skills;
  @override
  List<String>? get skills {
    final value = _skills;
    if (value == null) return null;
    if (_skills is EqualUnmodifiableListView) return _skills;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final Map<String, String>? _socialLinks;
  @override
  Map<String, String>? get socialLinks {
    final value = _socialLinks;
    if (value == null) return null;
    if (_socialLinks is EqualUnmodifiableMapView) return _socialLinks;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  final InvestmentProfile? investment;

  @override
  String toString() {
    return 'UserProfile(firstName: $firstName, lastName: $lastName, nickname: $nickname, bio: $bio, company: $company, position: $position, location: $location, website: $website, birthday: $birthday, gender: $gender, interests: $interests, skills: $skills, socialLinks: $socialLinks, investment: $investment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserProfileImpl &&
            (identical(other.firstName, firstName) ||
                other.firstName == firstName) &&
            (identical(other.lastName, lastName) ||
                other.lastName == lastName) &&
            (identical(other.nickname, nickname) ||
                other.nickname == nickname) &&
            (identical(other.bio, bio) || other.bio == bio) &&
            (identical(other.company, company) || other.company == company) &&
            (identical(other.position, position) ||
                other.position == position) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.website, website) || other.website == website) &&
            (identical(other.birthday, birthday) ||
                other.birthday == birthday) &&
            (identical(other.gender, gender) || other.gender == gender) &&
            const DeepCollectionEquality()
                .equals(other._interests, _interests) &&
            const DeepCollectionEquality().equals(other._skills, _skills) &&
            const DeepCollectionEquality()
                .equals(other._socialLinks, _socialLinks) &&
            (identical(other.investment, investment) ||
                other.investment == investment));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      firstName,
      lastName,
      nickname,
      bio,
      company,
      position,
      location,
      website,
      birthday,
      gender,
      const DeepCollectionEquality().hash(_interests),
      const DeepCollectionEquality().hash(_skills),
      const DeepCollectionEquality().hash(_socialLinks),
      investment);

  /// Create a copy of UserProfile
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UserProfileImplCopyWith<_$UserProfileImpl> get copyWith =>
      __$$UserProfileImplCopyWithImpl<_$UserProfileImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UserProfileImplToJson(
      this,
    );
  }
}

abstract class _UserProfile implements UserProfile {
  const factory _UserProfile(
      {final String? firstName,
      final String? lastName,
      final String? nickname,
      final String? bio,
      final String? company,
      final String? position,
      final String? location,
      final String? website,
      final DateTime? birthday,
      final String? gender,
      final List<String>? interests,
      final List<String>? skills,
      final Map<String, String>? socialLinks,
      final InvestmentProfile? investment}) = _$UserProfileImpl;

  factory _UserProfile.fromJson(Map<String, dynamic> json) =
      _$UserProfileImpl.fromJson;

  @override
  String? get firstName;
  @override
  String? get lastName;
  @override
  String? get nickname;
  @override
  String? get bio;
  @override
  String? get company;
  @override
  String? get position;
  @override
  String? get location;
  @override
  String? get website;
  @override
  DateTime? get birthday;
  @override
  String? get gender; // male, female, other
  @override
  List<String>? get interests;
  @override
  List<String>? get skills;
  @override
  Map<String, String>? get socialLinks;
  @override
  InvestmentProfile? get investment;

  /// Create a copy of UserProfile
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UserProfileImplCopyWith<_$UserProfileImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

InvestmentProfile _$InvestmentProfileFromJson(Map<String, dynamic> json) {
  return _InvestmentProfile.fromJson(json);
}

/// @nodoc
mixin _$InvestmentProfile {
  RiskLevel get riskTolerance => throw _privateConstructorUsedError;
  InvestmentExperience get experience => throw _privateConstructorUsedError;
  List<String> get investmentGoals => throw _privateConstructorUsedError;
  List<String> get preferredSectors => throw _privateConstructorUsedError;
  List<String> get avoidedSectors => throw _privateConstructorUsedError;
  double? get portfolioValue => throw _privateConstructorUsedError;
  double? get monthlyInvestment => throw _privateConstructorUsedError;
  InvestmentHorizon get timeHorizon => throw _privateConstructorUsedError;
  Map<String, dynamic>? get additionalInfo =>
      throw _privateConstructorUsedError;

  /// Serializes this InvestmentProfile to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of InvestmentProfile
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $InvestmentProfileCopyWith<InvestmentProfile> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $InvestmentProfileCopyWith<$Res> {
  factory $InvestmentProfileCopyWith(
          InvestmentProfile value, $Res Function(InvestmentProfile) then) =
      _$InvestmentProfileCopyWithImpl<$Res, InvestmentProfile>;
  @useResult
  $Res call(
      {RiskLevel riskTolerance,
      InvestmentExperience experience,
      List<String> investmentGoals,
      List<String> preferredSectors,
      List<String> avoidedSectors,
      double? portfolioValue,
      double? monthlyInvestment,
      InvestmentHorizon timeHorizon,
      Map<String, dynamic>? additionalInfo});
}

/// @nodoc
class _$InvestmentProfileCopyWithImpl<$Res, $Val extends InvestmentProfile>
    implements $InvestmentProfileCopyWith<$Res> {
  _$InvestmentProfileCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of InvestmentProfile
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? riskTolerance = null,
    Object? experience = null,
    Object? investmentGoals = null,
    Object? preferredSectors = null,
    Object? avoidedSectors = null,
    Object? portfolioValue = freezed,
    Object? monthlyInvestment = freezed,
    Object? timeHorizon = null,
    Object? additionalInfo = freezed,
  }) {
    return _then(_value.copyWith(
      riskTolerance: null == riskTolerance
          ? _value.riskTolerance
          : riskTolerance // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      experience: null == experience
          ? _value.experience
          : experience // ignore: cast_nullable_to_non_nullable
              as InvestmentExperience,
      investmentGoals: null == investmentGoals
          ? _value.investmentGoals
          : investmentGoals // ignore: cast_nullable_to_non_nullable
              as List<String>,
      preferredSectors: null == preferredSectors
          ? _value.preferredSectors
          : preferredSectors // ignore: cast_nullable_to_non_nullable
              as List<String>,
      avoidedSectors: null == avoidedSectors
          ? _value.avoidedSectors
          : avoidedSectors // ignore: cast_nullable_to_non_nullable
              as List<String>,
      portfolioValue: freezed == portfolioValue
          ? _value.portfolioValue
          : portfolioValue // ignore: cast_nullable_to_non_nullable
              as double?,
      monthlyInvestment: freezed == monthlyInvestment
          ? _value.monthlyInvestment
          : monthlyInvestment // ignore: cast_nullable_to_non_nullable
              as double?,
      timeHorizon: null == timeHorizon
          ? _value.timeHorizon
          : timeHorizon // ignore: cast_nullable_to_non_nullable
              as InvestmentHorizon,
      additionalInfo: freezed == additionalInfo
          ? _value.additionalInfo
          : additionalInfo // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$InvestmentProfileImplCopyWith<$Res>
    implements $InvestmentProfileCopyWith<$Res> {
  factory _$$InvestmentProfileImplCopyWith(_$InvestmentProfileImpl value,
          $Res Function(_$InvestmentProfileImpl) then) =
      __$$InvestmentProfileImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {RiskLevel riskTolerance,
      InvestmentExperience experience,
      List<String> investmentGoals,
      List<String> preferredSectors,
      List<String> avoidedSectors,
      double? portfolioValue,
      double? monthlyInvestment,
      InvestmentHorizon timeHorizon,
      Map<String, dynamic>? additionalInfo});
}

/// @nodoc
class __$$InvestmentProfileImplCopyWithImpl<$Res>
    extends _$InvestmentProfileCopyWithImpl<$Res, _$InvestmentProfileImpl>
    implements _$$InvestmentProfileImplCopyWith<$Res> {
  __$$InvestmentProfileImplCopyWithImpl(_$InvestmentProfileImpl _value,
      $Res Function(_$InvestmentProfileImpl) _then)
      : super(_value, _then);

  /// Create a copy of InvestmentProfile
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? riskTolerance = null,
    Object? experience = null,
    Object? investmentGoals = null,
    Object? preferredSectors = null,
    Object? avoidedSectors = null,
    Object? portfolioValue = freezed,
    Object? monthlyInvestment = freezed,
    Object? timeHorizon = null,
    Object? additionalInfo = freezed,
  }) {
    return _then(_$InvestmentProfileImpl(
      riskTolerance: null == riskTolerance
          ? _value.riskTolerance
          : riskTolerance // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      experience: null == experience
          ? _value.experience
          : experience // ignore: cast_nullable_to_non_nullable
              as InvestmentExperience,
      investmentGoals: null == investmentGoals
          ? _value._investmentGoals
          : investmentGoals // ignore: cast_nullable_to_non_nullable
              as List<String>,
      preferredSectors: null == preferredSectors
          ? _value._preferredSectors
          : preferredSectors // ignore: cast_nullable_to_non_nullable
              as List<String>,
      avoidedSectors: null == avoidedSectors
          ? _value._avoidedSectors
          : avoidedSectors // ignore: cast_nullable_to_non_nullable
              as List<String>,
      portfolioValue: freezed == portfolioValue
          ? _value.portfolioValue
          : portfolioValue // ignore: cast_nullable_to_non_nullable
              as double?,
      monthlyInvestment: freezed == monthlyInvestment
          ? _value.monthlyInvestment
          : monthlyInvestment // ignore: cast_nullable_to_non_nullable
              as double?,
      timeHorizon: null == timeHorizon
          ? _value.timeHorizon
          : timeHorizon // ignore: cast_nullable_to_non_nullable
              as InvestmentHorizon,
      additionalInfo: freezed == additionalInfo
          ? _value._additionalInfo
          : additionalInfo // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$InvestmentProfileImpl implements _InvestmentProfile {
  const _$InvestmentProfileImpl(
      {this.riskTolerance = RiskLevel.moderate,
      this.experience = InvestmentExperience.beginner,
      final List<String> investmentGoals = const [],
      final List<String> preferredSectors = const [],
      final List<String> avoidedSectors = const [],
      this.portfolioValue,
      this.monthlyInvestment,
      this.timeHorizon = InvestmentHorizon.longTerm,
      final Map<String, dynamic>? additionalInfo})
      : _investmentGoals = investmentGoals,
        _preferredSectors = preferredSectors,
        _avoidedSectors = avoidedSectors,
        _additionalInfo = additionalInfo;

  factory _$InvestmentProfileImpl.fromJson(Map<String, dynamic> json) =>
      _$$InvestmentProfileImplFromJson(json);

  @override
  @JsonKey()
  final RiskLevel riskTolerance;
  @override
  @JsonKey()
  final InvestmentExperience experience;
  final List<String> _investmentGoals;
  @override
  @JsonKey()
  List<String> get investmentGoals {
    if (_investmentGoals is EqualUnmodifiableListView) return _investmentGoals;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_investmentGoals);
  }

  final List<String> _preferredSectors;
  @override
  @JsonKey()
  List<String> get preferredSectors {
    if (_preferredSectors is EqualUnmodifiableListView)
      return _preferredSectors;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_preferredSectors);
  }

  final List<String> _avoidedSectors;
  @override
  @JsonKey()
  List<String> get avoidedSectors {
    if (_avoidedSectors is EqualUnmodifiableListView) return _avoidedSectors;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_avoidedSectors);
  }

  @override
  final double? portfolioValue;
  @override
  final double? monthlyInvestment;
  @override
  @JsonKey()
  final InvestmentHorizon timeHorizon;
  final Map<String, dynamic>? _additionalInfo;
  @override
  Map<String, dynamic>? get additionalInfo {
    final value = _additionalInfo;
    if (value == null) return null;
    if (_additionalInfo is EqualUnmodifiableMapView) return _additionalInfo;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'InvestmentProfile(riskTolerance: $riskTolerance, experience: $experience, investmentGoals: $investmentGoals, preferredSectors: $preferredSectors, avoidedSectors: $avoidedSectors, portfolioValue: $portfolioValue, monthlyInvestment: $monthlyInvestment, timeHorizon: $timeHorizon, additionalInfo: $additionalInfo)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InvestmentProfileImpl &&
            (identical(other.riskTolerance, riskTolerance) ||
                other.riskTolerance == riskTolerance) &&
            (identical(other.experience, experience) ||
                other.experience == experience) &&
            const DeepCollectionEquality()
                .equals(other._investmentGoals, _investmentGoals) &&
            const DeepCollectionEquality()
                .equals(other._preferredSectors, _preferredSectors) &&
            const DeepCollectionEquality()
                .equals(other._avoidedSectors, _avoidedSectors) &&
            (identical(other.portfolioValue, portfolioValue) ||
                other.portfolioValue == portfolioValue) &&
            (identical(other.monthlyInvestment, monthlyInvestment) ||
                other.monthlyInvestment == monthlyInvestment) &&
            (identical(other.timeHorizon, timeHorizon) ||
                other.timeHorizon == timeHorizon) &&
            const DeepCollectionEquality()
                .equals(other._additionalInfo, _additionalInfo));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      riskTolerance,
      experience,
      const DeepCollectionEquality().hash(_investmentGoals),
      const DeepCollectionEquality().hash(_preferredSectors),
      const DeepCollectionEquality().hash(_avoidedSectors),
      portfolioValue,
      monthlyInvestment,
      timeHorizon,
      const DeepCollectionEquality().hash(_additionalInfo));

  /// Create a copy of InvestmentProfile
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$InvestmentProfileImplCopyWith<_$InvestmentProfileImpl> get copyWith =>
      __$$InvestmentProfileImplCopyWithImpl<_$InvestmentProfileImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$InvestmentProfileImplToJson(
      this,
    );
  }
}

abstract class _InvestmentProfile implements InvestmentProfile {
  const factory _InvestmentProfile(
      {final RiskLevel riskTolerance,
      final InvestmentExperience experience,
      final List<String> investmentGoals,
      final List<String> preferredSectors,
      final List<String> avoidedSectors,
      final double? portfolioValue,
      final double? monthlyInvestment,
      final InvestmentHorizon timeHorizon,
      final Map<String, dynamic>? additionalInfo}) = _$InvestmentProfileImpl;

  factory _InvestmentProfile.fromJson(Map<String, dynamic> json) =
      _$InvestmentProfileImpl.fromJson;

  @override
  RiskLevel get riskTolerance;
  @override
  InvestmentExperience get experience;
  @override
  List<String> get investmentGoals;
  @override
  List<String> get preferredSectors;
  @override
  List<String> get avoidedSectors;
  @override
  double? get portfolioValue;
  @override
  double? get monthlyInvestment;
  @override
  InvestmentHorizon get timeHorizon;
  @override
  Map<String, dynamic>? get additionalInfo;

  /// Create a copy of InvestmentProfile
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$InvestmentProfileImplCopyWith<_$InvestmentProfileImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
