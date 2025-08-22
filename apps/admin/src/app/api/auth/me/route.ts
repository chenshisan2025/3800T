import { verifyToken, type CustomJWTPayload } from '@/utils/jwt';
import { apiAuthMiddleware } from '@/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole, ROLE_PERMISSIONS } from '@/types/rbac';

// 内部账号数据
const INTERNAL_ACCOUNTS = [
  {
    id: '1',
    email: 'admin@gulingtong.com',
    role: UserRole.ADMIN,
    name: '系统管理员',
    status: 'active',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
  },
  {
    id: '2',
    email: 'analyst@gulingtong.com',
    role: UserRole.ANALYST,
    name: '数据分析师',
    status: 'active',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
  },
  {
    id: '3',
    email: 'support@gulingtong.com',
    role: UserRole.SUPPORT,
    name: '客服专员',
    status: 'active',
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
  },
];

// 用户信息响应接口
interface UserInfoResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: string;
    avatar: string | null;
    createdAt: string;
    lastLoginAt: string | null;
    permissions: string[];
  };
}

// 查找用户
function findUserById(userId: string) {
  return INTERNAL_ACCOUNTS.find(
    account => account.id === userId && account.status === 'active'
  );
}

// 获取用户权限列表（基于角色）
function getUserPermissions(role: UserRole): string[] {
  const permissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      'user.read',
      'user.write',
      'user.delete',
      'subscription.read',
      'subscription.write',
      'subscription.delete',
      'watchlist.read',
      'watchlist.write',
      'watchlist.delete',
      'report.read',
      'report.write',
      'report.delete',
      'datasource.read',
      'datasource.write',
      'datasource.delete',
      'modelkey.read',
      'modelkey.write',
      'modelkey.delete',
      'audit.read',
      'system.read',
      'system.write',
    ],
    [UserRole.ANALYST]: [
      'user.read',
      'subscription.read',
      'subscription.write',
      'watchlist.read',
      'watchlist.write',
      'report.read',
      'report.write',
      'audit.read',
    ],
    [UserRole.SUPPORT]: [
      'user.read',
      'subscription.read',
      'watchlist.read',
      'report.read',
      'audit.read',
    ],
  };

  return permissions[role] || [];
}

// GET /api/auth/me
export async function GET(request: NextRequest) {
  try {
    // 验证认证
    const authResult = await apiAuthMiddleware(request);

    if (authResult.status !== 200) {
      return NextResponse.json<UserInfoResponse>(
        {
          success: false,
          message: authResult.message || '认证失败',
        },
        { status: authResult.status }
      );
    }

    const { userId } = authResult.user!;

    // 查找用户详细信息
    const user = findUserById(userId);
    if (!user) {
      return NextResponse.json<UserInfoResponse>(
        {
          success: false,
          message: '用户不存在',
        },
        { status: 404 }
      );
    }

    // 获取用户权限
    const permissions = getUserPermissions(user.role);

    // 返回用户信息
    return NextResponse.json<UserInfoResponse>({
      success: true,
      message: '获取用户信息成功',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json<UserInfoResponse>(
      {
        success: false,
        message: '服务器内部错误',
      },
      { status: 500 }
    );
  }
}

// 不支持其他HTTP方法
export async function POST() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: '此端点仅支持GET请求',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: '此端点仅支持GET请求',
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: '此端点仅支持GET请求',
    },
    { status: 405 }
  );
}
