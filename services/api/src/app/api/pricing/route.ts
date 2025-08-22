import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_LIMITS, SubscriptionPlan } from '@/middleware/featureGate';

// 套餐信息配置
const PRICING_INFO = {
  plans: [
    {
      id: SubscriptionPlan.FREE,
      name: '免费版',
      price: 0,
      period: 'month',
      description: '适合个人投资者入门使用',
      popular: false,
      features: [
        {
          category: 'AI分析',
          items: [
            {
              name: 'AI报告生成',
              value: `${FEATURE_LIMITS.free.aiReportsPerDay}次/天，${FEATURE_LIMITS.free.aiReportsPerMonth}次/月`,
              included: true,
            },
            {
              name: 'AI深度分析',
              value: '基础分析',
              included: false,
              description: '升级Pro版解锁深度技术分析和基本面分析',
            },
          ],
        },
        {
          category: '自选股管理',
          items: [
            {
              name: '自选股数量',
              value: `最多${FEATURE_LIMITS.free.maxWatchlistItems}只`,
              included: true,
            },
            {
              name: '价格提醒',
              value: `最多${FEATURE_LIMITS.free.maxAlerts}个`,
              included: true,
            },
          ],
        },
        {
          category: '数据服务',
          items: [
            {
              name: '实时行情',
              value: '延时15分钟',
              included: false,
              description: 'Pro版提供实时行情数据',
            },
            {
              name: '高级图表',
              value: '基础K线图',
              included: false,
              description: 'Pro版提供技术指标和高级图表',
            },
            {
              name: '数据导出',
              value: '不支持',
              included: false,
              description: 'Pro版支持CSV/Excel导出',
            },
          ],
        },
        {
          category: '客户支持',
          items: [
            {
              name: '客服支持',
              value: '社区支持',
              included: true,
            },
          ],
        },
      ],
    },
    {
      id: SubscriptionPlan.PRO,
      name: 'Pro版',
      price: 99,
      period: 'month',
      description: '适合专业投资者和机构用户',
      popular: true,
      features: [
        {
          category: 'AI分析',
          items: [
            {
              name: 'AI报告生成',
              value: `${FEATURE_LIMITS.pro.aiReportsPerDay}次/天，${FEATURE_LIMITS.pro.aiReportsPerMonth}次/月`,
              included: true,
            },
            {
              name: 'AI深度分析',
              value: '深度技术分析 + 基本面分析',
              included: true,
              highlight: true,
            },
          ],
        },
        {
          category: '自选股管理',
          items: [
            {
              name: '自选股数量',
              value: `最多${FEATURE_LIMITS.pro.maxWatchlistItems}只`,
              included: true,
            },
            {
              name: '价格提醒',
              value: `最多${FEATURE_LIMITS.pro.maxAlerts}个`,
              included: true,
            },
          ],
        },
        {
          category: '数据服务',
          items: [
            {
              name: '实时行情',
              value: '实时数据推送',
              included: true,
              highlight: true,
            },
            {
              name: '高级图表',
              value: '50+技术指标，自定义图表',
              included: true,
              highlight: true,
            },
            {
              name: '数据导出',
              value: 'CSV/Excel/PDF导出',
              included: true,
              highlight: true,
            },
          ],
        },
        {
          category: '客户支持',
          items: [
            {
              name: '客服支持',
              value: '7x24小时专属客服',
              included: true,
            },
          ],
        },
      ],
    },
  ],

  // 常见问题
  faq: [
    {
      question: '如何升级到Pro版？',
      answer:
        '您可以在个人中心的订阅管理页面选择升级套餐，支持微信支付、支付宝等多种支付方式。',
    },
    {
      question: 'Pro版可以随时取消吗？',
      answer:
        '是的，您可以随时取消订阅。取消后，您的Pro版权限将在当前计费周期结束后失效，之后自动转为免费版。',
    },
    {
      question: 'AI分析的准确性如何？',
      answer:
        '我们的AI模型基于大量历史数据和实时市场信息训练，但投资有风险，AI分析仅供参考，不构成投资建议。',
    },
    {
      question: '数据来源是什么？',
      answer:
        '我们的数据来源于权威的金融数据提供商，确保数据的准确性和及时性。Pro版用户可享受实时数据服务。',
    },
    {
      question: '支持哪些股票市场？',
      answer:
        '目前支持A股、港股、美股等主要市场，后续会持续扩展更多市场和品种。',
    },
  ],

  // 升级提示文案
  upgradePrompts: {
    aiDeepAnalysis: {
      title: '解锁AI深度分析',
      description: '升级Pro版，获得更专业的技术分析和基本面分析报告',
      features: ['深度技术指标分析', '基本面数据解读', '投资建议评级'],
    },
    watchlistLimit: {
      title: '扩展自选股容量',
      description: '免费版最多添加10只自选股，升级Pro版可添加100只',
      features: ['100只自选股', '无限分组管理', '批量操作'],
    },
    alertLimit: {
      title: '增加价格提醒',
      description: '免费版最多设置5个提醒，升级Pro版可设置50个',
      features: ['50个价格提醒', '多种提醒条件', '微信/短信通知'],
    },
    realTimeData: {
      title: '实时行情数据',
      description: '免费版延时15分钟，Pro版提供实时行情推送',
      features: ['实时价格推送', '盘口数据', '分时图表'],
    },
    exportData: {
      title: '数据导出功能',
      description: '将分析结果和历史数据导出为Excel或PDF格式',
      features: ['多格式导出', '自定义报表', '历史数据下载'],
    },
    advancedCharts: {
      title: '高级图表工具',
      description: '解锁50+技术指标和专业图表工具',
      features: ['50+技术指标', '自定义图表', '多时间周期'],
    },
  },
};

/**
 * GET /api/pricing
 * 获取套餐信息和价格
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: PRICING_INFO,
    });
  } catch (error) {
    console.error('Error fetching pricing info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing information',
      },
      { status: 500 }
    );
  }
}
