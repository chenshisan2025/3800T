import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getComplianceConfigManager,
  ComplianceConfigManager,
} from '../../../../lib/compliance-config';
import {
  GetComplianceConfigRequest,
  UpdateComplianceConfigRequest,
  ComplianceConfigResponse,
  SupportedLanguage,
} from '../../../../types/compliance';

// ============================================================================
// 请求参数验证
// ============================================================================

/** 获取配置请求参数验证 */
const GetConfigSchema = z.object({
  pageId: z.string().optional(),
  language: z.enum(['zh', 'en']).optional().default('zh'),
});

/** 更新配置请求参数验证 */
const UpdateConfigSchema = z.object({
  globalConfig: z
    .object({
      disclaimerEnabled: z.boolean().optional(),
      dataSourceHintEnabled: z.boolean().optional(),
      version: z.string().optional(),
    })
    .optional(),
  disclaimerConfigs: z.array(z.any()).optional(),
  dataSourceConfigs: z.array(z.any()).optional(),
  pageConfigs: z.array(z.any()).optional(),
});

/**
 * GET /api/compliance/config
 * 获取合规配置
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      pageId: searchParams.get('pageId') || undefined,
      language: (searchParams.get('language') as SupportedLanguage) || 'zh',
    };

    // 验证请求参数
    const validatedParams = GetConfigSchema.parse(params);

    // 获取配置管理器实例
    const configManager = getComplianceConfigManager();

    // 根据页面ID和语言获取配置
    const configData = configManager.getConfigByPage(
      validatedParams.pageId,
      validatedParams.language
    );

    const response: ComplianceConfigResponse = {
      success: true,
      data: configData,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('获取合规配置失败:', error);

    const errorResponse: ComplianceConfigResponse = {
      success: false,
      data: {
        globalConfig: {
          disclaimerEnabled: false,
          dataSourceHintEnabled: false,
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
        },
        disclaimerConfigs: [],
        dataSourceConfigs: [],
        pageConfigs: [],
      },
      message: '获取合规配置失败',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * PUT /api/compliance/config
 * 更新合规配置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求参数
    const validatedData = UpdateConfigSchema.parse(body);

    // 获取配置管理器实例
    const configManager = getComplianceConfigManager();

    // 更新全局配置
    if (validatedData.globalConfig) {
      configManager.updateGlobalConfig(validatedData.globalConfig);
    }

    // 更新免责声明配置
    if (validatedData.disclaimerConfigs) {
      configManager.updateDisclaimerConfigs(validatedData.disclaimerConfigs);
    }

    // 更新数据源配置
    if (validatedData.dataSourceConfigs) {
      configManager.updateDataSourceConfigs(validatedData.dataSourceConfigs);
    }

    // 更新页面配置
    if (validatedData.pageConfigs) {
      configManager.updatePageConfigs(validatedData.pageConfigs);
    }

    // 获取更新后的完整配置
    const updatedConfigData = configManager.getConfigData();

    const response: ComplianceConfigResponse = {
      success: true,
      data: updatedConfigData,
      message: '配置更新成功',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('更新合规配置失败:', error);

    const errorResponse: ComplianceConfigResponse = {
      success: false,
      data: {
        globalConfig: {
          disclaimerEnabled: false,
          dataSourceHintEnabled: false,
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
        },
        disclaimerConfigs: [],
        dataSourceConfigs: [],
        pageConfigs: [],
      },
      message: '更新合规配置失败',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
