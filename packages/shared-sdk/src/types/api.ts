/**
 * 古灵通股票投资平台 API 类型定义
 * 基于 OpenAPI 3.0.3 规范自动生成
 */

// ============================================================================
// 基础类型
// ============================================================================

/**
 * API 响应基础类型
 */
export interface BaseResponse {
  /** 请求是否成功 */
  success: boolean;
  /** 响应消息 */
  message?: string;
  /** 响应时间戳 */
  timestamp: string;
}

/**
 * 成功响应类型
 */
export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  /** 响应数据 */
  data: T;
}

/**
 * 错误响应类型
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  /** 错误信息 */
  error: {
    /** 错误代码 */
    code: string;
    /** 错误详情 */
    details?: Record<string, any>;
  };
}

/**
 * API 响应类型联合
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * 分页元数据
 */
export interface PaginationMeta {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  total_pages: number;
  /** 是否有下一页 */
  has_next: boolean;
  /** 是否有上一页 */
  has_prev: boolean;
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 分页信息 */
  pagination: PaginationMeta;
}

// ============================================================================
// 健康检查
// ============================================================================

/**
 * 健康检查响应数据
 */
export interface HealthData {
  /** 服务状态 */
  status: 'healthy' | 'unhealthy';
  /** 数据库状态 */
  database: {
    /** 连接状态 */
    status: 'connected' | 'disconnected';
    /** 响应时间（毫秒） */
    response_time: number;
  };
  /** 内存使用情况 */
  memory: {
    /** 已使用内存（字节） */
    used: number;
    /** 总内存（字节） */
    total: number;
    /** 内存使用率（百分比） */
    usage_percent: number;
  };
  /** 运行环境 */
  environment: string;
}

export type HealthResponse = SuccessResponse<HealthData>;

// ============================================================================
// 用户认证
// ============================================================================

/**
 * 用户注册请求
 */
export interface RegisterRequest {
  /** 用户邮箱 */
  email: string;
  /** 用户密码 */
  password: string;
  /** 用户昵称 */
  nickname: string;
}

/**
 * 用户登录请求
 */
export interface LoginRequest {
  /** 用户邮箱 */
  email: string;
  /** 用户密码 */
  password: string;
}

/**
 * 魔法链接请求
 */
export interface MagicLinkRequest {
  /** 用户邮箱 */
  email: string;
}

/**
 * 用户基础信息
 */
export interface User {
  /** 用户 ID */
  id: number;
  /** Supabase 用户 ID */
  supabase_id: string;
  /** 用户邮箱 */
  email: string;
  /** 用户昵称 */
  nickname: string;
  /** 头像 URL */
  avatar_url?: string | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 用户详细信息
 */
export interface UserDetail extends User {
  /** 自选股数量 */
  watchlist_count: number;
  /** 投资组合数量 */
  portfolio_count: number;
}

/**
 * 会话信息
 */
export interface Session {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 令牌过期时间 */
  expires_at: string;
}

/**
 * 认证响应数据
 */
export interface AuthData {
  /** 用户信息 */
  user: User;
  /** 会话信息 */
  session: Session;
}

export type AuthResponse = SuccessResponse<AuthData>;
export type UserResponse = SuccessResponse<UserDetail>;

// ============================================================================
// 股票相关
// ============================================================================

/**
 * 股票市场
 */
export type StockMarket = 'SH' | 'SZ' | 'BJ';

/**
 * 股票基础信息
 */
export interface Stock {
  /** 股票 ID */
  id: number;
  /** 股票代码 */
  code: string;
  /** 股票名称 */
  name: string;
  /** 所属市场 */
  market: StockMarket;
  /** 所属行业 */
  industry?: string | null;
  /** 当前价格 */
  current_price?: number | null;
  /** 涨跌幅（百分比） */
  change_percent?: number | null;
  /** 成交量 */
  volume?: number | null;
  /** 市值 */
  market_cap?: number | null;
  /** 市盈率 */
  pe_ratio?: number | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 股票历史数据
 */
export interface StockData {
  /** 数据 ID */
  id: number;
  /** 股票 ID */
  stock_id: number;
  /** 交易日期 */
  date: string;
  /** 开盘价 */
  open_price: number;
  /** 收盘价 */
  close_price: number;
  /** 最高价 */
  high_price: number;
  /** 最低价 */
  low_price: number;
  /** 成交量 */
  volume: number;
  /** 成交额 */
  turnover: number;
  /** 涨跌幅 */
  change_percent: number;
  /** 创建时间 */
  created_at: string;
}

/**
 * 创建股票请求
 */
export interface CreateStockRequest {
  /** 股票代码 */
  code: string;
  /** 股票名称 */
  name: string;
  /** 所属市场 */
  market: StockMarket;
  /** 所属行业 */
  industry?: string | null;
}

/**
 * 更新股票请求
 */
export interface UpdateStockRequest {
  /** 股票名称 */
  name?: string;
  /** 所属行业 */
  industry?: string | null;
  /** 当前价格 */
  current_price?: number | null;
  /** 涨跌幅 */
  change_percent?: number | null;
  /** 成交量 */
  volume?: number | null;
  /** 市值 */
  market_cap?: number | null;
  /** 市盈率 */
  pe_ratio?: number | null;
}

/**
 * 股票详情数据
 */
export interface StockDetail extends Stock {
  /** 最近的股票数据 */
  recent_data: StockData[];
  /** 相关 AI 报告 */
  ai_reports: AiReport[];
}

export type StockResponse = SuccessResponse<Stock>;
export type StockListResponse = SuccessResponse<{
  stocks: Stock[];
  pagination: PaginationMeta;
}>;
export type StockDetailResponse = SuccessResponse<StockDetail>;
export type StockDataListResponse = SuccessResponse<{
  stock_data: StockData[];
  pagination: PaginationMeta;
}>;

// ============================================================================
// 自选股
// ============================================================================

/**
 * 自选股项目
 */
export interface WatchlistItem {
  /** 自选股 ID */
  id: number;
  /** 用户 ID */
  user_id: number;
  /** 股票信息 */
  stock: Stock;
  /** 备注 */
  notes?: string | null;
  /** 添加时间 */
  added_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 添加自选股请求
 */
export interface AddWatchlistRequest {
  /** 股票代码 */
  stock_code: string;
  /** 备注 */
  notes?: string | null;
}

/**
 * 更新自选股请求
 */
export interface UpdateWatchlistRequest {
  /** 备注 */
  notes?: string | null;
}

export type WatchlistResponse = SuccessResponse<{
  watchlist: WatchlistItem[];
  total_count: number;
}>;
export type WatchlistItemResponse = SuccessResponse<WatchlistItem>;

// ============================================================================
// 投资组合
// ============================================================================

/**
 * 投资组合基础信息
 */
export interface Portfolio {
  /** 投资组合 ID */
  id: number;
  /** 用户 ID */
  user_id: number;
  /** 投资组合名称 */
  name: string;
  /** 描述 */
  description?: string | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 投资组合统计数据
 */
export interface PortfolioStats {
  /** 总市值 */
  total_value: number;
  /** 总成本 */
  total_cost: number;
  /** 总盈亏 */
  total_gain_loss: number;
  /** 总盈亏百分比 */
  total_gain_loss_percent: number;
  /** 持仓数量 */
  item_count: number;
}

/**
 * 投资组合持仓项目
 */
export interface PortfolioItem {
  /** 持仓 ID */
  id: number;
  /** 投资组合 ID */
  portfolio_id: number;
  /** 股票信息 */
  stock: Stock;
  /** 持仓数量 */
  quantity: number;
  /** 平均成本 */
  average_cost: number;
  /** 当前市值 */
  current_value: number;
  /** 成本价值 */
  cost_value: number;
  /** 盈亏金额 */
  gain_loss: number;
  /** 盈亏百分比 */
  gain_loss_percent: number;
  /** 添加时间 */
  added_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 创建投资组合请求
 */
export interface CreatePortfolioRequest {
  /** 投资组合名称 */
  name: string;
  /** 描述 */
  description?: string | null;
}

/**
 * 更新投资组合请求
 */
export interface UpdatePortfolioRequest {
  /** 投资组合名称 */
  name?: string;
  /** 描述 */
  description?: string | null;
}

/**
 * 添加持仓请求
 */
export interface AddPortfolioItemRequest {
  /** 股票代码 */
  stock_code: string;
  /** 持仓数量 */
  quantity: number;
  /** 平均成本 */
  average_cost: number;
}

/**
 * 更新持仓请求
 */
export interface UpdatePortfolioItemRequest {
  /** 持仓数量 */
  quantity?: number;
  /** 平均成本 */
  average_cost?: number;
}

/**
 * 投资组合详情
 */
export interface PortfolioDetail extends Portfolio {
  /** 统计数据 */
  stats: PortfolioStats;
  /** 持仓列表 */
  items: PortfolioItem[];
}

/**
 * 带统计的投资组合
 */
export interface PortfolioWithStats extends Portfolio {
  /** 统计数据 */
  stats: PortfolioStats;
}

export type PortfolioResponse = SuccessResponse<Portfolio>;
export type PortfolioListResponse = SuccessResponse<{
  portfolios: PortfolioWithStats[];
  total_count: number;
}>;
export type PortfolioDetailResponse = SuccessResponse<PortfolioDetail>;
export type PortfolioItemResponse = SuccessResponse<PortfolioItem>;
export type PortfolioItemListResponse = SuccessResponse<{
  items: PortfolioItem[];
  stats: PortfolioStats;
}>;

// ============================================================================
// AI 报告
// ============================================================================

/**
 * 报告类型
 */
export type ReportType =
  | 'technical'
  | 'fundamental'
  | 'sentiment'
  | 'recommendation';

/**
 * 投资建议
 */
export type InvestmentRecommendation = 'buy' | 'hold' | 'sell';

/**
 * AI 报告
 */
export interface AiReport {
  /** 报告 ID */
  id: number;
  /** 股票 ID */
  stock_id: number;
  /** 股票信息 */
  stock: Stock;
  /** 报告类型 */
  report_type: ReportType;
  /** 报告标题 */
  title: string;
  /** 报告内容 */
  content: string;
  /** 报告摘要 */
  summary?: string | null;
  /** 评分（0-100） */
  score?: number | null;
  /** 投资建议 */
  recommendation?: InvestmentRecommendation | null;
  /** 置信度（0-1） */
  confidence?: number | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

export type AiReportResponse = SuccessResponse<AiReport>;
export type AiReportListResponse = SuccessResponse<{
  reports: AiReport[];
  pagination: PaginationMeta;
}>;

// ============================================================================
// API 查询参数
// ============================================================================

/**
 * 分页查询参数
 */
export interface PaginationParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
}

/**
 * 股票列表查询参数
 */
export interface StockListParams extends PaginationParams {
  /** 搜索关键词 */
  search?: string;
  /** 市场筛选 */
  market?: StockMarket;
  /** 行业筛选 */
  industry?: string;
}

/**
 * 股票数据查询参数
 */
export interface StockDataParams {
  /** 开始日期 */
  start_date?: string;
  /** 结束日期 */
  end_date?: string;
  /** 数据条数限制 */
  limit?: number;
}

/**
 * AI 报告查询参数
 */
export interface AiReportListParams extends PaginationParams {
  /** 股票代码筛选 */
  stock_code?: string;
  /** 报告类型筛选 */
  report_type?: ReportType;
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 提取响应数据类型
 */
export type ExtractData<T> = T extends SuccessResponse<infer U> ? U : never;

/**
 * API 端点路径
 */
export const API_ENDPOINTS = {
  // 健康检查
  HEALTH: '/api/health',

  // 认证
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    MAGIC_LINK: '/api/auth/magic-link',
    ME: '/api/auth/me',
  },

  // 股票
  STOCKS: {
    LIST: '/api/stocks',
    DETAIL: (code: string) => `/api/stocks/${code}`,
    DATA: (code: string) => `/api/stocks/${code}/data`,
  },

  // 自选股
  WATCHLIST: {
    LIST: '/api/users/watchlist',
    ITEM: (id: number) => `/api/users/watchlist/${id}`,
  },

  // 投资组合
  PORTFOLIO: {
    LIST: '/api/users/portfolio',
    DETAIL: (id: number) => `/api/users/portfolio/${id}`,
    ITEMS: (id: number) => `/api/users/portfolio/${id}/items`,
    ITEM: (id: number, itemId: number) =>
      `/api/users/portfolio/${id}/items/${itemId}`,
  },

  // AI 报告
  AI_REPORTS: {
    LIST: '/api/ai/reports',
    DETAIL: (id: number) => `/api/ai/reports/${id}`,
  },
} as const;

/**
 * HTTP 方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * API 请求配置
 */
export interface ApiRequestConfig {
  /** HTTP 方法 */
  method: HttpMethod;
  /** 请求路径 */
  url: string;
  /** 请求参数 */
  params?: Record<string, any>;
  /** 请求体 */
  data?: any;
  /** 请求头 */
  headers?: Record<string, string>;
}

/**
 * API 客户端接口
 */
export interface ApiClient {
  /** 发送请求 */
  request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>>;

  /** GET 请求 */
  get<T = any>(
    url: string,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>>;

  /** POST 请求 */
  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>>;

  /** PUT 请求 */
  put<T = any>(url: string, data?: any): Promise<ApiResponse<T>>;

  /** DELETE 请求 */
  delete<T = any>(url: string): Promise<ApiResponse<T>>;

  /** 设置认证令牌 */
  setAuthToken(token: string): void;

  /** 清除认证令牌 */
  clearAuthToken(): void;
}
