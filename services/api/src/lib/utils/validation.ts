import { z } from 'zod';
import { NextRequest } from 'next/server';

// 验证请求参数的通用函数
export function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    // 获取查询参数
    const url = new URL(request.url);
    const queryParams: Record<string, any> = {};

    // 转换URLSearchParams为普通对象
    url.searchParams.forEach((value, key) => {
      // 特殊处理codes参数，将逗号分隔的字符串转换为数组
      if (key === 'codes' && value.includes(',')) {
        queryParams[key] = value.split(',').map(code => code.trim());
      }
      // 特殊处理股票代码相关参数，保持为字符串
      else if (
        key === 'code' ||
        key === 'codes' ||
        (key.includes('code') && value.match(/^[0-9]{6}$/))
      ) {
        queryParams[key] = value;
      }
      // 尝试转换数字类型
      else if (!isNaN(Number(value)) && value !== '') {
        queryParams[key] = Number(value);
      } else {
        queryParams[key] = value;
      }
    });

    // 使用zod验证
    const result = schema.safeParse(queryParams);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessage = result.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { success: false, error: '请求参数解析失败' };
  }
}

// 验证POST请求体的函数
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessage = result.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { success: false, error: '请求体解析失败' };
  }
}
