import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from '@/lib/startup';

// 应用初始化标志
let isInitialized = false;

export async function middleware(request: NextRequest) {
  // 只在第一次请求时初始化应用
  if (!isInitialized) {
    await initializeApp();
    isInitialized = true;
  }
  
  return NextResponse.next();
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的路径:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};