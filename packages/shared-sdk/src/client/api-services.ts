/**
 * 古灵通 API 服务类
 * 封装各个业务模块的接口调用
 */

import {
  SystemApi,
  AuthenticationApi,
  StocksApi,
  WatchlistApi,
  PortfolioApi,
  AlertsApi,
  AIReportsApi,
} from '../generated/src/apis';
import { Configuration } from '../generated/src/runtime';

/**
 * API 服务管理器
 */
export class GulingtongApiServices {
  public readonly system: SystemApi;
  public readonly auth: AuthenticationApi;
  public readonly stocks: StocksApi;
  public readonly watchlist: WatchlistApi;
  public readonly portfolio: PortfolioApi;
  public readonly alerts: AlertsApi;
  public readonly aiReports: AIReportsApi;

  constructor(config: Configuration) {
    this.system = new SystemApi(config);
    this.auth = new AuthenticationApi(config);
    this.stocks = new StocksApi(config);
    this.watchlist = new WatchlistApi(config);
    this.portfolio = new PortfolioApi(config);
    this.alerts = new AlertsApi(config);
    this.aiReports = new AIReportsApi(config);
  }
}

/**
 * 创建 API 服务实例
 */
export function createApiServices(
  baseUrl: string,
  accessToken?: string
): GulingtongApiServices {
  const config = new Configuration({
    basePath: baseUrl,
    accessToken: accessToken,
  });

  return new GulingtongApiServices(config);
}

// 导出生成的类型和 API
export * from '../generated/src/models';
export * from '../generated/src/apis';
