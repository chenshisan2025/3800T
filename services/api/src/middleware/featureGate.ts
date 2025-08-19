import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUser } from './auth';

const prisma = new PrismaClient();

// 订阅计划枚举
export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro'
}

// 功能限制配置
export const FEATURE_LIMITS = {
  [SubscriptionPlan.FREE]: {
    // AI深度分析限制
    aiDeepAnalysis: false,
    aiReportsPerDay: 3,
    aiReportsPerMonth: 30,
    
    // 自选股限制
    maxWatchlistItems: 10,
    
    // 提醒限制
    maxAlerts: 5,
    
    // 其他功能
    exportData: false,
    advancedCharts: false,
    realTimeData: false
  },
  [SubscriptionPlan.PRO]: {
    // AI深度分析权限
    aiDeepAnalysis: true,
    aiReportsPerDay: 50,
    aiReportsPerMonth: 1000,
    
    // 自选股权限
    maxWatchlistItems: 100,
    
    // 提醒权限
    maxAlerts: 50,
    
    // 其他功能
    exportData: true,
    advancedCharts: true,
    realTimeData: true
  }
};

// 功能类型枚举
export enum FeatureType {
  AI_DEEP_ANALYSIS = 'aiDeepAnalysis',
  AI_REPORTS_DAILY = 'aiReportsPerDay',
  AI_REPORTS_MONTHLY = 'aiReportsPerMonth',
  WATCHLIST_ITEMS = 'maxWatchlistItems',
  ALERTS = 'maxAlerts',
  EXPORT_DATA = 'exportData',
  ADVANCED_CHARTS = 'advancedCharts',
  REAL_TIME_DATA = 'realTimeData'
}

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      featureGate?: {
        plan: SubscriptionPlan;
        limits: typeof FEATURE_LIMITS[SubscriptionPlan];
        hasFeature: (feature: FeatureType) => boolean;
        checkLimit: (feature: FeatureType, currentCount?: number) => Promise<boolean>;
      };
    }
  }
}

/**
 * 获取用户订阅计划
 */
export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionPlan: true }
    });
    
    if (!user) {
      return SubscriptionPlan.FREE;
    }
    
    return user.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE;
  } catch (error) {
    console.error('Error fetching user subscription plan:', error);
    return SubscriptionPlan.FREE;
  }
}

/**
 * 检查用户是否有某个功能权限
 */
export function hasFeature(plan: SubscriptionPlan, feature: FeatureType): boolean {
  const limits = FEATURE_LIMITS[plan];
  const featureValue = limits[feature as keyof typeof limits];
  
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  
  return true; // 对于数量限制类型，默认有权限，但需要检查具体数量
}

/**
 * 检查用户是否超过功能使用限制
 */
export function checkLimit(plan: SubscriptionPlan, feature: FeatureType, currentCount: number): boolean {
  const limits = FEATURE_LIMITS[plan];
  const limit = limits[feature as keyof typeof limits];
  
  if (typeof limit === 'number') {
    return currentCount < limit;
  }
  
  return true; // 对于布尔类型，在hasFeature中已经检查
}

/**
 * 获取用户当前使用量
 */
export async function getCurrentUsage(userId: string, feature: FeatureType): Promise<number> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  try {
    switch (feature) {
      case FeatureType.AI_REPORTS_DAILY:
        return await prisma.aiReport.count({
          where: {
            userId,
            createdAt: {
              gte: today
            }
          }
        });
        
      case FeatureType.AI_REPORTS_MONTHLY:
        return await prisma.aiReport.count({
          where: {
            userId,
            createdAt: {
              gte: thisMonth
            }
          }
        });
        
      case FeatureType.WATCHLIST_ITEMS:
        return await prisma.watchlist.count({
          where: { userId }
        });
        
      case FeatureType.ALERTS:
        return await prisma.alert.count({
          where: {
            userId,
            isActive: true
          }
        });
        
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error fetching current usage:', error);
    return 0;
  }
}

/**
 * FeatureGate中间件
 */
export function featureGateMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }
      
      const plan = await getUserSubscriptionPlan(user.id);
      const limits = FEATURE_LIMITS[plan];
      
      // 添加featureGate到请求对象
      req.featureGate = {
        plan,
        limits,
        hasFeature: (feature: FeatureType) => hasFeature(plan, feature),
        checkLimit: async (feature: FeatureType, currentCount?: number) => {
          const count = currentCount ?? await getCurrentUsage(user.id, feature);
          return checkLimit(plan, feature, count);
        }
      };
      
      next();
    } catch (error) {
      console.error('FeatureGate middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'FEATURE_GATE_ERROR'
      });
    }
  };
}

/**
 * 检查特定功能权限的中间件工厂
 */
export function requireFeature(feature: FeatureType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const featureGate = req.featureGate;
      
      if (!featureGate) {
        return res.status(500).json({
          error: 'FeatureGate not initialized',
          code: 'FEATURE_GATE_NOT_INITIALIZED'
        });
      }
      
      // 检查功能权限
      if (!featureGate.hasFeature(feature)) {
        return res.status(403).json({
          error: 'Feature not available in your subscription plan',
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          currentPlan: featureGate.plan,
          upgradeRequired: true
        });
      }
      
      // 检查使用限制
      const canUse = await featureGate.checkLimit(feature);
      if (!canUse) {
        const currentUsage = await getCurrentUsage(req.user!.id, feature);
        const limit = featureGate.limits[feature as keyof typeof featureGate.limits];
        
        return res.status(429).json({
          error: 'Feature usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
          feature,
          currentUsage,
          limit,
          currentPlan: featureGate.plan,
          upgradeRequired: featureGate.plan === SubscriptionPlan.FREE
        });
      }
      
      next();
    } catch (error) {
      console.error('RequireFeature middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'REQUIRE_FEATURE_ERROR'
      });
    }
  };
}

/**
 * 获取用户功能权限信息
 */
export async function getUserFeatureInfo(userId: string) {
  const plan = await getUserSubscriptionPlan(userId);
  const limits = FEATURE_LIMITS[plan];
  
  // 获取当前使用量
  const [aiReportsDaily, aiReportsMonthly, watchlistCount, alertsCount] = await Promise.all([
    getCurrentUsage(userId, FeatureType.AI_REPORTS_DAILY),
    getCurrentUsage(userId, FeatureType.AI_REPORTS_MONTHLY),
    getCurrentUsage(userId, FeatureType.WATCHLIST_ITEMS),
    getCurrentUsage(userId, FeatureType.ALERTS)
  ]);
  
  return {
    plan,
    limits,
    usage: {
      aiReportsDaily,
      aiReportsMonthly,
      watchlistItems: watchlistCount,
      alerts: alertsCount
    },
    features: {
      aiDeepAnalysis: limits.aiDeepAnalysis,
      exportData: limits.exportData,
      advancedCharts: limits.advancedCharts,
      realTimeData: limits.realTimeData
    }
  };
}