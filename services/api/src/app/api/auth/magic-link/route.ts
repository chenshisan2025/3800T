import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { apiResponse, validateRequest, handleApiError } from '@/utils';
import { MagicLinkSchema } from '@/types';
import { createRequestLogger } from '@/lib/logger';

// POST /api/auth/magic-link - 发送魔法链接
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证请求参数
    const validation = await validateRequest(request, MagicLinkSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { email } = validation.data;

    // 创建 Supabase 客户端
    const supabase = createRouteHandlerClient(request);

    // 获取重定向 URL
    const redirectTo =
      request.nextUrl.searchParams.get('redirectTo') ||
      `${request.nextUrl.origin}/auth/callback`;

    // 发送魔法链接
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true, // 如果用户不存在则创建
      },
    });

    if (error) {
      logger.error('发送魔法链接失败', {
        error: new Error(error.message),
        email,
      });

      // 处理常见错误
      if (error.message.includes('rate limit')) {
        return apiResponse.error(
          '发送过于频繁，请稍后重试',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      if (error.message.includes('invalid email')) {
        return apiResponse.error('邮箱格式不正确', 400, 'INVALID_EMAIL');
      }

      return apiResponse.error(
        '发送魔法链接失败，请稍后重试',
        500,
        'MAGIC_LINK_FAILED'
      );
    }

    logger.info('魔法链接已发送', { email });

    return apiResponse.success(
      {
        email,
        message_id: data?.message_id,
      },
      '魔法链接已发送到您的邮箱，请查收'
    );
  } catch (error) {
    return handleApiError(error, 'MagicLink');
  }
}

// GET /api/auth/magic-link/verify - 验证魔法链接（回调处理）
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
      logger.error('魔法链接验证失败', {
        error: new Error(error.message),
        token_hash,
        type,
      });

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

    logger.info('魔法链接验证成功', {
      email: data.user.email,
      userId: data.user.id,
    });

    // 重定向到指定页面
    return Response.redirect(new URL(next, request.url));
  } catch (error) {
    return handleApiError(error, 'MagicLinkVerify');
  }
}
