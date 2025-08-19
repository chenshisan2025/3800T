import { NextRequest } from 'next/server';
import { authMiddleware } from './src/middleware/auth';

// Next.js 中间件入口
export async function middleware(request: NextRequest) {
  return await authMiddleware(request);
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下路径：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};