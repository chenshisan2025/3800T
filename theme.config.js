// 古灵通全局主题配置
// 统一管理所有应用的主题色彩和样式规范

module.exports = {
  // 主色调
  colors: {
    // 品牌主色
    primary: '#2166A5',
    primaryLight: '#4A90E2',
    primaryDark: '#1A5490',
    
    // A股特色：红涨绿跌（与国际惯例相反）
    stockUp: '#FF4444',     // 红色 - 上涨
    stockDown: '#00C851',   // 绿色 - 下跌
    stockFlat: '#666666',   // 灰色 - 平盘
    
    // 功能色彩
    success: '#00C851',
    warning: '#FFB300',
    error: '#FF4444',
    info: '#2166A5',
    
    // 中性色彩
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827'
    },
    
    // 背景色
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F5F5',
      tertiary: '#FAFAFA'
    },
    
    // 文本色
    text: {
      primary: '#333333',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#FFFFFF'
    },
    
    // 边框色
    border: {
      light: '#F0F0F0',
      medium: '#E0E0E0',
      dark: '#D0D0D0'
    }
  },
  
  // 字体规范
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8
    }
  },
  
  // 间距规范
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px'
  },
  
  // 圆角规范
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  
  // 阴影规范
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  
  // 断点规范
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // 动画规范
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  },
  
  // 应用特定配置
  apps: {
    // Web 应用配置
    web: {
      containerMaxWidth: '1200px',
      headerHeight: '64px',
      sidebarWidth: '240px'
    },
    
    // 移动端配置
    mobile: {
      tabBarHeight: '60px',
      headerHeight: '44px'
    },
    
    // 小程序配置
    miniapp: {
      // 小程序使用 rpx 单位
      spacing: {
        xs: '8rpx',
        sm: '16rpx',
        md: '32rpx',
        lg: '48rpx',
        xl: '64rpx'
      },
      fontSize: {
        xs: '22rpx',
        sm: '26rpx',
        base: '28rpx',
        lg: '32rpx',
        xl: '36rpx'
      }
    }
  }
}