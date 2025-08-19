import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiResponse } from '@/utils';
import { logInfo, logError } from '@/lib/logger';

// Supabase数据库连接检查
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

// GET /api/health - 健康检查
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 检查数据库连接
    const isDatabaseHealthy = await checkDatabaseConnection();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: {
          status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
          responseTime: `${responseTime}ms`,
        },
        api: {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };
    
    // 如果数据库不健康，返回 503 状态码
    if (!isDatabaseHealthy) {
      logError(new Error('数据库连接失败'), 'HealthCheck');
      return NextResponse.json(healthStatus, { status: 503 });
    }
    
    logInfo(`健康检查通过 - 响应时间: ${responseTime}ms`);
    return apiResponse.success(healthStatus, '服务运行正常');
    
  } catch (error) {
    logError(error as Error, 'HealthCheck');
    
    const errorStatus = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误',
    };
    
    return NextResponse.json(errorStatus, { status: 500 });
  }
}

// HEAD /api/health - 简单健康检查（用于负载均衡器）
export async function HEAD(request: NextRequest) {
  try {
    const isDatabaseHealthy = await checkDatabaseConnection();
    
    if (isDatabaseHealthy) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}