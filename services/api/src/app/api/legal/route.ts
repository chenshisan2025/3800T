import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const legalContent = {
      disclaimer: {
        title: '免责声明',
        content: [
          '本平台提供的所有信息、数据、分析报告和投资建议仅供参考，不构成任何投资建议或推荐。',
          '投资有风险，入市需谨慎。任何投资决策应基于您自己的判断和风险承受能力。',
          '本平台不对因使用本服务而产生的任何直接或间接损失承担责任。',
          '市场数据可能存在延迟，AI分析结果仅供参考，不保证准确性和完整性。',
          '过往业绩不代表未来表现，投资价值可能会有波动。'
        ],
        lastUpdated: '2024-01-15'
      },
      privacyPolicy: {
        title: '隐私政策',
        content: [
          '我们重视您的隐私保护，本政策说明我们如何收集、使用和保护您的个人信息。',
          '收集信息：我们可能收集您的注册信息、使用行为数据和设备信息。',
          '信息使用：收集的信息用于提供服务、改善用户体验和发送相关通知。',
          '信息保护：我们采用行业标准的安全措施保护您的个人信息。',
          '信息共享：除法律要求外，我们不会向第三方分享您的个人信息。',
          '您的权利：您有权访问、更正或删除您的个人信息。'
        ],
        lastUpdated: '2024-01-15'
      },
      investmentWarning: {
        title: '投资风险提示',
        content: [
          '⚠️ 重要提示：本平台提供的所有内容均不构成投资建议',
          '📊 数据仅供参考：所有市场数据、分析报告仅供学习和参考使用',
          '🤖 AI分析限制：人工智能分析存在局限性，不能替代专业投资顾问',
          '💰 投资风险：股票、基金等金融产品投资存在亏损风险',
          '🎯 独立决策：请根据自身财务状况和风险承受能力做出投资决策',
          '📞 专业建议：如需投资建议，请咨询持牌金融顾问'
        ],
        lastUpdated: '2024-01-15'
      },
      termsOfService: {
        title: '服务条款',
        content: [
          '使用本服务即表示您同意遵守以下条款和条件。',
          '服务内容：本平台提供股票信息查询、市场分析等金融信息服务。',
          '用户责任：用户应合法使用本服务，不得进行任何违法或损害平台的行为。',
          '知识产权：平台内容受知识产权法保护，未经许可不得复制或传播。',
          '服务变更：我们保留随时修改或终止服务的权利。',
          '争议解决：因使用本服务产生的争议将通过协商或法律途径解决。'
        ],
        lastUpdated: '2024-01-15'
      }
    };

    return NextResponse.json({
      success: true,
      data: legalContent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Legal API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch legal content',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}