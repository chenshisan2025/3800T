import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { apiResponse, handleApiError } from '@/utils';
import { createRequestLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// GET /api/auth/callback - 处理 Email Magic Link 回调验证
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') || '/';

    if (!token_hash || !type) {
      return apiResponse.error(
        '无效的魔法链接参数',
        400,
        'INVALID_MAGIC_LINK_PARAMS'
      );
    }

    const supabase = createRouteHandlerClient(request);

    // 验证魔法链接
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      logger.error('魔法链接验证失败', { error: new Error(error.message) });

      if (error.message.includes('expired')) {
        return apiResponse.error(
          '魔法链接已过期，请重新申请',
          400,
          'MAGIC_LINK_EXPIRED'
        );
      }

      if (error.message.includes('invalid')) {
        return apiResponse.error('无效的魔法链接', 400, 'INVALID_MAGIC_LINK');
      }

      return apiResponse.error(
        '魔法链接验证失败',
        500,
        'MAGIC_LINK_VERIFY_FAILED'
      );
    }

    if (!data.user || !data.session) {
      return apiResponse.error(
        '魔法链接验证失败，用户信息为空',
        500,
        'USER_DATA_MISSING'
      );
    }

    // 同步用户信息到数据库
    try {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          updatedAt: new Date(),
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          subscriptionPlan: 'free',
        },
      });

      logger.info('用户登录成功', {
        email: data.user.email,
        userId: data.user.id,
      });
    } catch (dbError) {
      logger.error('用户信息同步失败', { error: dbError as Error });
      // 数据库同步失败不影响登录流程
    }

    // 重定向到指定页面
    return Response.redirect(new URL(next, request.url));
  } catch (error) {
    return handleApiError(error, 'AuthCallback');
  }
}

// POST /api/auth/callback - 处理前端 AJAX 回调验证
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const body = await request.json();
    const { token_hash, type } = body;

    if (!token_hash || !type) {
      return apiResponse.error(
        '无效的魔法链接参数',
        400,
        'INVALID_MAGIC_LINK_PARAMS'
      );
    }

    const supabase = createRouteHandlerClient(request);

    // 验证魔法链接
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      logger.error('魔法链接验证失败', { error: new Error(error.message) });

      if (error.message.includes('expired')) {
        return apiResponse.error(
          '魔法链接已过期，请重新申请',
          400,
          'MAGIC_LINK_EXPIRED'
        );
      }

      if (error.message.includes('invalid')) {
        return apiResponse.error('无效的魔法链接', 400, 'INVALID_MAGIC_LINK');
      }

      return apiResponse.error(
        '魔法链接验证失败',
        500,
        'MAGIC_LINK_VERIFY_FAILED'
      );
    }

    if (!data.user || !data.session) {
      return apiResponse.error(
        '魔法链接验证失败，用户信息为空',
        500,
        'USER_DATA_MISSING'
      );
    }

    // 同步用户信息到数据库
    try {
      const user = await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          updatedAt: new Date(),
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
          subscriptionPlan: 'free',
        },
      });

      logger.info('用户登录成功', {
        email: data.user.email,
        userId: data.user.id,
      });

      return apiResponse.success(
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            subscriptionPlan: user.subscriptionPlan,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
            expires_at: data.session.expires_at,
          },
        },
        '登录成功'
      );
    } catch (dbError) {
      logger.error('用户信息同步失败', { error: dbError as Error });
      return apiResponse.error('用户信息同步失败', 500, 'USER_SYNC_FAILED');
    }
  } catch (error) {
    return handleApiError(error, 'AuthCallbackPost');
  }
}
