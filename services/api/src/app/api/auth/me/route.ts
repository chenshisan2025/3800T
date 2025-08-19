import { NextRequest } from 'next/server';
import { getUser } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { apiResponse, handleApiError } from '@/utils';
import { logError } from '@/lib/logger';
import { getUserFeatureInfo } from '@/middleware/featureGate';

// GET /api/auth/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const authUser = await getUser(request);
    
    if (!authUser) {
      return apiResponse.unauthorized('请先登录');
    }
    
    try {
      // 从数据库获取完整的用户信息
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar_url: true,
          subscription_plan: true,
          created_at: true,
          updated_at: true,
          // 包含关联数据的统计信息
          _count: {
            select: {
              watchlist: true,
              portfolios: true,
            },
          },
        },
      });
      
      if (!user) {
        // 如果数据库中没有用户记录，创建一个
        const newUser = await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email!,
            nickname: authUser.user_metadata?.nickname || authUser.email!.split('@')[0],
            avatar_url: authUser.user_metadata?.avatar_url,
            subscription_plan: 'free',
          },
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar_url: true,
            subscription_plan: true,
            created_at: true,
            updated_at: true,
            _count: {
              select: {
                watchlist: true,
                portfolios: true,
              },
            },
          },
        });
        
        // 获取功能门控信息
      const featureInfo = await getUserFeatureInfo(newUser.id);
      
      return apiResponse.success({
        ...newUser,
        stats: {
          watchlistCount: newUser._count.watchlist,
          portfolioCount: newUser._count.portfolios,
        },
        subscription: {
          plan: newUser.subscription_plan,
          features: featureInfo.features,
          limits: featureInfo.limits,
          usage: featureInfo.usage,
        },
      });
      }
      
      // 获取功能门控信息
      const featureInfo = await getUserFeatureInfo(user.id);
      
      return apiResponse.success({
        ...user,
        stats: {
          watchlistCount: user._count.watchlist,
          portfolioCount: user._count.portfolios,
        },
        subscription: {
          plan: user.subscription_plan,
          features: featureInfo.features,
          limits: featureInfo.limits,
          usage: featureInfo.usage,
        },
      });
      
    } catch (dbError) {
      logError(dbError as Error, 'GetMe - Database');
      
      // 如果数据库查询失败，返回基本的 Auth 用户信息
      // 获取功能门控信息（使用默认free套餐）
      const featureInfo = await getUserFeatureInfo(authUser.id);
      
      const basicUser = {
        id: authUser.id,
        email: authUser.email!,
        nickname: authUser.user_metadata?.nickname || authUser.email!.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url,
        subscription_plan: 'free' as const,
        created_at: new Date(authUser.created_at),
        updated_at: new Date(authUser.updated_at || authUser.created_at),
        stats: {
          watchlistCount: 0,
          portfolioCount: 0,
        },
        subscription: {
          plan: 'free' as const,
          features: featureInfo.features,
          limits: featureInfo.limits,
          usage: featureInfo.usage,
        },
      };
      
      return apiResponse.success(basicUser, '用户信息获取成功（部分信息可能不完整）');
    }
    
  } catch (error) {
    return handleApiError(error, 'GetMe');
  }
}