import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRole, canAccessPage } from '@/types/rbac';

// JWT 密钥
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// 需要认证的路径
const PROTECTED_PATHS = [
  '/dashboard',
  '/api/admin',
];

// 公开路径（不需要认证）
const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
];

// JWT Token 验证
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      valid: true,
      payload: payload as {
        userId: string;
        email: string;
        role: UserRole;
        iat: number;
        exp: number;
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

// 检查路径是否需要认证
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

// 检查路径是否为公开路径
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// 从请求中提取 token
export function extractToken(request: NextRequest): string | null {
  // 从 Authorization header 中提取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从 cookie 中提取
  const tokenCookie = request.cookies.get('gulingtong_admin_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

// 认证中间件
export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径直接通过
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 受保护路径需要验证
  if (isProtectedPath(pathname)) {
    const token = extractToken(request);

    if (!token) {
      // 如果是 API 路径，返回 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: '未提供认证令牌' },
          { status: 401 }
        );
      }
      
      // 页面路径重定向到登录页
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 验证 token
    const verification = await verifyToken(token);
    if (!verification.valid) {
      // 如果是 API 路径，返回 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Token 无效或已过期' },
          { status: 401 }
        );
      }
      
      // 页面路径重定向到登录页
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 检查页面访问权限
    if (!pathname.startsWith('/api/')) {
      const userRole = verification.payload?.role;
      if (userRole && !canAccessPage(userRole, pathname)) {
        // 权限不足，重定向到仪表板
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // 将用户信息添加到请求头中，供后续处理使用
    const requestHeaders = new Headers(request.headers);
    if (verification.payload) {
      requestHeaders.set('x-user-id', verification.payload.userId || '');
      requestHeaders.set('x-user-email', verification.payload.email || '');
      requestHeaders.set('x-user-role', verification.payload.role || '');
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// API 权限验证中间件
export async function apiAuthMiddleware(request: NextRequest) {
  const token = extractToken(request);

  if (!token) {
    return {
      error: 'Unauthorized',
      message: '未提供认证令牌',
      status: 401,
    };
  }

  const verification = await verifyToken(token);
  if (!verification.valid) {
    return {
      error: 'Unauthorized',
      message: 'Token 无效或已过期',
      status: 401,
    };
  }

  return {
    user: verification.payload,
    status: 200,
  };
}

// 权限检查中间件
export function requirePermission(requiredRole: UserRole | UserRole[]) {
  return async (request: NextRequest) => {
    const authResult = await apiAuthMiddleware(request);
    
    if (authResult.status !== 200) {
      return authResult;
    }

    const userRole = authResult.user!.role;
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(userRole)) {
      return {
        error: 'Forbidden',
        message: '权限不足',
        status: 403,
      };
    }

    return authResult;
  };
}

// 仅管理员权限
export const requireAdmin = requirePermission(UserRole.ADMIN);

// 管理员或分析师权限
export const requireAdminOrAnalyst = requirePermission([UserRole.ADMIN, UserRole.ANALYST]);

// 任意角色权限（已登录即可）
export const requireAnyRole = requirePermission([UserRole.ADMIN, UserRole.ANALYST, UserRole.SUPPORT]);