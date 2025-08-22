import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// JWT 工具函数
export const jwtUtils = {
  sign: (payload: object, expiresIn: string = '7d') => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET 环境变量未设置');
    }
    return jwt.sign(payload, secret, { expiresIn } as any);
  },

  verify: (token: string) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET 环境变量未设置');
    }
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  },
};

// JWT 验证函数（用于测试兼容性）
export async function verifyJWT(token: string): Promise<{
  valid: boolean;
  payload?: any;
  error?: string;
}> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return {
        valid: false,
        error: 'JWT_SECRET 环境变量未设置',
      };
    }

    const payload = jwt.verify(token, secret);
    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

// 密码加密工具
export const passwordUtils = {
  hash: async (password: string): Promise<string> => {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  },

  compare: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },
};

// API 响应工具
export const apiResponse = {
  success: <T>(data: T, message?: string) => {
    return NextResponse.json({
      success: true,
      data,
      message: message || '操作成功',
      disclaimer: {
        investment_notice:
          '本平台提供的信息仅供参考，不构成投资建议。投资有风险，决策需谨慎。',
        data_notice: '数据可能存在延迟，请以官方数据为准。',
        ai_notice: 'AI分析结果仅供参考，不保证准确性，请结合多方信息独立判断。',
      },
    });
  },

  error: (message: string, status: number = 400, code?: string) => {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code,
        },
      },
      { status }
    );
  },

  unauthorized: (message: string = '未授权访问') => {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: 'UNAUTHORIZED',
        },
      },
      { status: 401 }
    );
  },

  forbidden: (message: string = '权限不足') => {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: 'FORBIDDEN',
        },
      },
      { status: 403 }
    );
  },

  notFound: (message: string = '资源不存在') => {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: 'NOT_FOUND',
        },
      },
      { status: 404 }
    );
  },

  serverError: (message: string = '服务器内部错误') => {
    return NextResponse.json(
      {
        success: false,
        error: {
          message,
          code: 'INTERNAL_SERVER_ERROR',
        },
      },
      { status: 500 }
    );
  },
};

// 请求验证工具重载声明
export function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<
  { success: true; data: T } | { success: false; error: NextResponse }
>;
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse };

// 请求验证工具实现
export function validateRequest<T>(
  requestOrSchema: NextRequest | z.ZodSchema<T>,
  schemaOrData?: z.ZodSchema<T> | unknown
):
  | Promise<
      { success: true; data: T } | { success: false; error: NextResponse }
    >
  | { success: true; data: T }
  | { success: false; error: NextResponse } {
  // 如果第一个参数是NextRequest，则是异步版本
  if (requestOrSchema instanceof NextRequest) {
    const request = requestOrSchema;
    const schema = schemaOrData as z.ZodSchema<T>;

    return (async () => {
      try {
        const body = await request.json();
        const data = schema.parse(body);
        return { success: true, data };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors
            .map(err => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
          return {
            success: false,
            error: apiResponse.error(
              `参数验证失败: ${errorMessage}`,
              400,
              'VALIDATION_ERROR'
            ),
          };
        }
        return {
          success: false,
          error: apiResponse.error('请求体格式错误', 400, 'INVALID_JSON'),
        };
      }
    })();
  }

  // 否则是同步版本
  const schema = requestOrSchema as z.ZodSchema<T>;
  const data = schemaOrData;

  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return {
        success: false,
        error: apiResponse.error(
          `参数验证失败: ${errorMessage}`,
          400,
          'VALIDATION_ERROR'
        ),
      };
    }
    return {
      success: false,
      error: apiResponse.error('数据格式错误', 400, 'INVALID_DATA'),
    };
  }
}

// 分页工具
export const paginationUtils = {
  getSkipTake: (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // 最大限制 100 条
    return { skip, take };
  },

  createPaginationResponse: <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ) => {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },
};

// 日期工具
export const dateUtils = {
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  isValidDateRange: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  },
};

// 股票代码验证
export const stockUtils = {
  isValidStockCode: (code: string): boolean => {
    // A股股票代码格式：6位数字
    const aSharePattern = /^[0-9]{6}$/;
    return aSharePattern.test(code);
  },

  formatStockCode: (code: string): string => {
    // 确保股票代码为6位数字，不足前面补0
    return code.padStart(6, '0');
  },

  getMarketFromCode: (code: string): 'SH' | 'SZ' | 'BJ' => {
    const numCode = parseInt(code);
    if (numCode >= 600000 && numCode <= 699999) return 'SH'; // 上海主板
    if (numCode >= 0 && numCode <= 299999) return 'SZ'; // 深圳主板/中小板/创业板
    if (numCode >= 400000 && numCode <= 499999) return 'BJ'; // 北京交易所
    return 'SH'; // 默认上海
  },
};

// 错误处理工具
export const handleApiError = (error: unknown, context: string = 'API') => {
  console.error(`[${context}] 错误:`, error);

  if (error instanceof Error) {
    return apiResponse.serverError(error.message);
  }

  return apiResponse.serverError('未知错误');
};
