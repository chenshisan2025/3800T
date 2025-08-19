import { NextRequest, NextResponse } from 'next/server';
import { generateTokenPair } from '@/utils/jwt';
import { UserRole } from '@/types/rbac';

// 内部账号数据（实际项目中应该从数据库获取）
const INTERNAL_ACCOUNTS = [
  {
    id: '1',
    email: 'admin@gulingtong.com',
    password: 'admin123', // 实际项目中应该使用加密密码
    role: UserRole.ADMIN,
    name: '系统管理员',
    status: 'active',
  },
  {
    id: '2',
    email: 'analyst@gulingtong.com',
    password: 'analyst123',
    role: UserRole.ANALYST,
    name: '数据分析师',
    status: 'active',
  },
  {
    id: '3',
    email: 'support@gulingtong.com',
    password: 'support123',
    role: UserRole.SUPPORT,
    name: '客服专员',
    status: 'active',
  },
];

// 登录请求接口
interface LoginRequest {
  email: string;
  password: string;
}

// 登录响应接口
interface LoginResponse {
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

// 验证邮箱格式
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证密码强度（可选）
function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

// 查找用户
function findUserByEmail(email: string) {
  return INTERNAL_ACCOUNTS.find(account => 
    account.email.toLowerCase() === email.toLowerCase() && 
    account.status === 'active'
  );
}

// 验证密码（实际项目中应该使用bcrypt等加密库）
function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  return inputPassword === storedPassword;
}

// 记录登录日志（实际项目中应该写入数据库）
function logLoginAttempt(email: string, success: boolean, ip?: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Login attempt: ${email}, Success: ${success}, IP: ${ip || 'unknown'}`);
}

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // 解析请求体
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // 验证输入
    if (!email || !password) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: '邮箱和密码不能为空',
      }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: '邮箱格式不正确',
      }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json<LoginResponse>({
        success: false,
        message: '密码长度至少6位',
      }, { status: 400 });
    }

    // 查找用户
    const user = findUserByEmail(email);
    if (!user) {
      logLoginAttempt(email, false, clientIP);
      return NextResponse.json<LoginResponse>({
        success: false,
        message: '用户不存在或已被禁用',
      }, { status: 401 });
    }

    // 验证密码
    if (!verifyPassword(password, user.password)) {
      logLoginAttempt(email, false, clientIP);
      return NextResponse.json<LoginResponse>({
        success: false,
        message: '密码错误',
      }, { status: 401 });
    }

    // 生成JWT令牌
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 记录成功登录
    logLoginAttempt(email, true, clientIP);

    // 返回成功响应
    const response = NextResponse.json<LoginResponse>({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      },
    });

    // 设置HTTP-only cookie（可选，提供额外安全性）
    response.cookies.set('gulingtong_admin_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
    });

    response.cookies.set('gulingtong_admin_refresh', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<LoginResponse>({
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