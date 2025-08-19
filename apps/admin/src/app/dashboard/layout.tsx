'use client';

import React, { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space, Typography, Badge } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SearchOutlined,
  FileTextOutlined,
  TeamOutlined,
  CrownOutlined,
  HeartOutlined,
  RobotOutlined,
  DatabaseOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser } from '@/providers/AuthProvider';
import { RoleTag } from '@/components/RoleTag';
import { UserRole } from '@/types/rbac';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, userRole, checkPageAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 完整菜单项配置
  const allMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">概览</Link>,
      path: '/dashboard',
    },
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: <Link href="/dashboard/users">用户管理</Link>,
      path: '/dashboard/users',
    },
    {
      key: '/dashboard/subscriptions',
      icon: <CrownOutlined />,
      label: <Link href="/dashboard/subscriptions">订阅管理</Link>,
      path: '/dashboard/subscriptions',
    },
    {
      key: '/dashboard/watchlist',
      icon: <HeartOutlined />,
      label: <Link href="/dashboard/watchlist">自选&提醒</Link>,
      path: '/dashboard/watchlist',
    },
    {
      key: '/dashboard/reports',
      icon: <RobotOutlined />,
      label: <Link href="/dashboard/reports">AI 报告</Link>,
      path: '/dashboard/reports',
    },
    {
      key: '/dashboard/datasource',
      icon: <DatabaseOutlined />,
      label: <Link href="/dashboard/datasource">数据源配置</Link>,
      path: '/dashboard/datasource',
    },
    {
      key: '/dashboard/audit',
      icon: <AuditOutlined />,
      label: <Link href="/dashboard/audit">审计日志</Link>,
      path: '/dashboard/audit',
    },
  ];
  
  // 根据权限获取可访问的菜单项
  const accessibleMenuItems = useMemo(() => {
    return allMenuItems.filter(item => checkPageAccess(item.key as any));
  }, [checkPageAccess, allMenuItems]);

  // 根据权限过滤菜单项
  const menuItems = useMemo(() => {
    return accessibleMenuItems;
  }, [accessibleMenuItems]);

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => router.push('/dashboard/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => router.push('/dashboard/account'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const matchedItem = menuItems.find(item => 
      pathname === item.key || (item.key !== '/dashboard' && pathname.startsWith(item.key))
    );
    return matchedItem ? [matchedItem.key] : ['/dashboard'];
  };

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        className="shadow-lg"
        theme="light"
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          {collapsed ? (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">古</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">古</span>
              </div>
              <span className="text-lg font-bold text-gray-800">古灵通</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          className="border-r-0 mt-4"
        />
      </Sider>

      <Layout>
        {/* 顶部导航 */}
        <Header className="bg-white shadow-sm border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-primary"
            />
            
            <div className="hidden md:flex items-center space-x-3">
              <Text type="secondary" className="text-sm">
                欢迎回来，{user?.name || user?.email}
              </Text>
              {userRole && <RoleTag role={userRole} />}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* 搜索 */}
            <Button
              type="text"
              icon={<SearchOutlined />}
              className="text-gray-600 hover:text-primary"
            />

            {/* 通知 */}
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className="text-gray-600 hover:text-primary"
              />
            </Badge>

            {/* 用户菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={user?.avatar}
                  className="bg-primary"
                />
                <div className="hidden md:block">
                  <Text className="text-sm font-medium">
                    {user?.name || '管理员'}
                  </Text>
                  {userRole && (
                    <Text type="secondary" className="text-xs">
                      {userRole === UserRole.ADMIN ? '管理员' :
                       userRole === UserRole.ANALYST ? '分析师' : '客服'}
                    </Text>
                  )}
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 主内容区 */}
        <Content className="bg-gray-50 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}