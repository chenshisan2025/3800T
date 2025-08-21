// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UserModelImpl _$$UserModelImplFromJson(Map<String, dynamic> json) =>
    _$UserModelImpl(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
      isEmailVerified: json['isEmailVerified'] as bool? ?? false,
      isPhoneVerified: json['isPhoneVerified'] as bool? ?? false,
      role:
          $enumDecodeNullable(_$UserRoleEnumMap, json['role']) ?? UserRole.user,
      status: $enumDecodeNullable(_$UserStatusEnumMap, json['status']) ??
          UserStatus.active,
      preferences: json['preferences'] == null
          ? null
          : UserPreferences.fromJson(
              json['preferences'] as Map<String, dynamic>),
      profile: json['profile'] == null
          ? null
          : UserProfile.fromJson(json['profile'] as Map<String, dynamic>),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      lastLoginAt: json['lastLoginAt'] == null
          ? null
          : DateTime.parse(json['lastLoginAt'] as String),
    );

Map<String, dynamic> _$$UserModelImplToJson(_$UserModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'name': instance.name,
      'phone': instance.phone,
      'avatar': instance.avatar,
      'isEmailVerified': instance.isEmailVerified,
      'isPhoneVerified': instance.isPhoneVerified,
      'role': _$UserRoleEnumMap[instance.role]!,
      'status': _$UserStatusEnumMap[instance.status]!,
      'preferences': instance.preferences,
      'profile': instance.profile,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'lastLoginAt': instance.lastLoginAt?.toIso8601String(),
    };

const _$UserRoleEnumMap = {
  UserRole.admin: 'admin',
  UserRole.user: 'user',
  UserRole.vip: 'vip',
  UserRole.premium: 'premium',
};

const _$UserStatusEnumMap = {
  UserStatus.active: 'active',
  UserStatus.inactive: 'inactive',
  UserStatus.suspended: 'suspended',
  UserStatus.deleted: 'deleted',
};

_$UserPreferencesImpl _$$UserPreferencesImplFromJson(
        Map<String, dynamic> json) =>
    _$UserPreferencesImpl(
      language: json['language'] as String? ?? 'zh_CN',
      themeMode: json['themeMode'] as String? ?? 'system',
      pushNotifications: json['pushNotifications'] as bool? ?? true,
      emailNotifications: json['emailNotifications'] as bool? ?? true,
      smsNotifications: json['smsNotifications'] as bool? ?? true,
      marketAlerts: json['marketAlerts'] as bool? ?? true,
      priceAlerts: json['priceAlerts'] as bool? ?? true,
      newsAlerts: json['newsAlerts'] as bool? ?? true,
      biometricAuth: json['biometricAuth'] as bool? ?? false,
      sessionTimeout: (json['sessionTimeout'] as num?)?.toInt() ?? 30,
      currency: json['currency'] as String? ?? 'CNY',
      timezone: json['timezone'] as String? ?? 'Asia/Shanghai',
      soundEnabled: json['soundEnabled'] as bool? ?? false,
      vibrationEnabled: json['vibrationEnabled'] as bool? ?? false,
      autoRefresh: json['autoRefresh'] as bool? ?? true,
      refreshInterval: (json['refreshInterval'] as num?)?.toInt() ?? 5,
      customSettings: json['customSettings'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$UserPreferencesImplToJson(
        _$UserPreferencesImpl instance) =>
    <String, dynamic>{
      'language': instance.language,
      'themeMode': instance.themeMode,
      'pushNotifications': instance.pushNotifications,
      'emailNotifications': instance.emailNotifications,
      'smsNotifications': instance.smsNotifications,
      'marketAlerts': instance.marketAlerts,
      'priceAlerts': instance.priceAlerts,
      'newsAlerts': instance.newsAlerts,
      'biometricAuth': instance.biometricAuth,
      'sessionTimeout': instance.sessionTimeout,
      'currency': instance.currency,
      'timezone': instance.timezone,
      'soundEnabled': instance.soundEnabled,
      'vibrationEnabled': instance.vibrationEnabled,
      'autoRefresh': instance.autoRefresh,
      'refreshInterval': instance.refreshInterval,
      'customSettings': instance.customSettings,
    };

_$UserProfileImpl _$$UserProfileImplFromJson(Map<String, dynamic> json) =>
    _$UserProfileImpl(
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      nickname: json['nickname'] as String?,
      bio: json['bio'] as String?,
      company: json['company'] as String?,
      position: json['position'] as String?,
      location: json['location'] as String?,
      website: json['website'] as String?,
      birthday: json['birthday'] == null
          ? null
          : DateTime.parse(json['birthday'] as String),
      gender: json['gender'] as String?,
      interests: (json['interests'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      skills:
          (json['skills'] as List<dynamic>?)?.map((e) => e as String).toList(),
      socialLinks: (json['socialLinks'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
      investment: json['investment'] == null
          ? null
          : InvestmentProfile.fromJson(
              json['investment'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$UserProfileImplToJson(_$UserProfileImpl instance) =>
    <String, dynamic>{
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'nickname': instance.nickname,
      'bio': instance.bio,
      'company': instance.company,
      'position': instance.position,
      'location': instance.location,
      'website': instance.website,
      'birthday': instance.birthday?.toIso8601String(),
      'gender': instance.gender,
      'interests': instance.interests,
      'skills': instance.skills,
      'socialLinks': instance.socialLinks,
      'investment': instance.investment,
    };

_$InvestmentProfileImpl _$$InvestmentProfileImplFromJson(
        Map<String, dynamic> json) =>
    _$InvestmentProfileImpl(
      riskTolerance:
          $enumDecodeNullable(_$RiskLevelEnumMap, json['riskTolerance']) ??
              RiskLevel.moderate,
      experience: $enumDecodeNullable(
              _$InvestmentExperienceEnumMap, json['experience']) ??
          InvestmentExperience.beginner,
      investmentGoals: (json['investmentGoals'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      preferredSectors: (json['preferredSectors'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      avoidedSectors: (json['avoidedSectors'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      portfolioValue: (json['portfolioValue'] as num?)?.toDouble(),
      monthlyInvestment: (json['monthlyInvestment'] as num?)?.toDouble(),
      timeHorizon: $enumDecodeNullable(
              _$InvestmentHorizonEnumMap, json['timeHorizon']) ??
          InvestmentHorizon.longTerm,
      additionalInfo: json['additionalInfo'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$InvestmentProfileImplToJson(
        _$InvestmentProfileImpl instance) =>
    <String, dynamic>{
      'riskTolerance': _$RiskLevelEnumMap[instance.riskTolerance]!,
      'experience': _$InvestmentExperienceEnumMap[instance.experience]!,
      'investmentGoals': instance.investmentGoals,
      'preferredSectors': instance.preferredSectors,
      'avoidedSectors': instance.avoidedSectors,
      'portfolioValue': instance.portfolioValue,
      'monthlyInvestment': instance.monthlyInvestment,
      'timeHorizon': _$InvestmentHorizonEnumMap[instance.timeHorizon]!,
      'additionalInfo': instance.additionalInfo,
    };

const _$RiskLevelEnumMap = {
  RiskLevel.conservative: 'conservative',
  RiskLevel.moderate: 'moderate',
  RiskLevel.aggressive: 'aggressive',
  RiskLevel.veryAggressive: 'very_aggressive',
};

const _$InvestmentExperienceEnumMap = {
  InvestmentExperience.beginner: 'beginner',
  InvestmentExperience.intermediate: 'intermediate',
  InvestmentExperience.advanced: 'advanced',
  InvestmentExperience.expert: 'expert',
};

const _$InvestmentHorizonEnumMap = {
  InvestmentHorizon.shortTerm: 'short_term',
  InvestmentHorizon.mediumTerm: 'medium_term',
  InvestmentHorizon.longTerm: 'long_term',
};
