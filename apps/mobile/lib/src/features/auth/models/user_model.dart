import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

/// 用户模型
@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    required String name,
    String? phone,
    String? avatar,
    @Default(false) bool isEmailVerified,
    @Default(false) bool isPhoneVerified,
    @Default(UserRole.user) UserRole role,
    @Default(UserStatus.active) UserStatus status,
    UserPreferences? preferences,
    UserProfile? profile,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? lastLoginAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}

/// 用户角色
enum UserRole {
  @JsonValue('admin')
  admin,
  @JsonValue('user')
  user,
  @JsonValue('vip')
  vip,
  @JsonValue('premium')
  premium,
}

/// 用户状态
enum UserStatus {
  @JsonValue('active')
  active,
  @JsonValue('inactive')
  inactive,
  @JsonValue('suspended')
  suspended,
  @JsonValue('deleted')
  deleted,
}

/// 用户偏好设置
@freezed
class UserPreferences with _$UserPreferences {
  const factory UserPreferences({
    @Default('zh_CN') String language,
    @Default('system') String themeMode, // light, dark, system
    @Default(true) bool pushNotifications,
    @Default(true) bool emailNotifications,
    @Default(true) bool smsNotifications,
    @Default(true) bool marketAlerts,
    @Default(true) bool priceAlerts,
    @Default(true) bool newsAlerts,
    @Default(false) bool biometricAuth,
    @Default(30) int sessionTimeout, // 分钟
    @Default('CNY') String currency,
    @Default('Asia/Shanghai') String timezone,
    @Default(false) bool soundEnabled,
    @Default(false) bool vibrationEnabled,
    @Default(true) bool autoRefresh,
    @Default(5) int refreshInterval, // 秒
    Map<String, dynamic>? customSettings,
  }) = _UserPreferences;

  factory UserPreferences.fromJson(Map<String, dynamic> json) =>
      _$UserPreferencesFromJson(json);
}

/// 用户档案信息
@freezed
class UserProfile with _$UserProfile {
  const factory UserProfile({
    String? firstName,
    String? lastName,
    String? nickname,
    String? bio,
    String? company,
    String? position,
    String? location,
    String? website,
    DateTime? birthday,
    String? gender, // male, female, other
    List<String>? interests,
    List<String>? skills,
    Map<String, String>? socialLinks,
    InvestmentProfile? investment,
  }) = _UserProfile;

  factory UserProfile.fromJson(Map<String, dynamic> json) =>
      _$UserProfileFromJson(json);
}

/// 投资档案
@freezed
class InvestmentProfile with _$InvestmentProfile {
  const factory InvestmentProfile({
    @Default(RiskLevel.moderate) RiskLevel riskTolerance,
    @Default(InvestmentExperience.beginner) InvestmentExperience experience,
    @Default([]) List<String> investmentGoals,
    @Default([]) List<String> preferredSectors,
    @Default([]) List<String> avoidedSectors,
    double? portfolioValue,
    double? monthlyInvestment,
    @Default(InvestmentHorizon.longTerm) InvestmentHorizon timeHorizon,
    Map<String, dynamic>? additionalInfo,
  }) = _InvestmentProfile;

  factory InvestmentProfile.fromJson(Map<String, dynamic> json) =>
      _$InvestmentProfileFromJson(json);
}

/// 风险等级
enum RiskLevel {
  @JsonValue('conservative')
  conservative,
  @JsonValue('moderate')
  moderate,
  @JsonValue('aggressive')
  aggressive,
  @JsonValue('very_aggressive')
  veryAggressive,
}

/// 投资经验
enum InvestmentExperience {
  @JsonValue('beginner')
  beginner,
  @JsonValue('intermediate')
  intermediate,
  @JsonValue('advanced')
  advanced,
  @JsonValue('expert')
  expert,
}

/// 投资期限
enum InvestmentHorizon {
  @JsonValue('short_term')
  shortTerm, // < 1年
  @JsonValue('medium_term')
  mediumTerm, // 1-5年
  @JsonValue('long_term')
  longTerm, // > 5年
}

/// 用户模型扩展方法
extension UserModelX on UserModel {
  /// 获取显示名称
  String get displayName {
    if (profile?.nickname?.isNotEmpty == true) {
      return profile!.nickname!;
    }
    if (profile?.firstName?.isNotEmpty == true) {
      final lastName = profile?.lastName ?? '';
      return '${profile!.firstName!} $lastName'.trim();
    }
    return name;
  }
  
  /// 获取全名
  String get fullName {
    if (profile?.firstName?.isNotEmpty == true) {
      final lastName = profile?.lastName ?? '';
      return '${profile!.firstName!} $lastName'.trim();
    }
    return name;
  }
  
  /// 是否为管理员
  bool get isAdmin => role == UserRole.admin;
  
  /// 是否为VIP用户
  bool get isVip => role == UserRole.vip || role == UserRole.premium;
  
  /// 是否为高级用户
  bool get isPremium => role == UserRole.premium;
  
  /// 是否激活
  bool get isActive => status == UserStatus.active;
  
  /// 是否已验证邮箱
  bool get hasVerifiedEmail => isEmailVerified;
  
  /// 是否已验证手机
  bool get hasVerifiedPhone => isPhoneVerified;
  
  /// 是否完全验证
  bool get isFullyVerified => isEmailVerified && (phone == null || isPhoneVerified);
  
  /// 获取头像URL
  String? get avatarUrl => avatar;
  
  /// 获取默认头像
  String get defaultAvatar {
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U';
    return 'https://ui-avatars.com/api/?name=$initial&background=2166A5&color=fff&size=128';
  }
  
  /// 获取头像或默认头像
  String get avatarOrDefault => avatarUrl ?? defaultAvatar;
  
  /// 是否启用生物识别
  bool get isBiometricEnabled => preferences?.biometricAuth ?? false;
  
  /// 获取主题模式
  String get themeMode => preferences?.themeMode ?? 'system';
  
  /// 获取语言
  String get language => preferences?.language ?? 'zh_CN';
  
  /// 获取货币
  String get currency => preferences?.currency ?? 'CNY';
  
  /// 获取时区
  String get timezone => preferences?.timezone ?? 'Asia/Shanghai';
  
  /// 获取风险等级
  RiskLevel get riskLevel => profile?.investment?.riskTolerance ?? RiskLevel.moderate;
  
  /// 获取投资经验
  InvestmentExperience get investmentExperience => 
      profile?.investment?.experience ?? InvestmentExperience.beginner;
  
  /// 是否为新用户（注册不到7天）
  bool get isNewUser {
    if (createdAt == null) return false;
    return DateTime.now().difference(createdAt!).inDays < 7;
  }
  
  /// 获取注册天数
  int get daysSinceRegistration {
    if (createdAt == null) return 0;
    return DateTime.now().difference(createdAt!).inDays;
  }
  
  /// 获取最后登录时间描述
  String get lastLoginDescription {
    if (lastLoginAt == null) return '从未登录';
    
    final now = DateTime.now();
    final diff = now.difference(lastLoginAt!);
    
    if (diff.inMinutes < 1) {
      return '刚刚';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes}分钟前';
    } else if (diff.inDays < 1) {
      return '${diff.inHours}小时前';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}天前';
    } else {
      return '${lastLoginAt!.year}-${lastLoginAt!.month.toString().padLeft(2, '0')}-${lastLoginAt!.day.toString().padLeft(2, '0')}';
    }
  }
  
  /// 复制并更新用户信息
  UserModel updateProfile({
    String? name,
    String? phone,
    String? avatar,
    UserPreferences? preferences,
    UserProfile? profile,
  }) {
    return copyWith(
      name: name ?? this.name,
      phone: phone ?? this.phone,
      avatar: avatar ?? this.avatar,
      preferences: preferences ?? this.preferences,
      profile: profile ?? this.profile,
      updatedAt: DateTime.now(),
    );
  }
  
  /// 更新最后登录时间
  UserModel updateLastLogin() {
    return copyWith(
      lastLoginAt: DateTime.now(),
    );
  }
  
  /// 验证邮箱
  UserModel verifyEmail() {
    return copyWith(
      isEmailVerified: true,
      updatedAt: DateTime.now(),
    );
  }
  
  /// 验证手机
  UserModel verifyPhone() {
    return copyWith(
      isPhoneVerified: true,
      updatedAt: DateTime.now(),
    );
  }
}

/// 用户角色扩展
extension UserRoleX on UserRole {
  /// 获取角色显示名称
  String get displayName {
    switch (this) {
      case UserRole.admin:
        return '管理员';
      case UserRole.user:
        return '普通用户';
      case UserRole.vip:
        return 'VIP用户';
      case UserRole.premium:
        return '高级用户';
    }
  }
  
  /// 获取角色权限等级
  int get level {
    switch (this) {
      case UserRole.admin:
        return 100;
      case UserRole.premium:
        return 50;
      case UserRole.vip:
        return 30;
      case UserRole.user:
        return 10;
    }
  }
  
  /// 是否有权限
  bool hasPermission(UserRole requiredRole) {
    return level >= requiredRole.level;
  }
}

/// 用户状态扩展
extension UserStatusX on UserStatus {
  /// 获取状态显示名称
  String get displayName {
    switch (this) {
      case UserStatus.active:
        return '正常';
      case UserStatus.inactive:
        return '未激活';
      case UserStatus.suspended:
        return '已暂停';
      case UserStatus.deleted:
        return '已删除';
    }
  }
  
  /// 是否可用
  bool get isAvailable => this == UserStatus.active;
}

/// 风险等级扩展
extension RiskLevelX on RiskLevel {
  /// 获取风险等级显示名称
  String get displayName {
    switch (this) {
      case RiskLevel.conservative:
        return '保守型';
      case RiskLevel.moderate:
        return '稳健型';
      case RiskLevel.aggressive:
        return '积极型';
      case RiskLevel.veryAggressive:
        return '激进型';
    }
  }
  
  /// 获取风险等级描述
  String get description {
    switch (this) {
      case RiskLevel.conservative:
        return '追求资本保值，不愿承担投资风险';
      case RiskLevel.moderate:
        return '希望获得稳定收益，能承担一定风险';
      case RiskLevel.aggressive:
        return '追求较高收益，能承担较大风险';
      case RiskLevel.veryAggressive:
        return '追求最高收益，能承担很大风险';
    }
  }
  
  /// 获取风险等级颜色
  String get colorHex {
    switch (this) {
      case RiskLevel.conservative:
        return '#52C41A'; // 绿色
      case RiskLevel.moderate:
        return '#1890FF'; // 蓝色
      case RiskLevel.aggressive:
        return '#FA8C16'; // 橙色
      case RiskLevel.veryAggressive:
        return '#F5222D'; // 红色
    }
  }
}