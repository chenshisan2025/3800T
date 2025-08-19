// RBAC 权限控制系统类型定义

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  SUPPORT = 'support',
}

// 权限枚举
export enum Permission {
  // 用户管理权限
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // 订阅管理权限
  SUBSCRIPTION_READ = 'subscription:read',
  SUBSCRIPTION_WRITE = 'subscription:write',
  SUBSCRIPTION_DELETE = 'subscription:delete',
  
  // 自选股和提醒权限
  WATCHLIST_READ = 'watchlist:read',
  WATCHLIST_WRITE = 'watchlist:write',
  WATCHLIST_DELETE = 'watchlist:delete',
  
  // AI报告权限
  REPORT_READ = 'report:read',
  REPORT_WRITE = 'report:write',
  REPORT_DELETE = 'report:delete',
  
  // 数据源配置权限（仅admin）
  DATASOURCE_READ = 'datasource:read',
  DATASOURCE_WRITE = 'datasource:write',
  DATASOURCE_DELETE = 'datasource:delete',
  
  // 模型Key配置权限（仅admin）
  MODEL_KEY_READ = 'model_key:read',
  MODEL_KEY_WRITE = 'model_key:write',
  MODEL_KEY_DELETE = 'model_key:delete',
  
  // 审计日志权限
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  
  // 系统设置权限
  SYSTEM_READ = 'system:read',
  SYSTEM_WRITE = 'system:write',
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 管理员拥有所有权限
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_WRITE,
    Permission.SUBSCRIPTION_DELETE,
    Permission.WATCHLIST_READ,
    Permission.WATCHLIST_WRITE,
    Permission.WATCHLIST_DELETE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE,
    Permission.REPORT_DELETE,
    Permission.DATASOURCE_READ,
    Permission.DATASOURCE_WRITE,
    Permission.DATASOURCE_DELETE,
    Permission.MODEL_KEY_READ,
    Permission.MODEL_KEY_WRITE,
    Permission.MODEL_KEY_DELETE,
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
    Permission.SYSTEM_READ,
    Permission.SYSTEM_WRITE,
  ],
  [UserRole.ANALYST]: [
    // 分析师权限：可查看和管理报告、用户、订阅等，但不能配置数据源和模型Key
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_WRITE,
    Permission.WATCHLIST_READ,
    Permission.WATCHLIST_WRITE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE,
    Permission.REPORT_DELETE,
    Permission.AUDIT_READ,
    Permission.SYSTEM_READ,
  ],
  [UserRole.SUPPORT]: [
    // 客服权限：主要负责用户支持，可查看用户、订阅、自选股等信息
    Permission.USER_READ,
    Permission.SUBSCRIPTION_READ,
    Permission.WATCHLIST_READ,
    Permission.REPORT_READ,
    Permission.AUDIT_READ,
    Permission.SYSTEM_READ,
  ],
};

// 页面访问权限映射
export const PAGE_PERMISSIONS: Record<string, Permission[]> = {
  '/dashboard': [], // 所有角色都可以访问仪表板
  '/dashboard/users': [Permission.USER_READ],
  '/dashboard/subscriptions': [Permission.SUBSCRIPTION_READ],
  '/dashboard/watchlist': [Permission.WATCHLIST_READ],
  '/dashboard/reports': [Permission.REPORT_READ],
  '/dashboard/datasource': [Permission.DATASOURCE_READ],
  '/dashboard/audit': [Permission.AUDIT_READ],
  '/dashboard/settings': [Permission.SYSTEM_READ],
};

// 角色显示名称
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.ANALYST]: '分析师',
  [UserRole.SUPPORT]: '客服',
};

// 角色描述
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: '拥有系统所有权限，可配置数据源和模型Key',
  [UserRole.ANALYST]: '可管理用户、订阅、报告等，但不能配置数据源',
  [UserRole.SUPPORT]: '主要负责用户支持，具有查看权限',
};

// 权限检查函数
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

// 检查用户是否可以访问页面
export function canAccessPage(userRole: UserRole, pathname: string): boolean {
  const requiredPermissions = PAGE_PERMISSIONS[pathname];
  
  // 如果页面不需要特殊权限，所有角色都可以访问
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  // 检查用户是否拥有所需的所有权限
  return requiredPermissions.every(permission => hasPermission(userRole, permission));
}

// 获取用户可访问的菜单项
export function getAccessibleMenuItems(userRole: UserRole) {
  const allMenuItems = [
    { key: '/dashboard', label: '概览', permission: [] },
    { key: '/dashboard/users', label: '用户管理', permission: [Permission.USER_READ] },
    { key: '/dashboard/subscriptions', label: '订阅管理', permission: [Permission.SUBSCRIPTION_READ] },
    { key: '/dashboard/watchlist', label: 'Watchlist&Alert', permission: [Permission.WATCHLIST_READ] },
    { key: '/dashboard/reports', label: 'AI报告', permission: [Permission.REPORT_READ] },
    { key: '/dashboard/datasource', label: '数据源配置', permission: [Permission.DATASOURCE_READ] },
    { key: '/dashboard/audit', label: '审计日志', permission: [Permission.AUDIT_READ] },
  ];
  
  return allMenuItems.filter(item => {
    if (item.permission.length === 0) return true;
    return item.permission.every(permission => hasPermission(userRole, permission));
  });
}