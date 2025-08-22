import { NextRequest } from 'next/server';
import { ok, withErrorHandling } from '../../../lib/http';
import { logRequest } from '../../../lib/log';

interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit?: string;
  environment: string;
  nodeVersion: string;
  uptime: number;
}

/**
 * GET /api/version
 * 返回应用版本信息
 */
export const GET = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const startTime = Date.now();
    const requestLogger = logRequest(request, requestId, startTime);

    requestLogger.start();

    try {
      // 从package.json或环境变量获取版本信息
      const packageJson = require('../../../../package.json');

      const versionInfo: VersionInfo = {
        version: packageJson.version || process.env.APP_VERSION || '1.0.0',
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        gitCommit: process.env.GIT_COMMIT || undefined,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
      };

      requestLogger.end(200);

      return ok(
        versionInfo,
        'Version information retrieved successfully',
        requestId
      );
    } catch (error) {
      requestLogger.error(error as Error, 500);
      throw error;
    }
  }
);

/**
 * HEAD /api/version
 * 快速版本检查，只返回状态码
 */
export const HEAD = withErrorHandling(
  async (request: NextRequest, requestId: string) => {
    const startTime = Date.now();
    const requestLogger = logRequest(request, requestId, startTime);

    requestLogger.start();

    try {
      requestLogger.end(200);

      // HEAD请求只返回状态码和头部，不返回body
      const response = ok(null, undefined, requestId);
      return new Response(null, {
        status: 200,
        headers: response.headers,
      });
    } catch (error) {
      requestLogger.error(error as Error, 500);
      throw error;
    }
  }
);
