/**
 * 古灵通 API 客户端入口文件
 * 导出所有客户端相关的类和函数
 */

// 导出生成的 API 配置
export { Configuration } from '../generated/src/runtime';

// API 服务
export {
  GulingtongApiServices,
  createApiServices,
} from './api-services';

// 重新导出生成的 API 和类型
export * from './api-services';

// 便捷创建函数
import { createApiServices } from './api-services';

/**
 * 创建完整的 API 客户端和服务
 */
export function createGulingtongClient(baseUrl: string, accessToken?: string) {
  const services = createApiServices(baseUrl, accessToken);
  
  return {
    services,
    // 便捷访问各个 API
    system: services.system,
    auth: services.auth,
    stocks: services.stocks,
    watchlist: services.watchlist,
    portfolio: services.portfolio,
    alerts: services.alerts,
    aiReports: services.aiReports,
  };
}

/**
 * 默认客户端实例类型
 */
export type GulingtongClient = ReturnType<typeof createGulingtongClient>;