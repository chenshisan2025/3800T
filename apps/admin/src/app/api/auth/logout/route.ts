import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/utils/jwt';

// 登出响应接口
interface LogoutResponse {
  success: boolean;
  message: string;
}

// 从请求中提取访问令牌
function extractAccessToken(request: NextRequest): string | null {
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

// 记录登出日志
function logLogoutAttempt(email: string, success: boolean, ip?: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Logout attempt: ${email}, Success: ${success}, IP: ${ip || 'unknown'}`);
}

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // 提取访问令牌
    const accessToken = extractAccessToken(request);
    
    let userEmail = 'unknown';
    
    // 如果有令牌，验证并获取用户信息
    if (accessToken) {
      const verification = await verifyAccessToken(accessToken);
      if (verification.valid && verification.payload) {
        userEmail = verification.payload.email;
      }
    }

    // 创建响应
    const response = NextResponse.json<LogoutResponse>({
      success: true,
      message: '登出成功',
    });

    // 清除HTTP-only cookies
    response.cookies.set('gulingtong_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
      path: '/',
    });

    response.cookies.set('gulingtong_admin_refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 立即过期
      path: '/',
    });

    // 记录登出日志
    logLogoutAttempt(userEmail, true, clientIP);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // 即使出错也要清除cookies
    const response = NextResponse.json<LogoutResponse>({
      success: true,
      message: '登出成功',
    });

    response.cookies.set('gulingtong_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('gulingtong_admin_refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}

// GET /api/auth/logout (支持GET请求以便于简单的登出链接)
export async function GET(request: NextRequest) {
  return POST(request);
}

// 不支持其他HTTP方法
export async function PUT() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: '此端点仅支持POST和GET请求',
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: '此端点仅支持POST和GET请求',
  }, { status: 405 });
}