'use client';

import React, { useEffect, useState } from 'react';
import { Result, Button, Alert, Spin, notification } from 'antd';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, UserRole } from '@/types/rbac';
import { ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';

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
  loading?: boolean; // 是否显示加载状态
  onAccessDenied?: (reason: string) => void; // 权限被拒绝时的回调
  redirectTo?: string; // 权限不足时重定向的路径
  showNotification?: boolean; // 是否显示权限不足的通知
  strict?: boolean; // 严格模式，权限检查失败时抛出错误
  debug?: boolean; // 调试模式，在控制台输出权限检查信息
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
  loading = false,
  onAccessDenied,
  redirectTo,
  showNotification = false,
  strict = false,
  debug = false,
}: PermissionGuardProps) {
  const {
    userRole,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    isLoading,
  } = usePermissions();
  const router = useRouter();
  const [hasNotified, setHasNotified] = useState(false);

  // 检查角色权限
  const hasRoleAccess = () => {
    if (!userRole) {
      if (debug) console.log('PermissionGuard: 用户角色未定义');
      return false;
    }

    if (role) {
      const access = userRole === role;
      if (debug)
        console.log(
          `PermissionGuard: 角色检查 ${userRole} === ${role} = ${access}`
        );
      return access;
    }

    if (roles && roles.length > 0) {
      const access = roles.includes(userRole);
      if (debug)
        console.log(
          `PermissionGuard: 角色检查 ${userRole} in [${roles.join(', ')}] = ${access}`
        );
      return access;
    }

    if (debug) console.log('PermissionGuard: 无角色要求，通过');
    return true; // 如果没有指定角色要求，则通过
  };

  // 检查功能权限
  const hasPermissionAccess = () => {
    if (permission) {
      const access = checkPermission(permission);
      if (debug)
        console.log(`PermissionGuard: 权限检查 ${permission} = ${access}`);
      return access;
    }

    if (permissions && permissions.length > 0) {
      const access = requireAll
        ? checkAllPermissions(permissions)
        : checkAnyPermission(permissions);
      if (debug)
        console.log(
          `PermissionGuard: 权限检查 [${permissions.join(', ')}] (requireAll: ${requireAll}) = ${access}`
        );
      return access;
    }

    if (debug) console.log('PermissionGuard: 无权限要求，通过');
    return true; // 如果没有指定权限要求，则通过
  };

  // 综合检查
  const roleAccess = hasRoleAccess();
  const permissionAccess = hasPermissionAccess();
  const hasAccess = roleAccess && permissionAccess;

  if (debug) {
    console.log(
      `PermissionGuard: 最终权限检查结果 = ${hasAccess} (角色: ${roleAccess}, 权限: ${permissionAccess})`
    );
  }

  // 处理权限被拒绝的情况
  useEffect(() => {
    if (!hasAccess && !isLoading && !loading) {
      const reason = !roleAccess
        ? `角色权限不足: 需要 ${role || roles?.join(', ')} 角色，当前为 ${userRole}`
        : `功能权限不足: 需要 ${permission || permissions?.join(', ')} 权限`;

      // 调用权限被拒绝回调
      if (onAccessDenied) {
        onAccessDenied(reason);
      }

      // 显示通知
      if (showNotification && !hasNotified) {
        notification.warning({
          message: '权限不足',
          description: reason,
          icon: <LockOutlined />,
        });
        setHasNotified(true);
      }

      // 严格模式下抛出错误
      if (strict) {
        throw new Error(`权限检查失败: ${reason}`);
      }

      // 重定向
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
    }
  }, [
    hasAccess,
    isLoading,
    loading,
    roleAccess,
    permissionAccess,
    onAccessDenied,
    showNotification,
    hasNotified,
    strict,
    redirectTo,
    router,
    role,
    roles,
    userRole,
    permission,
    permissions,
  ]);

  // 显示加载状态
  if (isLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size='large' tip='正在验证权限...' />
      </div>
    );
  }

  if (!hasAccess) {
    if (!showFallback) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    const reason = !roleAccess
      ? `需要 ${role || roles?.join(', ')} 角色权限`
      : `需要 ${permission || permissions?.join(', ')} 功能权限`;

    return (
      <Result
        status='403'
        title='403'
        subTitle='抱歉，您没有权限访问此页面。'
        extra={
          <div>
            <Alert
              message='权限不足'
              description={reason}
              type='warning'
              icon={<ExclamationCircleOutlined />}
              style={{ marginBottom: 16, textAlign: 'left' }}
            />
            <Button type='primary' onClick={() => router.back()}>
              返回
            </Button>
          </div>
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
        status='403'
        title='页面访问受限'
        subTitle='您没有权限访问此页面，请联系管理员获取相应权限。'
        extra={
          <Button type='primary' onClick={() => router.push('/dashboard')}>
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

export function ConditionalRender({
  children,
  condition,
  fallback,
}: ConditionalRenderProps) {
  if (!condition) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// 权限按钮组件属性
interface PermissionButtonProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: UserRole;
  roles?: UserRole[];
  disabled?: boolean;
  tooltip?: string;
  showTooltip?: boolean; // 是否显示权限不足的提示
  hideWhenNoAccess?: boolean; // 权限不足时是否隐藏按钮
  onAccessDenied?: (reason: string) => void; // 权限不足时的回调
  debug?: boolean; // 调试模式
  [key: string]: any; // 其他 Button 属性
}

export function PermissionButton({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  disabled = false,
  tooltip,
  showTooltip = true,
  hideWhenNoAccess = false,
  onAccessDenied,
  debug = false,
  onClick,
  ...buttonProps
}: PermissionButtonProps) {
  const { userRole, checkPermission, checkAnyPermission, checkAllPermissions } =
    usePermissions();

  // 检查角色权限
  const hasRoleAccess = () => {
    if (!userRole) {
      if (debug) console.log('PermissionButton: 用户角色未定义');
      return false;
    }

    if (role) {
      const access = userRole === role;
      if (debug)
        console.log(
          `PermissionButton: 角色检查 ${userRole} === ${role} = ${access}`
        );
      return access;
    }

    if (roles && roles.length > 0) {
      const access = roles.includes(userRole);
      if (debug)
        console.log(
          `PermissionButton: 角色检查 ${userRole} in [${roles.join(', ')}] = ${access}`
        );
      return access;
    }

    return true;
  };

  // 检查功能权限
  const hasPermissionAccess = () => {
    if (permission) {
      const access = checkPermission(permission);
      if (debug)
        console.log(`PermissionButton: 权限检查 ${permission} = ${access}`);
      return access;
    }

    if (permissions && permissions.length > 0) {
      const access = requireAll
        ? checkAllPermissions(permissions)
        : checkAnyPermission(permissions);
      if (debug)
        console.log(
          `PermissionButton: 权限检查 [${permissions.join(', ')}] (requireAll: ${requireAll}) = ${access}`
        );
      return access;
    }

    return true;
  };

  const roleAccess = hasRoleAccess();
  const permissionAccess = hasPermissionAccess();
  const hasAccess = roleAccess && permissionAccess;

  if (debug) {
    console.log(
      `PermissionButton: 最终权限检查结果 = ${hasAccess} (角色: ${roleAccess}, 权限: ${permissionAccess})`
    );
  }

  // 权限不足时隐藏按钮
  if (!hasAccess && hideWhenNoAccess) {
    return null;
  }

  const isDisabled = disabled || !hasAccess;

  const handleClick = (e: React.MouseEvent) => {
    if (!hasAccess) {
      e.preventDefault();
      const reason = !roleAccess
        ? `角色权限不足: 需要 ${role || roles?.join(', ')} 角色，当前为 ${userRole}`
        : `功能权限不足: 需要 ${permission || permissions?.join(', ')} 权限`;

      if (onAccessDenied) {
        onAccessDenied(reason);
      }

      if (showTooltip) {
        notification.warning({
          message: '权限不足',
          description: reason,
          icon: <LockOutlined />,
        });
      }
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const buttonTooltip = !hasAccess
    ? tooltip ||
      `您没有执行此操作的权限: 需要 ${permission || permissions?.join(', ')} 权限`
    : tooltip;

  return (
    <Button
      {...buttonProps}
      disabled={isDisabled}
      onClick={handleClick}
      title={showTooltip ? buttonTooltip : undefined}
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
        config.color === 'red'
          ? 'bg-red-100 text-red-800'
          : config.color === 'blue'
            ? 'bg-blue-100 text-blue-800'
            : config.color === 'green'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
      } ${className || ''}`}
    >
      {config.text}
    </span>
  );
}
