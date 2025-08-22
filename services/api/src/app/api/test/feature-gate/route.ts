import { NextRequest } from 'next/server';
import { ok, fail, withErrorHandling, ErrorCodes } from '@/lib/http';

/**
 * GET /api/test/feature-gate
 * 测试功能门控的端点，模拟403错误
 */
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    // 直接返回403错误来测试FeatureGate响应格式
    return fail(
      {
        code: ErrorCodes.FEATURE_NOT_AVAILABLE,
        message: 'This feature requires pro subscription. Current plan: free',
      },
      requestId,
      403
    );
  }
);

/**
 * POST /api/test/feature-gate
 * 测试成功的功能门控响应
 */
export const POST = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    return ok(
      {
        message: 'Feature gate test passed',
        user: {
          id: 'test-user',
          email: 'test@example.com',
          subscriptionPlan: 'pro',
        },
      },
      'Pro feature access granted',
      requestId
    );
  }
);
