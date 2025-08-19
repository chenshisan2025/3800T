import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import { UserRole } from '@/types/rbac';

// JWT 配置
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const JWT_ISSUER = 'gulingtong-admin';
const JWT_AUDIENCE = 'gulingtong-admin-users';

// Token 有效期
const ACCESS_TOKEN_EXPIRES_IN = '24h'; // 访问令牌24小时
const REFRESH_TOKEN_EXPIRES_IN = '7d';  // 刷新令牌7天

// JWT Payload 接口
export interface CustomJWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// 生成访问令牌
export async function generateAccessToken(payload: Omit<CustomJWTPayload, 'type'>): Promise<string> {
  const jwt = new SignJWT({
    ...payload,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN);

  return await jwt.sign(JWT_SECRET);
}

// 生成刷新令牌
export async function generateRefreshToken(payload: Omit<CustomJWTPayload, 'type'>): Promise<string> {
  const jwt = new SignJWT({
    ...payload,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN);

  return await jwt.sign(JWT_SECRET);
}

// 生成令牌对
export async function generateTokenPair(payload: Omit<CustomJWTPayload, 'type'>) {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  };
}

// 验证令牌
export async function verifyToken(token: string): Promise<{
  valid: boolean;
  payload?: CustomJWTPayload;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      valid: true,
      payload: payload as CustomJWTPayload,
    };
  } catch (error) {
    let errorMessage = 'Invalid token';
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Token expired';
      } else if (error.message.includes('signature')) {
        errorMessage = 'Invalid token signature';
      } else if (error.message.includes('audience')) {
        errorMessage = 'Invalid token audience';
      } else if (error.message.includes('issuer')) {
        errorMessage = 'Invalid token issuer';
      }
    }

    return {
      valid: false,
      error: errorMessage,
    };
  }
}

// 验证访问令牌
export async function verifyAccessToken(token: string) {
  const result = await verifyToken(token);
  
  if (!result.valid || !result.payload) {
    return result;
  }

  if (result.payload.type !== 'access') {
    return {
      valid: false,
      error: 'Invalid token type',
    };
  }

  return result;
}

// 验证刷新令牌
export async function verifyRefreshToken(token: string) {
  const result = await verifyToken(token);
  
  if (!result.valid || !result.payload) {
    return result;
  }

  if (result.payload.type !== 'refresh') {
    return {
      valid: false,
      error: 'Invalid token type',
    };
  }

  return result;
}

// 从令牌中提取用户信息
export async function extractUserFromToken(token: string): Promise<CustomJWTPayload | null> {
  const result = await verifyAccessToken(token);
  
  if (!result.valid || !result.payload) {
    return null;
  }

  const { userId, email, role } = result.payload;
  return { userId, email, role, type: 'access' as const };
}

// 检查令牌是否即将过期（剩余时间少于1小时）
export async function isTokenExpiringSoon(token: string): Promise<boolean> {
  const result = await verifyToken(token);
  
  if (!result.valid || !result.payload?.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = result.payload.exp - now;
  
  // 如果剩余时间少于1小时（3600秒），认为即将过期
  return timeUntilExpiry < 3600;
}

// 获取令牌剩余有效时间（秒）
export async function getTokenRemainingTime(token: string): Promise<number | null> {
  const result = await verifyToken(token);
  
  if (!result.valid || !result.payload?.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const remainingTime = result.payload.exp - now;
  
  return Math.max(0, remainingTime);
}