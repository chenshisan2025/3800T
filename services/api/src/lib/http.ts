import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// 统一响应类型定义
export interface ApiSuccessResponse<T = any> {
  ok: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    traceId: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// 获取或生成 request ID
export function getRequestId(request?: NextRequest): string {
  if (request) {
    const existingId = request.headers.get('x-request-id');
    if (existingId) return existingId;
  }
  return uuidv4();
}

// 成功响应
export function ok<T = any>(
  data: T,
  message?: string,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  const response = NextResponse.json({
    ok: true,
    data,
    ...(message && { message }),
  } as ApiSuccessResponse<T>);

  // 设置 x-request-id 头部
  if (requestId) {
    response.headers.set('x-request-id', requestId);
  }

  return response;
}

// 失败响应
export function fail(
  error: {
    code: string;
    message: string;
  },
  requestId?: string,
  status: number = 400
): NextResponse<ApiErrorResponse> {
  const traceId = requestId || uuidv4();

  const response = NextResponse.json(
    {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        traceId,
      },
    } as ApiErrorResponse,
    { status }
  );

  // 设置 x-request-id 头部
  response.headers.set('x-request-id', traceId);

  return response;
}

// 中间件：为请求添加 request ID
export function withRequestId(
  handler: (request: NextRequest, requestId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = getRequestId(request);
    return handler(request, requestId);
  };
}

// 错误处理包装器
export function withErrorHandling(
  handler: (request: NextRequest, requestId: string) => Promise<NextResponse>
) {
  return withRequestId(async (request: NextRequest, requestId: string) => {
    try {
      return await handler(request, requestId);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof Error) {
        return fail(
          {
            code: 'INTERNAL_ERROR',
            message: error.message,
          },
          requestId,
          500
        );
      }

      return fail(
        {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
        },
        requestId,
        500
      );
    }
  });
}

// 常用错误类型
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
