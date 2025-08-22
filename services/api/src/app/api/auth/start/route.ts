import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { apiResponse, validateRequest, handleApiError } from '@/utils';
import { createRequestLogger } from '@/lib/logger';
import { z } from 'zod';

// 验证 schema
const StartAuthSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  redirectTo: z.string().url().optional(),
});

// POST /api/auth/start - 开始 Email Magic Link 认证流程
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    // 验证请求参数
    const validation = await validateRequest(request, StartAuthSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { email, redirectTo } = validation.data;

    // 创建 Supabase 客户端
    const supabase = createRouteHandlerClient(request);

    // 设置回调 URL
    const callbackUrl =
      redirectTo || `${request.nextUrl.origin}/api/auth/callback`;

    // 发送魔法链接
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
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

    logger.info('魔法链接发送成功', { email, messageId: data?.message_id });

    return apiResponse.success(
      {
        email,
        message_id: data?.message_id,
        expires_in: 3600, // 1小时过期
      },
      '魔法链接已发送到您的邮箱，请查收'
    );
  } catch (error) {
    return handleApiError(error, 'AuthStart');
  }
}
