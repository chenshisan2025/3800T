import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { apiResponse, handleApiError } from '@/utils';
import { logInfo, logError } from '@/lib/logger';

// POST /api/auth/logout - 用户登出
export async function POST(request: NextRequest) {
  try {
    // 创建 Supabase 客户端
    const supabase = createRouteHandlerClient(request);
    
    // 获取当前用户信息（用于日志记录）
    const { data: { user } } = await supabase.auth.getUser();
    
    // 登出用户
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logError(new Error(error.message), 'Logout');
      return apiResponse.error(
        '登出失败，请稍后重试',
        500,
        'LOGOUT_FAILED'
      );
    }
    
    if (user) {
      logInfo(`用户登出成功: ${user.email}`, { userId: user.id });
    }
    
    return apiResponse.success(
      null,
      '登出成功'
    );
    
  } catch (error) {
    return handleApiError(error, 'Logout');
  }
}

// GET /api/auth/logout - 支持 GET 请求登出（用于简单的登出链接）
export async function GET(request: NextRequest) {
  return POST(request);
}