import { z } from 'zod';

// 用户相关类型
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string().optional(),
  avatar_url: z.string().url().optional(),
  subscription_plan: z.enum(['free', 'basic', 'premium', 'admin']),
  created_at: z.date(),
  updated_at: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// 认证相关类型
export const LoginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

export const RegisterSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  nickname: z.string().min(1, '昵称不能为空').optional(),
});

export const MagicLinkSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type MagicLinkRequest = z.infer<typeof MagicLinkSchema>;

// 股票相关类型
export const StockSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  name: z.string(),
  market: z.enum(['SH', 'SZ', 'BJ']),
  industry: z.string().optional(),
  sector: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const StockDataSchema = z.object({
  id: z.string().uuid(),
  stock_id: z.string().uuid(),
  date: z.date(),
  open_price: z.number().positive(),
  close_price: z.number().positive(),
  high_price: z.number().positive(),
  low_price: z.number().positive(),
  volume: z.number().nonnegative(),
  turnover: z.number().nonnegative(),
  change_percent: z.number(),
  created_at: z.date(),
});

export type Stock = z.infer<typeof StockSchema>;
export type StockData = z.infer<typeof StockDataSchema>;

// 自选股相关类型
export const WatchlistSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  stock_id: z.string().uuid(),
  created_at: z.date(),
});

export const AddToWatchlistSchema = z.object({
  stock_code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
});

export const RemoveFromWatchlistSchema = z.object({
  stock_id: z.string().uuid(),
});

export type Watchlist = z.infer<typeof WatchlistSchema>;
export type AddToWatchlistRequest = z.infer<typeof AddToWatchlistSchema>;
export type RemoveFromWatchlistRequest = z.infer<
  typeof RemoveFromWatchlistSchema
>;

// 投资组合相关类型
export const PortfolioSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const PortfolioItemSchema = z.object({
  id: z.string().uuid(),
  portfolio_id: z.string().uuid(),
  stock_id: z.string().uuid(),
  quantity: z.number().positive(),
  average_cost: z.number().positive(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreatePortfolioSchema = z.object({
  name: z.string().min(1, '投资组合名称不能为空'),
  description: z.string().optional(),
});

export const AddPortfolioItemSchema = z.object({
  stock_code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  quantity: z.number().positive('持股数量必须大于0'),
  average_cost: z.number().positive('平均成本必须大于0'),
});

export type Portfolio = z.infer<typeof PortfolioSchema>;
export type PortfolioItem = z.infer<typeof PortfolioItemSchema>;
export type CreatePortfolioRequest = z.infer<typeof CreatePortfolioSchema>;
export type AddPortfolioItemRequest = z.infer<typeof AddPortfolioItemSchema>;

// AI 报告相关类型
export const AiReportSchema = z.object({
  id: z.string().uuid(),
  stock_id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  analysis_type: z.enum([
    'technical',
    'fundamental',
    'sentiment',
    'comprehensive',
  ]),
  confidence_score: z.number().min(0).max(1),
  created_at: z.date(),
  updated_at: z.date(),
});

export const GenerateReportSchema = z.object({
  stock_code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  analysis_type: z.enum([
    'technical',
    'fundamental',
    'sentiment',
    'comprehensive',
  ]),
});

export type AiReport = z.infer<typeof AiReportSchema>;
export type GenerateReportRequest = z.infer<typeof GenerateReportSchema>;

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 查询参数类型
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const StockQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  market: z.enum(['SH', 'SZ', 'BJ']).optional(),
  industry: z.string().optional(),
});

export const StockDataQuerySchema = z.object({
  stock_code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '开始日期格式错误')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '结束日期格式错误')
    .optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type StockQuery = z.infer<typeof StockQuerySchema>;
export type StockDataQuery = z.infer<typeof StockDataQuerySchema>;

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 中间件类型
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// 环境变量类型
export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
  STOCK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  REDIS_URL?: string;
  // 数据提供商配置
  DATA_PROVIDER?: string;
  DATA_PROVIDER_KEY?: string;
  DATA_PROVIDER_BASE_URL?: string;
}

// 数据提供者相关类型
export interface DataProviderMetadata {
  source: string;
  lagMs?: number; // 延迟时间（毫秒）
  timestamp: number;
}

// 指数数据类型
export const IndexDataSchema = z.object({
  code: z.string(), // 指数代码，如 '000001'
  name: z.string(), // 指数名称，如 '上证指数'
  current: z.number(), // 当前点位
  change: z.number(), // 涨跌点数
  change_percent: z.number(), // 涨跌幅百分比
  open: z.number(), // 开盘点位
  high: z.number(), // 最高点位
  low: z.number(), // 最低点位
  volume: z.number().optional(), // 成交量
  turnover: z.number().optional(), // 成交额
  timestamp: z.number(), // 数据时间戳
});

export type IndexData = z.infer<typeof IndexDataSchema>;

export interface IndexDataWithMetadata extends IndexData {
  metadata: DataProviderMetadata;
}

// 股票报价数据类型
export const QuoteDataSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  name: z.string(),
  current: z.number(), // 当前价格
  change: z.number(), // 涨跌额
  change_percent: z.number(), // 涨跌幅百分比
  open: z.number(), // 开盘价
  high: z.number(), // 最高价
  low: z.number(), // 最低价
  pre_close: z.number(), // 昨收价
  volume: z.number(), // 成交量
  turnover: z.number(), // 成交额
  bid1: z.number().optional(), // 买一价
  ask1: z.number().optional(), // 卖一价
  bid1_volume: z.number().optional(), // 买一量
  ask1_volume: z.number().optional(), // 卖一量
  timestamp: z.number(), // 数据时间戳
});

export type QuoteData = z.infer<typeof QuoteDataSchema>;

export interface QuoteDataWithMetadata extends QuoteData {
  metadata: DataProviderMetadata;
}

// K线数据类型
export const KlineDataSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  period: z.enum(['1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M']), // K线周期
  timestamp: z.number(), // 时间戳
  open: z.number(), // 开盘价
  high: z.number(), // 最高价
  low: z.number(), // 最低价
  close: z.number(), // 收盘价
  volume: z.number(), // 成交量
  turnover: z.number().optional(), // 成交额
});

export type KlineData = z.infer<typeof KlineDataSchema>;

export interface KlineDataWithMetadata {
  data: KlineData[];
  metadata: DataProviderMetadata;
}

// 新闻数据类型
export const NewsDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  content: z.string().optional(),
  source: z.string(), // 新闻来源
  author: z.string().optional(),
  publish_time: z.number(), // 发布时间戳
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(), // 标签
  related_stocks: z.array(z.string()).optional(), // 相关股票代码
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(), // 情感倾向
});

export type NewsData = z.infer<typeof NewsDataSchema>;

export interface NewsDataWithMetadata {
  data: NewsData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  metadata: DataProviderMetadata;
}

// 数据提供者查询参数
export const IndicesQuerySchema = z.object({
  codes: z.array(z.string()).optional(), // 指定指数代码列表
});

export const QuotesQuerySchema = z.object({
  codes: z.array(z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字')), // 股票代码列表
  market: z.enum(['SH', 'SZ', 'BJ']).optional(), // 市场代码
  fields: z.array(z.string()).optional(), // 请求字段列表
});

export const KlineQuerySchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'),
  period: z.enum(['1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M']),
  start_time: z.number().optional(), // 开始时间戳
  end_time: z.number().optional(), // 结束时间戳
  limit: z.number().min(1).max(1000).default(100), // 数据条数限制
});

export const NewsQuerySchema = z.object({
  keywords: z.string().optional(), // 关键词搜索
  stock_codes: z
    .array(z.string().regex(/^[0-9]{6}$/, '股票代码必须为6位数字'))
    .optional(), // 相关股票
  start_time: z.number().optional(), // 开始时间戳
  end_time: z.number().optional(), // 结束时间戳
  limit: z.number().min(1).max(100).default(20), // 数据条数限制
});

export type IndicesQuery = z.infer<typeof IndicesQuerySchema>;
export type QuotesQuery = z.infer<typeof QuotesQuerySchema>;
export type KlineQuery = z.infer<typeof KlineQuerySchema>;
export type NewsQuery = z.infer<typeof NewsQuerySchema>;

// 数据提供者接口
export interface IDataProvider {
  name: string;

  // 获取指数数据
  getIndices(query?: IndicesQuery): Promise<IndexDataWithMetadata[]>;

  // 获取股票报价数据
  getQuotes(query: QuotesQuery): Promise<QuoteDataWithMetadata[]>;

  // 获取K线数据
  getKline(query: KlineQuery): Promise<KlineDataWithMetadata>;

  // 获取新闻数据
  getNews(query?: NewsQuery): Promise<NewsDataWithMetadata>;

  // 健康检查
  healthCheck(): Promise<boolean>;
}

// 数据提供者配置
export interface DataProviderConfig {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryCount?: number;
}
