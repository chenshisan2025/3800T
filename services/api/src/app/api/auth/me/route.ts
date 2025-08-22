import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail, withErrorHandling, ErrorCodes } from '../../../../lib/http';
import { createRequestLogger } from '../../../../lib/logger';
import { requireUser } from '../../../../middleware/auth';
import { getUserFeatureInfo } from '@/middleware/featureGate';

// GET /api/auth/me - 获取当前用户信息
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const logger = createRequestLogger(request);

    try {
      // 使用新的认证中间件获取当前用户
      const authResult = await requireUser(request);
      if (!authResult.success) {
        return authResult.response;
      }

      const authUser = authResult.user;

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
              nickname:
                authUser.user_metadata?.nickname ||
                authUser.email!.split('@')[0],
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

          const userData = {
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
          };

          logger.info('新用户创建成功', { userId: authUser.id });
          return ok(userData, 'User profile retrieved successfully', requestId);
        }

        // 获取功能门控信息
        const featureInfo = await getUserFeatureInfo(user.id);

        const userData = {
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
        };

        return ok(userData, 'User profile retrieved successfully', requestId);
      } catch (dbError) {
        logger.error('数据库查询失败，返回基本用户信息', {
          userId: authUser.id,
          error: dbError,
        });

        // 如果数据库查询失败，返回基本的 Auth 用户信息
        // 获取功能门控信息（使用默认free套餐）
        const featureInfo = await getUserFeatureInfo(authUser.id);

        const basicUser = {
          id: authUser.id,
          email: authUser.email!,
          nickname:
            authUser.user_metadata?.nickname || authUser.email!.split('@')[0],
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

        return ok(
          basicUser,
          'User profile retrieved successfully (partial data)',
          requestId
        );
      }
    } catch (error) {
      logger.error('获取用户信息失败', { error });
      throw error;
    }
  }
);
