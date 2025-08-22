#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import yaml from 'js-yaml';

// OpenAPI 基础结构
const openApiBase = {
  openapi: '3.0.3',
  info: {
    title: '古灵通股票投资平台 API',
    description: `古灵通股票投资平台的 RESTful API 服务
    
## 功能特性
- 用户认证与授权
- 股票数据查询
- 自选股管理
- 投资组合管理
- AI 投资报告
- 实时行情数据

## 认证方式
使用 Bearer Token 进行身份验证，通过 Supabase Auth 获取访问令牌。

## 响应格式
所有 API 响应都遵循统一的格式：
\`\`\`json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\``,
    version: '1.0.0',
    contact: {
      name: '古灵通团队',
      email: 'support@gulingtong.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: '开发环境',
    },
    {
      url: 'https://api.gulingtong.com',
      description: '生产环境',
    },
  ],
  security: [{ BearerAuth: [] }],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: '操作成功' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'healthy' },
              database: { type: 'string', example: 'connected' },
              uptime: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
};

// HTTP 方法映射
const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'HEAD',
];

// 路由标签映射
const getTagFromPath = (apiPath: string): string => {
  if (apiPath.includes('/auth')) return 'Authentication';
  if (apiPath.includes('/stocks')) return 'Stocks';
  if (apiPath.includes('/watchlist')) return 'Watchlist';
  if (apiPath.includes('/portfolio')) return 'Portfolio';
  if (apiPath.includes('/ai')) return 'AI Reports';
  if (apiPath.includes('/alerts')) return 'Alerts';
  if (apiPath.includes('/users')) return 'Users';
  if (apiPath.includes('/pricing')) return 'Pricing';
  if (apiPath.includes('/health')) return 'System';
  if (apiPath.includes('/market')) return 'Market Data';
  if (apiPath.includes('/news')) return 'News';
  return 'Other';
};

// 从路由文件中提取API信息
function extractApiInfo(filePath: string, routePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const apiPath = routePath.replace(/\[([^\]]+)\]/g, '{$1}');

    const pathInfo: any = {};

    // 检查每个HTTP方法
    HTTP_METHODS.forEach(method => {
      const methodLower = method.toLowerCase();
      const exportPattern = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\(`,
        'i'
      );

      if (exportPattern.test(content)) {
        const tag = getTagFromPath(apiPath);
        const summary = generateSummary(apiPath, method);
        const description = generateDescription(apiPath, method);

        pathInfo[methodLower] = {
          tags: [tag],
          summary,
          description,
          responses: {
            '200': {
              description: '请求成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': {
              description: '请求参数错误',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '401': {
              description: '未授权',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '500': {
              description: '服务器内部错误',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        };

        // 添加路径参数
        const pathParams = apiPath.match(/\{([^}]+)\}/g);
        if (pathParams) {
          pathInfo[methodLower].parameters = pathParams.map(param => ({
            name: param.slice(1, -1),
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: `${param.slice(1, -1)} 参数`,
          }));
        }

        // 为POST/PUT/PATCH添加请求体
        if (['post', 'put', 'patch'].includes(methodLower)) {
          pathInfo[methodLower].requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          };
        }

        // 为GET添加查询参数
        if (
          methodLower === 'get' &&
          (apiPath.includes('/stocks') || apiPath.includes('/watchlist'))
        ) {
          pathInfo[methodLower].parameters = [
            ...(pathInfo[methodLower].parameters || []),
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', minimum: 1, default: 1 },
              description: '页码',
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
              },
              description: '每页数量',
            },
          ];
        }

        // 设置安全性
        if (
          !apiPath.includes('/health') &&
          !apiPath.includes('/auth/register') &&
          !apiPath.includes('/auth/login')
        ) {
          pathInfo[methodLower].security = [{ BearerAuth: [] }];
        } else {
          pathInfo[methodLower].security = [];
        }
      }
    });

    return Object.keys(pathInfo).length > 0 ? pathInfo : null;
  } catch (error) {
    console.warn(`Warning: Could not process ${filePath}:`, error);
    return null;
  }
}

// 生成摘要
function generateSummary(apiPath: string, method: string): string {
  const action =
    {
      GET: '获取',
      POST: '创建',
      PUT: '更新',
      DELETE: '删除',
      PATCH: '修改',
    }[method] || '操作';

  if (apiPath.includes('/health')) return '健康检查';
  if (apiPath.includes('/auth/login')) return '用户登录';
  if (apiPath.includes('/auth/register')) return '用户注册';
  if (apiPath.includes('/auth/logout')) return '用户登出';
  if (apiPath.includes('/auth/me')) return '获取当前用户信息';
  if (apiPath.includes('/stocks')) return `${action}股票信息`;
  if (apiPath.includes('/watchlist')) return `${action}自选股`;
  if (apiPath.includes('/portfolio')) return `${action}投资组合`;
  if (apiPath.includes('/ai/reports')) return `${action}AI报告`;
  if (apiPath.includes('/alerts')) return `${action}价格提醒`;
  if (apiPath.includes('/pricing')) return `${action}定价信息`;

  return `${action}资源`;
}

// 生成描述
function generateDescription(apiPath: string, method: string): string {
  const baseDesc = generateSummary(apiPath, method);
  return `${baseDesc}的详细操作`;
}

// 主函数
async function generateOpenAPI() {
  console.log('🚀 开始生成 OpenAPI 规范...');

  const srcDir = path.join(process.cwd(), 'src');
  const outputPath = path.join(
    process.cwd(),
    '../../packages/shared-sdk/openapi.yaml'
  );

  // 查找所有路由文件
  const routeFiles = await glob('**/route.{ts,js}', {
    cwd: srcDir,
    absolute: true,
  });

  console.log(`📁 找到 ${routeFiles.length} 个路由文件`);

  const openApiSpec = { ...openApiBase };

  // 处理每个路由文件
  for (const filePath of routeFiles) {
    const relativePath = path.relative(srcDir, filePath);
    const routePath =
      relativePath
        .replace(/\/route\.(ts|js)$/, '')
        .replace(/^app\/api/, '')
        .replace(/\/+/g, '/')
        .replace(/^\/$/, '') || '/';

    const apiPath = `/api${routePath}`;

    console.log(`📄 处理路由: ${apiPath}`);

    const pathInfo = extractApiInfo(filePath, apiPath);
    if (pathInfo) {
      openApiSpec.paths[apiPath] = pathInfo;
    }
  }

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入YAML文件
  const yamlContent = yaml.dump(openApiSpec, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  fs.writeFileSync(outputPath, yamlContent, 'utf-8');

  console.log(`✅ OpenAPI 规范已生成: ${outputPath}`);
  console.log(`📊 共处理 ${Object.keys(openApiSpec.paths).length} 个API端点`);
}

// 运行脚本
if (require.main === module) {
  generateOpenAPI().catch(console.error);
}

export { generateOpenAPI };
