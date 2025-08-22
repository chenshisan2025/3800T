#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';
import { updateSDKVersion } from './update-sdk-version';

// 配置
const CONFIG = {
  openApiPath: path.join(process.cwd(), 'packages/shared-sdk/openapi.yaml'),
  outputDir: path.join(process.cwd(), 'packages/shared-sdk'),
  tempDir: path.join(process.cwd(), '.temp-sdk'),
  generators: {
    typescript: {
      name: 'typescript-fetch',
      outputDir: 'src/generated',
      additionalProperties: {
        typescriptThreePlus: 'true',
        supportsES6: 'true',
        npmName: '@gulingtong/shared-sdk',
        npmVersion: '1.0.0',
      },
    },
    dart: {
      name: 'dart',
      outputDir: 'dart/lib',
      additionalProperties: {
        pubName: 'gulingtong_sdk',
        pubVersion: '1.0.0',
        pubDescription: '古灵通股票投资平台 Dart SDK',
      },
    },
  },
};

/**
 * 检查必要的依赖
 */
function checkDependencies(): void {
  try {
    execSync('openapi-generator-cli version', { stdio: 'ignore' });
    console.log('✅ OpenAPI Generator CLI 已安装');
  } catch (error) {
    try {
      // 尝试使用npx运行
      execSync('npx @openapitools/openapi-generator-cli version', {
        stdio: 'ignore',
      });
      console.log('✅ OpenAPI Generator CLI 通过npx可用');
    } catch (npxError) {
      console.error('❌ OpenAPI Generator CLI 未安装');
      console.error(
        '请运行: npm install -g @openapitools/openapi-generator-cli'
      );
      console.error('或确保已安装的版本在PATH中');
      process.exit(1);
    }
  }
}

// 清理临时目录
function cleanTempDir() {
  if (fs.existsSync(CONFIG.tempDir)) {
    fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(CONFIG.tempDir, { recursive: true });
}

// 生成 TypeScript SDK
function generateTypeScriptSDK() {
  console.log('🔨 生成 TypeScript SDK...');

  const { typescript } = CONFIG.generators;
  const outputPath = path.join(CONFIG.outputDir, typescript.outputDir);

  // 清理输出目录
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true, force: true });
  }

  // 构建生成命令
  const additionalProps = Object.entries(typescript.additionalProperties)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

  const command = [
    'openapi-generator-cli generate',
    `-i ${CONFIG.openApiPath}`,
    `-g ${typescript.name}`,
    `-o ${outputPath}`,
    `--additional-properties ${additionalProps}`,
    '--skip-validate-spec',
    '--remove-operation-id-prefix',
  ].join(' ');

  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ TypeScript SDK 生成成功');

    // 后处理：修复生成的代码
    postProcessTypeScriptSDK(outputPath);
  } catch (error) {
    console.error('❌ TypeScript SDK 生成失败:', error);
    throw error;
  }
}

// 生成 Dart SDK
function generateDartSDK() {
  console.log('🔨 生成 Dart SDK...');

  const { dart } = CONFIG.generators;
  const outputPath = path.join(CONFIG.outputDir, dart.outputDir);

  // 清理输出目录
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true, force: true });
  }

  // 构建生成命令
  const additionalProps = Object.entries(dart.additionalProperties)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');

  const command = [
    'openapi-generator-cli generate',
    `-i ${CONFIG.openApiPath}`,
    `-g ${dart.name}`,
    `-o ${outputPath}`,
    `--additional-properties ${additionalProps}`,
    '--skip-validate-spec',
  ].join(' ');

  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Dart SDK 生成成功');

    // 后处理：修复生成的代码
    postProcessDartSDK(outputPath);
  } catch (error) {
    console.error('❌ Dart SDK 生成失败:', error);
    throw error;
  }
}

// TypeScript SDK 后处理
function postProcessTypeScriptSDK(outputPath: string) {
  console.log('🔧 后处理 TypeScript SDK...');

  // 创建索引文件
  const indexContent = `// 古灵通股票投资平台 TypeScript SDK
// 自动生成，请勿手动修改

export * from './apis';
export * from './models';
export * from './runtime';

// 默认配置
export const DEFAULT_CONFIG = {
  basePath: process.env.NODE_ENV === 'production' 
    ? 'https://api.gulingtong.com'
    : 'http://localhost:3001',
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json'
  }
};

// SDK 版本
export const SDK_VERSION = '1.0.0';
`;

  fs.writeFileSync(path.join(outputPath, 'index.ts'), indexContent);

  // 更新 package.json 中的导出路径
  updatePackageJsonExports();
}

// Dart SDK 后处理
function postProcessDartSDK(outputPath: string) {
  console.log('🔧 后处理 Dart SDK...');

  // 创建主库文件
  const libContent = `/// 古灵通股票投资平台 Dart SDK
/// 自动生成，请勿手动修改
library gulingtong_sdk;

export 'src/api.dart';
export 'src/model/model.dart';
export 'src/auth/auth.dart';

/// SDK 版本
const String sdkVersion = '1.0.0';

/// 默认配置
class DefaultConfig {
  static const String basePath = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.gulingtong.com'
  );
}
`;

  fs.writeFileSync(
    path.join(path.dirname(outputPath), 'gulingtong_sdk.dart'),
    libContent
  );
}

// 更新 package.json 导出
function updatePackageJsonExports() {
  const packageJsonPath = path.join(CONFIG.outputDir, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    packageJson.main = 'src/generated/index.js';
    packageJson.types = 'src/generated/index.d.ts';
    packageJson.exports = {
      '.': {
        import: './src/generated/index.js',
        require: './src/generated/index.js',
        types: './src/generated/index.d.ts',
      },
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ 已更新 package.json 导出配置');
  }
}

// 生成版本信息
function generateVersionInfo() {
  const versionInfo = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    openApiSpec: CONFIG.openApiPath,
    generators: Object.keys(CONFIG.generators),
  };

  const versionPath = path.join(CONFIG.outputDir, 'sdk-version.json');
  fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
  console.log('✅ 已生成版本信息文件');
}

// 主函数
async function generateSDK() {
  console.log('🚀 开始生成 SDK...');

  try {
    // 检查依赖
    checkDependencies();

    // 更新SDK版本
    console.log('📦 Updating SDK version...');
    await updateSDKVersion();

    // 清理临时目录
    cleanTempDir();

    // 生成 TypeScript SDK
    generateTypeScriptSDK();

    // 生成 Dart SDK（可选）
    if (process.argv.includes('--dart')) {
      generateDartSDK();
    }

    // 生成版本信息
    generateVersionInfo();

    // 清理临时文件
    if (fs.existsSync(CONFIG.tempDir)) {
      fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
    }

    console.log('🎉 SDK 生成完成！');
  } catch (error) {
    console.error('💥 SDK 生成失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  generateSDK().catch(console.error);
}

export { generateSDK };
