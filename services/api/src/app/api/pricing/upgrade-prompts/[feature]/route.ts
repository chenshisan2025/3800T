import { NextRequest, NextResponse } from 'next/server';

// 升级提示文案配置
const UPGRADE_PROMPTS = {
  aiDeepAnalysis: {
    title: '解锁AI深度分析',
    description: '升级Pro版，获得更专业的技术分析和基本面分析报告',
    features: ['深度技术指标分析', '基本面数据解读', '投资建议评级'],
    ctaText: '立即升级Pro版',
    benefits: [
      '专业级技术分析报告',
      '基本面数据深度解读',
      '个股投资建议评级',
      '行业对比分析',
    ],
  },
  watchlistLimit: {
    title: '扩展自选股容量',
    description: '免费版最多添加10只自选股，升级Pro版可添加100只',
    features: ['100只自选股', '无限分组管理', '批量操作'],
    ctaText: '升级解锁更多自选股',
    benefits: [
      '自选股数量提升至100只',
      '支持无限分组管理',
      '批量添加和删除操作',
      '自选股数据同步备份',
    ],
  },
  alertLimit: {
    title: '增加价格提醒',
    description: '免费版最多设置5个提醒，升级Pro版可设置50个',
    features: ['50个价格提醒', '多种提醒条件', '微信/短信通知'],
    ctaText: '升级获得更多提醒',
    benefits: [
      '价格提醒数量提升至50个',
      '支持涨跌幅、成交量等多种提醒条件',
      '微信、短信、邮件多渠道通知',
      '智能提醒时间设置',
    ],
  },
  realTimeData: {
    title: '实时行情数据',
    description: '免费版延时15分钟，Pro版提供实时行情推送',
    features: ['实时价格推送', '盘口数据', '分时图表'],
    ctaText: '升级获得实时数据',
    benefits: [
      '实时价格数据推送',
      '五档盘口买卖数据',
      '实时分时图表',
      '成交明细数据',
    ],
  },
  exportData: {
    title: '数据导出功能',
    description: '将分析结果和历史数据导出为Excel或PDF格式',
    features: ['多格式导出', '自定义报表', '历史数据下载'],
    ctaText: '升级解锁导出功能',
    benefits: [
      '支持CSV、Excel、PDF多种格式',
      '自定义报表模板',
      '历史数据批量下载',
      '投资组合分析报告导出',
    ],
  },
  advancedCharts: {
    title: '高级图表工具',
    description: '解锁50+技术指标和专业图表工具',
    features: ['50+技术指标', '自定义图表', '多时间周期'],
    ctaText: '升级使用高级图表',
    benefits: [
      '50+专业技术指标',
      '自定义图表样式和布局',
      '多时间周期切换',
      '图表标注和画线工具',
    ],
  },
};

/**
 * GET /api/pricing/upgrade-prompts/[feature]
 * 获取特定功能的升级提示文案
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { feature: string } }
) {
  try {
    const { feature } = params;

    const prompt = UPGRADE_PROMPTS[feature as keyof typeof UPGRADE_PROMPTS];

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feature not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        feature,
        ...prompt,
      },
    });
  } catch (error) {
    console.error('Error fetching upgrade prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch upgrade prompt',
      },
      { status: 500 }
    );
  }
}
