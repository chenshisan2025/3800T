// Mock数据服务，用于数据源降级

// Mock股票数据
export const mockStocks = [
  {
    id: 'mock_1',
    code: '000001',
    name: '平安银行',
    market: 'SZ',
    industry: '银行',
    sector: '金融业',
    created_at: new Date('2023-01-01'),
    updated_at: new Date(),
    latest_data: {
      date: new Date(),
      close_price: 12.50,
      change_percent: 2.15,
      volume: 125000000,
    },
  },
  {
    id: 'mock_2',
    code: '000002',
    name: '万科A',
    market: 'SZ',
    industry: '房地产',
    sector: '房地产业',
    created_at: new Date('2023-01-01'),
    updated_at: new Date(),
    latest_data: {
      date: new Date(),
      close_price: 18.75,
      change_percent: -1.25,
      volume: 89000000,
    },
  },
  {
    id: 'mock_3',
    code: '600000',
    name: '浦发银行',
    market: 'SH',
    industry: '银行',
    sector: '金融业',
    created_at: new Date('2023-01-01'),
    updated_at: new Date(),
    latest_data: {
      date: new Date(),
      close_price: 8.95,
      change_percent: 0.56,
      volume: 156000000,
    },
  },
  {
    id: 'mock_4',
    code: '600036',
    name: '招商银行',
    market: 'SH',
    industry: '银行',
    sector: '金融业',
    created_at: new Date('2023-01-01'),
    updated_at: new Date(),
    latest_data: {
      date: new Date(),
      close_price: 35.20,
      change_percent: 1.85,
      volume: 78000000,
    },
  },
  {
    id: 'mock_5',
    code: '000858',
    name: '五粮液',
    market: 'SZ',
    industry: '食品饮料',
    sector: '制造业',
    created_at: new Date('2023-01-01'),
    updated_at: new Date(),
    latest_data: {
      date: new Date(),
      close_price: 168.50,
      change_percent: -0.75,
      volume: 45000000,
    },
  },
];

// Mock股票历史数据
export const generateMockHistoryData = (stockCode: string, days: number = 30) => {
  const data = [];
  const basePrice = Math.random() * 100 + 10; // 基础价格10-110
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 生成随机价格变动
    const changePercent = (Math.random() - 0.5) * 10; // -5% 到 +5%
    const price = basePrice * (1 + changePercent / 100);
    const volume = Math.floor(Math.random() * 100000000) + 10000000; // 1000万到1亿
    
    data.push({
      date,
      open_price: price * (1 + (Math.random() - 0.5) * 0.02),
      high_price: price * (1 + Math.random() * 0.03),
      low_price: price * (1 - Math.random() * 0.03),
      close_price: price,
      volume,
      change_percent: changePercent,
    });
  }
  
  return data;
};

// Mock AI分析报告
export const generateMockAIReports = (stockCode: string, count: number = 5) => {
  const reportTypes = ['技术分析', '基本面分析', '市场情绪分析', '风险评估', '投资建议'];
  const sentiments = ['积极', '中性', '谨慎'];
  const recommendations = ['买入', '持有', '卖出'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `mock_report_${stockCode}_${index + 1}`,
    stock_code: stockCode,
    report_type: reportTypes[index % reportTypes.length],
    content: `这是${stockCode}的${reportTypes[index % reportTypes.length]}报告。基于当前市场环境和技术指标分析，该股票表现出${sentiments[Math.floor(Math.random() * sentiments.length)]}的投资前景。建议投资者关注相关风险因素，做出理性投资决策。`,
    summary: `${reportTypes[index % reportTypes.length]}显示${sentiments[Math.floor(Math.random() * sentiments.length)]}信号`,
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    confidence_score: Math.floor(Math.random() * 30) + 70, // 70-100
    recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 最近7天内
    updated_at: new Date(),
  }));
};

// Mock技术指标
export const generateMockTechnicalIndicators = (stockCode: string) => {
  const currentPrice = Math.random() * 100 + 10;
  
  return {
    ma5: currentPrice * (1 + (Math.random() - 0.5) * 0.1),
    ma20: currentPrice * (1 + (Math.random() - 0.5) * 0.15),
    week52_high: currentPrice * (1 + Math.random() * 0.3),
    week52_low: currentPrice * (1 - Math.random() * 0.3),
    rsi: Math.floor(Math.random() * 100),
    macd: (Math.random() - 0.5) * 2,
    volume_ratio: Math.random() * 3 + 0.5,
  };
};

// Mock用户关注数据
export const generateMockFollowStats = (stockCode: string) => {
  return {
    total_followers: Math.floor(Math.random() * 10000) + 100,
    recent_followers: Math.floor(Math.random() * 100) + 10,
    follower_growth: Math.floor(Math.random() * 50) - 25, // -25 到 +25
  };
};

// 数据源降级服务
export class MockDataService {
  // 获取Mock股票列表
  static getMockStocks(options: {
    page?: number;
    limit?: number;
    search?: string;
    market?: string;
    industry?: string;
  } = {}) {
    let filteredStocks = [...mockStocks];
    
    // 应用搜索过滤
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredStocks = filteredStocks.filter(
        stock => 
          stock.code.includes(searchTerm) ||
          stock.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // 应用市场过滤
    if (options.market) {
      filteredStocks = filteredStocks.filter(stock => stock.market === options.market);
    }
    
    // 应用行业过滤
    if (options.industry) {
      filteredStocks = filteredStocks.filter(
        stock => stock.industry.includes(options.industry!)
      );
    }
    
    // 应用分页
    const page = options.page || 1;
    const limit = options.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedStocks = filteredStocks.slice(startIndex, endIndex);
    
    return {
      data: paginatedStocks,
      pagination: {
        page,
        limit,
        total: filteredStocks.length,
        pages: Math.ceil(filteredStocks.length / limit),
        has_next: endIndex < filteredStocks.length,
        has_prev: page > 1,
      },
    };
  }
  
  // 获取Mock股票详情
  static getMockStockDetail(stockCode: string) {
    const stock = mockStocks.find(s => s.code === stockCode);
    if (!stock) {
      return null;
    }
    
    return {
      ...stock,
      history_data: generateMockHistoryData(stockCode, 30),
      ai_reports: generateMockAIReports(stockCode, 5),
      technical_indicators: generateMockTechnicalIndicators(stockCode),
      follow_stats: generateMockFollowStats(stockCode),
    };
  }
  
  // 检查是否应该使用Mock数据
  static shouldUseMockData(errorCount: number, timeWindow: number = 5): boolean {
    // 如果在5分钟内出现3次或以上错误，启用Mock数据
    return errorCount >= 3;
  }
  
  // 生成降级提示消息
  static getDegradationNotice(): string {
    return '当前数据服务暂时不可用，正在使用备用数据源。数据可能存在延迟，请以实际交易数据为准。';
  }
}