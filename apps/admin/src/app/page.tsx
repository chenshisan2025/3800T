'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到仪表板
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">正在跳转到管理后台...</p>
      </div>
    </div>
  );
}