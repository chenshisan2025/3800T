'use client';

import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, UserRole } from '@/types/rbac';

// 权限守卫组件属性
interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // 是否需要拥有所有权限，默认为 false（拥有任意一个即可）
  role?: UserRole;
  roles?: UserRole[];
  fallback?: React.ReactNode;
  showFallback?: boolean; // 是否显示无权限提示，默认为 true
}

// 权限守卫组件
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback,
  showFallback = true,
}: PermissionGuardProps) {
  const {
    userRole,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
  } = usePermissions();
  const router = useRouter();

  // 检查角色权限
  const hasRoleAccess = () => {
    if (!userRole) return false;
    
    if (role) {
      return userRole === role;
    }
    
    if (roles && roles.length > 0) {
      return roles.includes(userRole);
    }
    
    return true; // 如果没有指定角色要求，则通过
  };

  // 检查功能权限
  const hasPermissionAccess = () => {
    if (permission) {
      return checkPermission(permission);
    }
    
    if (permissions && permissions.length > 0) {
      return requireAll 
        ? checkAllPermissions(permissions)
        : checkAnyPermission(permissions);
    }
    
    return true; // 如果没有指定权限要求，则通过
  };

  // 综合检查
  const hasAccess = hasRoleAccess() && hasPermissionAccess();

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (!showFallback) {
      return null;
    }
    
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle="您没有权限访问此内容，请联系管理员获取相应权限。"
        extra={
          <Button type="primary" onClick={() => router.push('/dashboard')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}

// 页面权限守卫组件
interface PageGuardProps {
  children: React.ReactNode;
  pathname: string;
  fallback?: React.ReactNode;
}

export function PageGuard({ children, pathname, fallback }: PageGuardProps) {
  const { checkPageAccess } = usePermissions();
  const router = useRouter();

  const hasAccess = checkPageAccess(pathname);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Result
        status="403"
        title="页面访问受限"
        subTitle="您没有权限访问此页面，请联系管理员获取相应权限。"
        extra={
          <Button type="primary" onClick={() => router.push('/dashboard')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}

// 条件渲染组件
interface ConditionalRenderProps {
  children: React.ReactNode;
  condition: boolean;
  fallback?: React.ReactNode;
}

export function ConditionalRender({ children, condition, fallback }: ConditionalRenderProps) {
  if (!condition) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

// 权限按钮组件
interface PermissionButtonProps {
  permission: Permission;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: any;
}

export function PermissionButton({
  permission,
  children,
  onClick,
  disabled = false,
  ...props
}: PermissionButtonProps) {
  const { checkPermission } = usePermissions();
  
  const hasPermission = checkPermission(permission);
  const isDisabled = disabled || !hasPermission;
  
  return (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={hasPermission ? onClick : undefined}
      title={!hasPermission ? '权限不足' : undefined}
    >
      {children}
    </Button>
  );
}

// 角色标签组件
interface RoleTagProps {
  role: UserRole;
  className?: string;
}

export function RoleTag({ role, className }: RoleTagProps) {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { color: 'red', text: '管理员' };
      case UserRole.ANALYST:
        return { color: 'blue', text: '分析师' };
      case UserRole.SUPPORT:
        return { color: 'green', text: '客服' };
      default:
        return { color: 'default', text: '未知' };
    }
  };

  const config = getRoleConfig(role);
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        config.color === 'red' ? 'bg-red-100 text-red-800' :
        config.color === 'blue' ? 'bg-blue-100 text-blue-800' :
        config.color === 'green' ? 'bg-green-100 text-green-800' :
        'bg-gray-100 text-gray-800'
      } ${className || ''}`}
    >
      {config.text}
    </span>
  );
}