/**
 * RBAC (Role-Based Access Control) 权限控制工具
 * 用于后端API权限验证
 */

// 用户角色枚举
export enum UserRole {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  SUPPORT = 'SUPPORT',
}

// 权限枚举
export enum Permission {
  // 用户管理权限
  USER_READ = 'USER_READ',
  USER_WRITE = 'USER_WRITE',
  USER_DELETE = 'USER_DELETE',

  // 订阅管理权限
  SUBSCRIPTION_READ = 'SUBSCRIPTION_READ',
  SUBSCRIPTION_WRITE = 'SUBSCRIPTION_WRITE',

  // 自选股管理权限
  WATCHLIST_READ = 'WATCHLIST_READ',
  WATCHLIST_WRITE = 'WATCHLIST_WRITE',
  WATCHLIST_DELETE = 'WATCHLIST_DELETE',

  // AI报告管理权限
  REPORT_READ = 'REPORT_READ',
  REPORT_WRITE = 'REPORT_WRITE',
  REPORT_DELETE = 'REPORT_DELETE',

  // 数据源配置权限（仅管理员）
  DATASOURCE_READ = 'DATASOURCE_READ',
  DATASOURCE_WRITE = 'DATASOURCE_WRITE',
  DATASOURCE_DELETE = 'DATASOURCE_DELETE',

  // 模型Key管理权限（仅管理员）
  MODEL_KEY_READ = 'MODEL_KEY_READ',
  MODEL_KEY_WRITE = 'MODEL_KEY_WRITE',
  MODEL_KEY_DELETE = 'MODEL_KEY_DELETE',

  // 审计日志权限
  AUDIT_READ = 'AUDIT_READ',
  AUDIT_EXPORT = 'AUDIT_EXPORT',

  // 系统管理权限
  SYSTEM_READ = 'SYSTEM_READ',
  SYSTEM_WRITE = 'SYSTEM_WRITE',
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
    // 分析师权限：用户、订阅、自选股、报告的读写权限，审计日志只读
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_WRITE,
    Permission.WATCHLIST_READ,
    Permission.WATCHLIST_WRITE,
    Permission.WATCHLIST_DELETE,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE,
    Permission.REPORT_DELETE,
    Permission.AUDIT_READ,
    Permission.SYSTEM_READ,
  ],

  [UserRole.SUPPORT]: [
    // 客服权限：用户、订阅、自选股的读权限，报告只读
    Permission.USER_READ,
    Permission.SUBSCRIPTION_READ,
    Permission.WATCHLIST_READ,
    Permission.REPORT_READ,
    Permission.AUDIT_READ,
    Permission.SYSTEM_READ,
  ],
};

/**
 * 检查用户是否拥有指定权限
 */
export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  const role = userRole as UserRole;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

/**
 * 检查用户是否可以访问指定页面
 */
export function canAccessPage(userRole: string, page: string): boolean {
  const pagePermissions: Record<string, Permission> = {
    '/dashboard/users': Permission.USER_READ,
    '/dashboard/subscriptions': Permission.SUBSCRIPTION_READ,
    '/dashboard/watchlist': Permission.WATCHLIST_READ,
    '/dashboard/reports': Permission.REPORT_READ,
    '/dashboard/datasource': Permission.DATASOURCE_READ,
    '/dashboard/audit': Permission.AUDIT_READ,
  };

  const requiredPermission = pagePermissions[page];
  return requiredPermission
    ? hasPermission(userRole, requiredPermission)
    : false;
}

/**
 * 获取用户可访问的菜单项
 */
export function getAccessibleMenuItems(userRole: string) {
  const allMenuItems = [
    {
      key: '/dashboard',
      label: '概览',
      icon: 'dashboard',
      permission: null, // 所有角色都可以访问
    },
    {
      key: '/dashboard/users',
      label: '用户管理',
      icon: 'user',
      permission: Permission.USER_READ,
    },
    {
      key: '/dashboard/subscriptions',
      label: '订阅管理',
      icon: 'crown',
      permission: Permission.SUBSCRIPTION_READ,
    },
    {
      key: '/dashboard/watchlist',
      label: 'Watchlist&Alert',
      icon: 'star',
      permission: Permission.WATCHLIST_READ,
    },
    {
      key: '/dashboard/reports',
      label: 'AI报告',
      icon: 'file-text',
      permission: Permission.REPORT_READ,
    },
    {
      key: '/dashboard/datasource',
      label: '数据源配置',
      icon: 'database',
      permission: Permission.DATASOURCE_READ,
    },
    {
      key: '/dashboard/audit',
      label: '审计日志',
      icon: 'audit',
      permission: Permission.AUDIT_READ,
    },
  ];

  return allMenuItems.filter(
    item => !item.permission || hasPermission(userRole, item.permission)
  );
}

/**
 * 检查是否为管理员
 */
export function isAdmin(userRole: string): boolean {
  return userRole === UserRole.ADMIN;
}

/**
 * 检查是否为分析师
 */
export function isAnalyst(userRole: string): boolean {
  return userRole === UserRole.ANALYST;
}

/**
 * 检查是否为客服
 */
export function isSupport(userRole: string): boolean {
  return userRole === UserRole.SUPPORT;
}

/**
 * 权限验证中间件工厂函数
 */
export function requirePermission(permission: Permission) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * 角色验证中间件工厂函数
 */
export function requireRole(role: UserRole) {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }

    next();
  };
}

/**
 * 管理员权限验证中间件
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * 分析师或管理员权限验证中间件
 */
export function requireAnalystOrAdmin(req: any, res: any, next: any) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.ANALYST) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  next();
}
