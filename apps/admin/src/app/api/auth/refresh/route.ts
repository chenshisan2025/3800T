import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokenPair } from '@/utils/jwt';
import { UserRole } from '@/types/rbac';

// 内部账号数据（用于验证用户是否仍然有效）
const INTERNAL_ACCOUNTS = [
  {
    id: '1',
    email: 'admin@gulingtong.com',
    role: UserRole.ADMIN,
    name: '系统管理员',
    status: 'active',
  },
  {
    id: '2',
    email: 'analyst@gulingtong.com',
    role: UserRole.ANALYST,
    name: '数据分析师',
    status: 'active',
  },
  {
    id: '3',
    email: 'support@gulingtong.com',
    role: UserRole.SUPPORT,
    name: '客服专员',
    status: 'active',
  },
];

// 刷新令牌请求接口
interface RefreshRequest {
  refreshToken: string;
}

// 刷新令牌响应接口
interface RefreshResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: string;
    };
  };
}

// 查找用户
function findUserById(userId: string) {
  return INTERNAL_ACCOUNTS.find(account => 
    account.id === userId && 
    account.status === 'active'
  );
}

// 从请求中提取刷新令牌
function extractRefreshToken(request: NextRequest): string | null {
  // 首先尝试从请求体中获取
  // 然后尝试从cookie中获取
  const refreshCookie = request.cookies.get('gulingtong_admin_refresh');
  if (refreshCookie) {
    return refreshCookie.value;
  }

  return null;
}

// POST /api/auth/refresh
export async function POST(request: NextRequest) {
  try {
    let refreshToken: string | null = null;

    // 尝试从请求体中获取刷新令牌
    try {
      const body: RefreshRequest = await request.json();
      refreshToken = body.refreshToken;
    } catch {
      // 如果解析请求体失败，尝试从cookie中获取
    }

    // 如果请求体中没有，尝试从cookie中获取
    if (!refreshToken) {
      refreshToken = extractRefreshToken(request);
    }

    if (!refreshToken) {
      return NextResponse.json<RefreshResponse>({
        success: false,
        message: '未提供刷新令牌',
      }, { status: 400 });
    }

    // 验证刷新令牌
    const verification = await verifyRefreshToken(refreshToken);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json<RefreshResponse>({
        success: false,
        message: verification.error || '刷新令牌无效',
      }, { status: 401 });
    }

    const { userId, email, role } = verification.payload;

    // 验证用户是否仍然存在且有效
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json<RefreshResponse>({
        success: false,
        message: '用户不存在或已被禁用',
      }, { status: 401 });
    }

    // 检查用户信息是否一致
    if (user.email !== email || user.role !== role) {
      return NextResponse.json<RefreshResponse>({
        success: false,
        message: '用户信息已变更，请重新登录',
      }, { status: 401 });
    }

    // 生成新的令牌对
    const newTokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 返回成功响应
    const response = NextResponse.json<RefreshResponse>({
      success: true,
      message: '令牌刷新成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: newTokens,
      },
    });

    // 更新HTTP-only cookie
    response.cookies.set('gulingtong_admin_token', newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    });

    response.cookies.set('gulingtong_admin_refresh', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json<RefreshResponse>({
      success: false,
      message: '服务器内部错误',
    }, { status: 500 });
  }
}

// 不支持其他HTTP方法
export async function GET() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: '此端点仅支持POST请求',
  }, { status: 405 });
}