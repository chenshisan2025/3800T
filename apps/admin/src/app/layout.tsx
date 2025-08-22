import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import './globals.css';
import { antdTheme } from '@/config/theme';
import { AuthProvider } from '@/providers/AuthProvider';

// 设置 dayjs 中文
dayjs.locale('zh-cn');

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | 古灵通管理后台',
    default: '古灵通管理后台',
  },
  description: '古灵通股票分析平台管理后台系统',
  keywords: ['古灵通', '股票分析', '管理后台', 'AI分析', '投资组合'],
  authors: [{ name: '古灵通团队' }],
  creator: '古灵通团队',
  publisher: '古灵通',
  robots: {
    index: false,
    follow: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#2166A5',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN'>
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={antdTheme}
            componentSize='middle'
          >
            <AuthProvider>{children}</AuthProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
