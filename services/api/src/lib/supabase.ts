import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 客户端 Supabase 实例（用于前端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端 Supabase 实例（具有管理员权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 为 API 路由创建 Supabase 客户端
export function createRouteHandlerClient(request: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // 在 API 路由中设置 cookie 需要特殊处理
        request.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });
}

// 为中间件创建 Supabase 客户端
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });
}

// 验证用户身份的辅助函数
export async function getUser(request: NextRequest) {
  const supabase = createRouteHandlerClient(request);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

// 验证管理员权限
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('subscription_plan')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.subscription_plan === 'admin';
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    return false;
  }
}