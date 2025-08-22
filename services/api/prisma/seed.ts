import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 创建股票数据
  const stocks = [
    {
      symbol: '000001',
      name: '平安银行',
      market: 'sz',
      industry: '银行',
      currentPrice: 12.5,
      changePercent: 2.15,
      volume: BigInt(15000000),
    },
    {
      symbol: '000002',
      name: '万科A',
      market: 'sz',
      industry: '房地产',
      currentPrice: 18.3,
      changePercent: -1.25,
      volume: BigInt(8500000),
    },
    {
      symbol: '600000',
      name: '浦发银行',
      market: 'sh',
      industry: '银行',
      currentPrice: 8.95,
      changePercent: 1.8,
      volume: BigInt(12000000),
    },
    {
      symbol: '600036',
      name: '招商银行',
      market: 'sh',
      industry: '银行',
      currentPrice: 42.8,
      changePercent: 0.95,
      volume: BigInt(6800000),
    },
    {
      symbol: '000858',
      name: '五粮液',
      market: 'sz',
      industry: '食品饮料',
      currentPrice: 168.5,
      changePercent: 3.25,
      volume: BigInt(4200000),
    },
  ];

  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: stock,
      create: stock,
    });
  }

  console.log('股票数据初始化完成');

  // 创建测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@gulingtong.com' },
    update: {},
    create: {
      email: 'test@gulingtong.com',
      name: '测试用户',
      subscriptionPlan: 'premium',
    },
  });

  console.log('测试用户创建完成:', testUser.email);

  // 为测试用户创建自选股
  const watchlistItems = [
    { stockSymbol: '000001', alertPrice: 13.0 },
    { stockSymbol: '600036', alertPrice: 45.0 },
    { stockSymbol: '000858', alertPrice: 170.0 },
  ];

  for (const item of watchlistItems) {
    await prisma.watchlist.upsert({
      where: {
        userId_stockSymbol: {
          userId: testUser.id,
          stockSymbol: item.stockSymbol,
        },
      },
      update: { alertPrice: item.alertPrice },
      create: {
        userId: testUser.id,
        stockSymbol: item.stockSymbol,
        alertPrice: item.alertPrice,
      },
    });
  }

  console.log('自选股数据初始化完成');

  // 创建投资组合
  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'test-portfolio-id' },
    update: {},
    create: {
      id: 'test-portfolio-id',
      userId: testUser.id,
      name: '我的投资组合',
      totalValue: 100000.0,
    },
  });

  // 添加投资组合项目
  const portfolioItems = [
    { stockSymbol: '000001', quantity: 1000, avgCost: 12.0 },
    { stockSymbol: '600036', quantity: 500, avgCost: 40.0 },
  ];

  for (const item of portfolioItems) {
    await prisma.portfolioItem.create({
      data: {
        portfolioId: portfolio.id,
        stockSymbol: item.stockSymbol,
        quantity: item.quantity,
        avgCost: item.avgCost,
      },
    });
  }

  console.log('投资组合数据初始化完成');

  // 创建 AI 报告示例
  const aiReports = [
    {
      userId: testUser.id,
      stockSymbol: '000001',
      reportType: 'technical',
      analysisData: {
        recommendation: '买入',
        reasons: ['技术指标向好', '成交量放大', 'MACD金叉'],
        riskLevel: '中等',
        targetPrice: 14.0,
      },
      score: 85,
    },
    {
      userId: testUser.id,
      stockSymbol: '600036',
      reportType: 'fundamental',
      analysisData: {
        recommendation: '持有',
        reasons: ['基本面稳健', '盈利能力强', '分红稳定'],
        riskLevel: '低',
        targetPrice: 48.0,
      },
      score: 92,
    },
  ];

  for (const report of aiReports) {
    await prisma.aiReport.create({
      data: report,
    });
  }

  console.log('AI 报告数据初始化完成');

  console.log('所有种子数据初始化完成！');
}

main()
  .catch(e => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
