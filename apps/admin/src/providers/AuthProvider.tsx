'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { UserRole, Permission, hasPermission, canAccessPage } from '@/types/rbac';

// 用户接口定义
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: string;
  avatar?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  permissions?: string[];
}

// 登录请求接口
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | undefined>;
  // RBAC 相关
  userRole: UserRole | null;
  checkPermission: (permission: Permission) => boolean;
  checkPageAccess: (page: string) => boolean;
  isAdmin: boolean;
  isAnalyst: boolean;
  isSupport: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

const AUTH_TOKEN_KEY = 'gulingtong_admin_token';
const AUTH_REFRESH_KEY = 'gulingtong_admin_refresh';
const AUTH_STORAGE_KEY = 'gulingtong_admin_auth';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 从本地存储获取认证信息
  const getStoredAuth = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const refreshToken = localStorage.getItem(AUTH_REFRESH_KEY);
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      
      if (token && authData) {
        return {
          token,
          refreshToken,
          user: JSON.parse(authData) as User,
        };
      }
    } catch (error) {
      console.error('Failed to parse stored auth data:', error);
      // 清除损坏的数据
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_REFRESH_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    
    return null;
  }, []);

  // 保存认证信息到本地存储
  const saveAuth = useCallback((token: string, refreshToken: string, userData: User) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_REFRESH_KEY, refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  }, []);

  // 清除认证信息
  const clearAuth = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  // 登录
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const { user: userData, tokens } = data.data;
        
        saveAuth(tokens.accessToken, tokens.refreshToken, userData);
        setUser(userData);
        
        message.success('登录成功');
        router.push('/dashboard');
      } else {
        throw new Error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error instanceof Error ? error.message : '登录失败，请重试');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [saveAuth, router]);



  // 登出
  const logout = useCallback(async () => {
    try {
      // 调用后端登出接口
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // 即使后端登出失败，也要清除本地状态
    } finally {
      clearAuth();
      setUser(null);
      router.push('/login');
    }
  }, [clearAuth, router]);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      const storedAuth = getStoredAuth();
      if (!storedAuth?.token) {
        throw new Error('No token available');
      }
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedAuth.token}`,
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const userData = data.data;
        setUser(userData);
        
        // 更新本地存储的用户信息
        saveAuth(storedAuth.token, storedAuth.refreshToken || '', userData);
        
        return userData;
      } else {
        // 如果获取用户信息失败，可能是 token 过期
        throw new Error('Token expired or invalid');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      
      // 清除认证信息并跳转到登录页
      clearAuth();
      setUser(null);
      router.push('/login');
      
      throw error;
    }
  }, [getStoredAuth, saveAuth, clearAuth, router]);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedAuth = getStoredAuth();
        
        if (storedAuth) {
          // 尝试刷新用户信息以验证 token 有效性
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // 如果初始化失败，清除可能损坏的认证信息
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [getStoredAuth, refreshUser, clearAuth]);

  // RBAC 相关功能
  const userRole = user?.role as UserRole | null;
  
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  }, [userRole]);
  
  const checkPageAccess = useCallback((pathname: string): boolean => {
    if (!userRole) return false;
    return canAccessPage(userRole, pathname);
  }, [userRole]);
  
  const isAdmin = userRole === UserRole.ADMIN;
  const isAnalyst = userRole === UserRole.ANALYST;
  const isSupport = userRole === UserRole.SUPPORT;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    // RBAC 相关
    userRole,
    checkPermission,
    checkPageAccess,
    isAdmin,
    isAnalyst,
    isSupport,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 便捷的认证状态 hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated() {
  const { user } = useAuth();
  return !!user;
}

// RBAC 相关 hooks
export function useUserRole() {
  const { userRole } = useAuth();
  return userRole;
}

export function usePermissionCheck() {
  const { checkPermission } = useAuth();
  return checkPermission;
}

export function usePageAccessCheck() {
  const { checkPageAccess } = useAuth();
  return checkPageAccess;
}

export function useRoleFlags() {
  const { isAdmin, isAnalyst, isSupport } = useAuth();
  return { isAdmin, isAnalyst, isSupport };
}