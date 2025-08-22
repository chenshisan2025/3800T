import { NextRequest } from 'next/server';
import { apiResponse, handleApiError } from '@/utils';
import { createRequestLogger } from '@/lib/logger';

// GET /api/auth/wx/callback - 微信登录回调接口（预留）
export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 记录请求参数
    logger.info('微信登录回调', { code, state });

    // 预留接口，返回未实现状态
    return apiResponse.error('微信登录功能尚未实现', 501, 'NOT_IMPLEMENTED');
  } catch (error) {
    return handleApiError(error, 'WxCallback');
  }
}

// POST /api/auth/wx/callback - 微信登录回调接口（预留，用于小程序）
export async function POST(request: NextRequest) {
  const logger = createRequestLogger(request);

  try {
    const body = await request.json();

    // 记录请求参数
    logger.info('微信登录回调（POST）', { body });

    // 预留接口，返回未实现状态
    return apiResponse.error('微信登录功能尚未实现', 501, 'NOT_IMPLEMENTED');
  } catch (error) {
    return handleApiError(error, 'WxCallbackPost');
  }
}
