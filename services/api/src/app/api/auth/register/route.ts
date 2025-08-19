import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { apiResponse, validateRequest, handleApiError } from '@/utils';
import { RegisterSchema } from '@/types';
import { logInfo, logError } from '@/lib/logger';

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    // 验证请求参数
    const validation = await validateRequest(request, RegisterSchema);
    if (!validation.success) {
      return validation.error;
    }
    
    const { email, password, nickname } = validation.data;
    
    // 创建 Supabase 客户端
    const supabase = createRouteHandlerClient(request);
    
    // 使用 Supabase Auth 注册用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname || email.split('@')[0],
        },
      },
    });
    
    if (authError) {
      logError(new Error(authError.message), 'Register');
      
      // 处理常见的注册错误
      if (authError.message.includes('already registered')) {
        return apiResponse.error('该邮箱已被注册', 409, 'EMAIL_ALREADY_EXISTS');
      }
      
      if (authError.message.includes('password')) {
        return apiResponse.error('密码格式不符合要求', 400, 'INVALID_PASSWORD');
      }
      
      return apiResponse.error('注册失败，请稍后重试', 500, 'REGISTRATION_FAILED');
    }
    
    if (!authData.user) {
      return apiResponse.error('注册失败，用户信息为空', 500, 'USER_DATA_MISSING');
    }
    
    try {
      // 在数据库中创建用户记录
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!,
          nickname: nickname || authData.user.user_metadata?.nickname || email.split('@')[0],
          avatar_url: authData.user.user_metadata?.avatar_url,
          subscription_plan: 'free',
        },
      });
      
      logInfo(`用户注册成功: ${email}`, { userId: user.id });
      
      // 返回用户信息（不包含敏感数据）
      const userResponse = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        subscription_plan: user.subscription_plan,
        created_at: user.created_at,
      };
      
      return apiResponse.success(
        {
          user: userResponse,
          session: authData.session,
          needsEmailConfirmation: !authData.session,
        },
        authData.session ? '注册成功' : '注册成功，请查收邮箱确认邮件'
      );
      
    } catch (dbError) {
      // 如果数据库操作失败，尝试删除 Supabase 中的用户
      logError(dbError as Error, 'Register - Database');
      
      // 注意：在生产环境中，可能需要更复杂的清理逻辑
      return apiResponse.error('注册失败，请稍后重试', 500, 'DATABASE_ERROR');
    }
    
  } catch (error) {
    return handleApiError(error, 'Register');
  }
}