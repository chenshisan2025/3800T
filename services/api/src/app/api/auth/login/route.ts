import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { apiResponse, validateRequest, handleApiError } from '@/utils';
import { LoginSchema } from '@/types';
import { logInfo, logError } from '@/lib/logger';

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    // 验证请求参数
    const validation = await validateRequest(request, LoginSchema);
    if (!validation.success) {
      return validation.error;
    }
    
    const { email, password } = validation.data;
    
    // 创建 Supabase 客户端
    const supabase = createRouteHandlerClient(request);
    
    // 使用 Supabase Auth 登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      logError(new Error(authError.message), 'Login');
      
      // 处理常见的登录错误
      if (authError.message.includes('Invalid login credentials')) {
        return apiResponse.error('邮箱或密码错误', 401, 'INVALID_CREDENTIALS');
      }
      
      if (authError.message.includes('Email not confirmed')) {
        return apiResponse.error('请先确认邮箱后再登录', 401, 'EMAIL_NOT_CONFIRMED');
      }
      
      if (authError.message.includes('Too many requests')) {
        return apiResponse.error('登录尝试过于频繁，请稍后重试', 429, 'TOO_MANY_REQUESTS');
      }
      
      return apiResponse.error('登录失败，请稍后重试', 500, 'LOGIN_FAILED');
    }
    
    if (!authData.user || !authData.session) {
      return apiResponse.error('登录失败，用户信息为空', 500, 'USER_DATA_MISSING');
    }
    
    try {
      // 从数据库获取用户信息
      let user = await prisma.user.findUnique({
        where: { id: authData.user.id },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar_url: true,
          subscription_plan: true,
          created_at: true,
          updated_at: true,
        },
      });
      
      // 如果数据库中没有用户记录，创建一个
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            nickname: authData.user.user_metadata?.nickname || authData.user.email!.split('@')[0],
            avatar_url: authData.user.user_metadata?.avatar_url,
            subscription_plan: 'free',
          },
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar_url: true,
            subscription_plan: true,
            created_at: true,
            updated_at: true,
          },
        });
        
        logInfo(`为现有 Auth 用户创建数据库记录: ${authData.user.email}`, { userId: user.id });
      } else {
        // 更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: { updated_at: new Date() },
        });
      }
      
      logInfo(`用户登录成功: ${email}`, { userId: user.id });
      
      return apiResponse.success(
        {
          user,
          session: authData.session,
        },
        '登录成功'
      );
      
    } catch (dbError) {
      logError(dbError as Error, 'Login - Database');
      
      // 即使数据库操作失败，如果 Auth 成功，也返回基本用户信息
      const basicUser = {
        id: authData.user.id,
        email: authData.user.email!,
        nickname: authData.user.user_metadata?.nickname || authData.user.email!.split('@')[0],
        avatar_url: authData.user.user_metadata?.avatar_url,
        subscription_plan: 'free' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      return apiResponse.success(
        {
          user: basicUser,
          session: authData.session,
        },
        '登录成功（用户信息可能不完整）'
      );
    }
    
  } catch (error) {
    return handleApiError(error, 'Login');
  }
}