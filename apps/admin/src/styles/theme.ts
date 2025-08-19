// 导入全局主题配置
const themeConfig = require('../../../theme.config.js')

export const theme = {
  token: {
    // 使用统一的品牌色
    colorPrimary: themeConfig.colors.primary,
    colorSuccess: themeConfig.colors.success,
    colorWarning: themeConfig.colors.warning,
    colorError: themeConfig.colors.error,
    colorInfo: themeConfig.colors.info,
    
    // A股特色颜色
    colorTextSuccess: themeConfig.colors.stockDown, // 绿色表示下跌
    colorTextDanger: themeConfig.colors.stockUp,    // 红色表示上涨
    
    // 字体
    fontFamily: themeConfig.typography.fontFamily.primary,
    fontSize: 14,
    
    // 圆角
    borderRadius: 6,
    
    // 间距
    padding: 16,
    margin: 16,
    
    // 中性色
    colorBgContainer: themeConfig.colors.white,
    colorBgLayout: themeConfig.colors.background.secondary,
    colorText: themeConfig.colors.text.primary,
    colorTextSecondary: themeConfig.colors.text.secondary,
    colorTextTertiary: themeConfig.colors.text.tertiary,
    colorBorder: themeConfig.colors.border.light,
  },
  
  components: {
    Layout: {
      headerBg: themeConfig.colors.primary,
      siderBg: themeConfig.colors.primary,
    },
    Menu: {
      darkItemBg: themeConfig.colors.primary,
      darkSubMenuItemBg: themeConfig.colors.primaryDark,
      darkItemSelectedBg: themeConfig.colors.primaryLight,
    },
    Table: {
      // 股票表格特殊样式
      colorTextSuccess: themeConfig.colors.stockDown,
      colorTextDanger: themeConfig.colors.stockUp,
    },
  },
}

// 股票相关的样式工具函数
export const stockUtils = {
  // 获取股票变化的颜色类名
  getChangeColor: (change: number) => {
    if (change > 0) return themeConfig.colors.stockUp    // 红色上涨
    if (change < 0) return themeConfig.colors.stockDown  // 绿色下跌
    return themeConfig.colors.stockFlat                  // 灰色平盘
  },
  
  // 获取股票变化的文本前缀
  getChangePrefix: (change: number) => {
    if (change > 0) return '+'
    return ''
  },
  
  // 格式化价格显示
  formatPrice: (price: number, precision: number = 2) => {
    return price.toFixed(precision)
  },
  
  // 格式化百分比显示
  formatPercent: (percent: number, precision: number = 2) => {
    const prefix = percent > 0 ? '+' : ''
    return `${prefix}${percent.toFixed(precision)}%`
  }
}