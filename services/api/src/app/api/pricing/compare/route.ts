import { NextResponse } from 'next/server';
import { FEATURE_LIMITS } from '@/middleware/featureGate';

/**
 * GET /api/pricing/compare
 * 获取套餐对比信息
 */
export async function GET() {
  try {
    const comparison = {
      categories: [
        {
          name: 'AI分析功能',
          features: [
            {
              name: 'AI报告生成',
              free: `${FEATURE_LIMITS.free.aiReportsPerDay}次/天`,
              pro: `${FEATURE_LIMITS.pro.aiReportsPerDay}次/天`
            },
            {
              name: 'AI深度分析',
              free: false,
              pro: true
            }
          ]
        },
        {
          name: '自选股管理',
          features: [
            {
              name: '自选股数量',
              free: FEATURE_LIMITS.free.maxWatchlistItems,
              pro: FEATURE_LIMITS.pro.maxWatchlistItems
            },
            {
              name: '价格提醒',
              free: FEATURE_LIMITS.free.maxAlerts,
              pro: FEATURE_LIMITS.pro.maxAlerts
            }
          ]
        },
        {
          name: '数据服务',
          features: [
            {
              name: '实时行情',
              free: false,
              pro: true
            },
            {
              name: '高级图表',
              free: false,
              pro: true
            },
            {
              name: '数据导出',
              free: false,
              pro: true
            }
          ]
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error fetching pricing comparison:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing comparison'
      },
      { status: 500 }
    );
  }
}