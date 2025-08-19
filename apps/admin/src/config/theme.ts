import type { ThemeConfig } from 'antd';

// 古灵通主题配置
export const antdTheme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#2166A5',
    colorPrimaryHover: '#1d5a96',
    colorPrimaryActive: '#1a4f87',
    
    // 成功色（股票下跌 - 绿色）
    colorSuccess: '#52c41a',
    colorSuccessHover: '#73d13d',
    colorSuccessActive: '#389e0d',
    
    // 错误色（股票上涨 - 红色）
    colorError: '#ff4d4f',
    colorErrorHover: '#ff7875',
    colorErrorActive: '#d9363e',
    
    // 警告色
    colorWarning: '#faad14',
    colorWarningHover: '#ffc53d',
    colorWarningActive: '#d48806',
    
    // 信息色
    colorInfo: '#1677ff',
    colorInfoHover: '#4096ff',
    colorInfoActive: '#0958d9',
    
    // 文本色
    colorText: '#262626',
    colorTextSecondary: '#595959',
    colorTextTertiary: '#8c8c8c',
    colorTextQuaternary: '#bfbfbf',
    
    // 背景色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgSpotlight: '#ffffff',
    
    // 边框色
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // 字体
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // 行高
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // 控件高度
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    
    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    
    // 动画
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    // 布局组件
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
      siderBg: '#ffffff',
      footerBg: '#f5f5f5',
      footerPadding: '24px 50px',
      triggerBg: '#ffffff',
      triggerColor: '#262626',
      zeroTriggerWidth: 36,
      zeroTriggerHeight: 42,
    },
    
    // 菜单组件
    Menu: {
      itemBg: 'transparent',
      itemColor: '#262626',
      itemHoverBg: '#f5f5f5',
      itemHoverColor: '#2166A5',
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: '#2166A5',
      itemActiveBg: '#e6f4ff',
      subMenuItemBg: 'transparent',
      groupTitleColor: '#8c8c8c',
      itemMarginBlock: 4,
      itemMarginInline: 4,
      itemPaddingInline: 12,
    },
    
    // 按钮组件
    Button: {
      primaryShadow: '0 2px 0 rgba(33, 102, 165, 0.1)',
      dangerShadow: '0 2px 0 rgba(255, 77, 79, 0.1)',
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
    },
    
    // 表格组件
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      headerSortActiveBg: '#f0f0f0',
      headerSortHoverBg: '#f5f5f5',
      bodySortBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
      rowSelectedBg: '#e6f4ff',
      rowSelectedHoverBg: '#dcf4ff',
    },
    
    // 卡片组件
    Card: {
      headerBg: 'transparent',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 56,
      headerHeightSM: 48,
    },
    
    // 统计数值组件
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
    
    // 标签组件
    Tag: {
      defaultBg: '#fafafa',
      defaultColor: '#262626',
    },
    
    // 徽章组件
    Badge: {
      textFontSize: 12,
      textFontSizeSM: 10,
    },
    
    // 输入框组件
    Input: {
      hoverBorderColor: '#2166A5',
      activeBorderColor: '#2166A5',
    },
    
    // 选择器组件
    Select: {
      optionSelectedBg: '#e6f4ff',
      optionSelectedColor: '#2166A5',
      optionActiveBg: '#f5f5f5',
    },
    
    // 日期选择器
    DatePicker: {
      cellHoverBg: '#f5f5f5',
      cellActiveWithRangeBg: '#e6f4ff',
      cellRangeBorderColor: '#2166A5',
    },
    
    // 分页组件
    Pagination: {
      itemActiveBg: '#2166A5',
      itemLinkBg: 'transparent',
      itemInputBg: 'transparent',
    },
    
    // 步骤条组件
    Steps: {
      colorPrimary: '#2166A5',
      navArrowColor: '#2166A5',
    },
    
    // 进度条组件
    Progress: {
      defaultColor: '#2166A5',
      remainingColor: 'rgba(0, 0, 0, 0.06)',
    },
    
    // 消息提示组件
    Message: {
      contentBg: '#ffffff',
      contentPadding: '10px 16px',
    },
    
    // 通知提醒组件
    Notification: {
      // 使用标准的背景色配置
    },
    
    // 抽屉组件
    Drawer: {
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
    },
    
    // 模态框组件
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: 'transparent',
    },
  },
  algorithm: [
    // 可以在这里添加算法，如 theme.darkAlgorithm
  ],
};

// 股票相关颜色常量
export const STOCK_COLORS = {
  UP: '#ff4d4f',     // 上涨 - 红色
  DOWN: '#52c41a',   // 下跌 - 绿色
  FLAT: '#8c8c8c',   // 平盘 - 灰色
} as const;

// 图表颜色配置
export const CHART_COLORS = {
  PRIMARY: '#2166A5',
  SUCCESS: '#52c41a',
  ERROR: '#ff4d4f',
  WARNING: '#faad14',
  INFO: '#1677ff',
  GRADIENT: {
    PRIMARY: ['#2166A5', '#1d5a96'],
    SUCCESS: ['#52c41a', '#389e0d'],
    ERROR: ['#ff4d4f', '#d9363e'],
    WARNING: ['#faad14', '#d48806'],
  },
} as const;

// 响应式断点
export const BREAKPOINTS = {
  XS: 480,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1600,
} as const;