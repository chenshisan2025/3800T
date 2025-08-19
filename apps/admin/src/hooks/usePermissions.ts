'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { useAuth } from '@/providers/AuthProvider';
import {
  UserRole,
  Permission,
  hasPermission,
  canAccessPage,
  getAccessibleMenuItems,
  ROLE_PERMISSIONS,
} from '@/types/rbac';

// 权限检查 Hook
export function usePermissions() {
  const { user } = useAuth();
  const router = useRouter();

  // 获取用户角色
  const userRole = useMemo(() => {
    if (!user?.role) return null;
    return user.role as UserRole;
  }, [user?.role]);

  // 获取用户权限列表
  const userPermissions = useMemo(() => {
    if (!userRole) return [];
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  // 检查是否拥有特定权限
  const checkPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!userRole) return false;
      return hasPermission(userRole, permission);
    };
  }, [userRole]);

  // 检查是否拥有多个权限中的任意一个
  const checkAnyPermission = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!userRole) return false;
      return permissions.some(permission => hasPermission(userRole, permission));
    };
  }, [userRole]);

  // 检查是否拥有所有指定权限
  const checkAllPermissions = useMemo(() => {
    return (permissions: Permission[]): boolean => {
      if (!userRole) return false;
      return permissions.every(permission => hasPermission(userRole, permission));
    };
  }, [userRole]);

  // 检查是否可以访问页面
  const checkPageAccess = useMemo(() => {
    return (pathname: string): boolean => {
      if (!userRole) return false;
      return canAccessPage(userRole, pathname);
    };
  }, [userRole]);

  // 获取可访问的菜单项
  const accessibleMenuItems = useMemo(() => {
    if (!userRole) return [];
    return getAccessibleMenuItems(userRole);
  }, [userRole]);

  // 权限验证失败时的处理
  const handlePermissionDenied = (action?: string) => {
    message.error(`权限不足${action ? `，无法${action}` : ''}`);
  };

  // 页面访问验证失败时的处理
  const handlePageAccessDenied = (pathname?: string) => {
    message.error('您没有权限访问此页面');
    router.push('/dashboard'); // 重定向到仪表板
  };

  // 权限守卫函数
  const requirePermission = (permission: Permission, action?: string): boolean => {
    const hasAccess = checkPermission(permission);
    if (!hasAccess) {
      handlePermissionDenied(action);
    }
    return hasAccess;
  };

  // 页面访问守卫函数
  const requirePageAccess = (pathname: string): boolean => {
    const hasAccess = checkPageAccess(pathname);
    if (!hasAccess) {
      handlePageAccessDenied(pathname);
    }
    return hasAccess;
  };

  return {
    userRole,
    userPermissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkPageAccess,
    accessibleMenuItems,
    requirePermission,
    requirePageAccess,
    handlePermissionDenied,
    handlePageAccessDenied,
  };
}

// 权限检查组件 Hook
export function usePermissionGuard() {
  const { checkPermission, handlePermissionDenied } = usePermissions();

  // 创建权限检查的高阶函数
  const withPermission = <T extends any[]>(
    permission: Permission,
    callback: (...args: T) => void,
    action?: string
  ) => {
    return (...args: T) => {
      if (checkPermission(permission)) {
        callback(...args);
      } else {
        handlePermissionDenied(action);
      }
    };
  };

  return {
    withPermission,
  };
}

// 角色检查 Hook
export function useRoleCheck() {
  const { userRole } = usePermissions();

  const isAdmin = userRole === UserRole.ADMIN;
  const isAnalyst = userRole === UserRole.ANALYST;
  const isSupport = userRole === UserRole.SUPPORT;

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  return {
    userRole,
    isAdmin,
    isAnalyst,
    isSupport,
    hasRole,
    hasAnyRole,
  };
}