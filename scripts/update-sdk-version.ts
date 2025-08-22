#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';
import * as crypto from 'crypto';

// 配置
const CONFIG = {
  openApiPath: path.resolve(process.cwd(), 'openapi.yaml'),
  packageJsonPath: path.resolve(process.cwd(), 'package.json'),
  versionFilePath: path.resolve(process.cwd(), 'src/version.ts'),
  checksumPath: path.resolve(process.cwd(), '.openapi-checksum'),
};

// 如果从根目录运行，调整路径
if (process.cwd().endsWith('gulingtong')) {
  CONFIG.openApiPath = path.join(
    process.cwd(),
    'packages/shared-sdk/openapi.yaml'
  );
  CONFIG.packageJsonPath = path.join(
    process.cwd(),
    'packages/shared-sdk/package.json'
  );
  CONFIG.versionFilePath = path.join(
    process.cwd(),
    'packages/shared-sdk/src/version.ts'
  );
  CONFIG.checksumPath = path.join(
    process.cwd(),
    'packages/shared-sdk/.openapi-checksum'
  );
}

// 版本类型
type VersionBump = 'major' | 'minor' | 'patch';

// 版本信息接口
interface VersionInfo {
  version: string;
  buildTime: string;
  openapiHash: string;
  gitCommit?: string;
}

/**
 * 计算文件哈希
 */
function calculateFileHash(filePath: string): string {
  try {
    const content = readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    console.warn(`Warning: Could not calculate hash for ${filePath}:`, error);
    return '';
  }
}

/**
 * 获取Git提交哈希
 */
function getGitCommit(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Warning: Could not get git commit hash:', error);
    return 'unknown';
  }
}

/**
 * 解析版本号
 */
function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * 增加版本号
 */
function bumpVersion(currentVersion: string, bumpType: VersionBump): string {
  const { major, minor, patch } = parseVersion(currentVersion);

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump type: ${bumpType}`);
  }
}

/**
 * 检测OpenAPI变更类型
 */
function detectChangeType(): VersionBump {
  // 检查是否存在之前的校验和
  let previousHash = '';
  try {
    previousHash = readFileSync(CONFIG.checksumPath, 'utf8').trim();
  } catch (error) {
    console.log('No previous checksum found, treating as minor change');
    return 'minor';
  }

  const currentHash = calculateFileHash(CONFIG.openApiPath);

  if (previousHash === currentHash) {
    console.log('No OpenAPI changes detected');
    return 'patch'; // 即使没有变更，也可能需要更新其他内容
  }

  // 简单的变更检测逻辑
  // 在实际项目中，可以通过比较OpenAPI规范的具体内容来确定变更类型
  try {
    const openapiContent = readFileSync(CONFIG.openApiPath, 'utf8');

    // 检查是否有破坏性变更的关键词
    const breakingChangePatterns = [
      /removed.*endpoint/i,
      /deleted.*path/i,
      /changed.*required/i,
      /removed.*parameter/i,
    ];

    const hasBreakingChanges = breakingChangePatterns.some(pattern =>
      pattern.test(openapiContent)
    );

    if (hasBreakingChanges) {
      console.log('Detected potential breaking changes');
      return 'major';
    }

    // 检查是否有新功能
    const newFeaturePatterns = [
      /new.*endpoint/i,
      /added.*path/i,
      /new.*parameter/i,
    ];

    const hasNewFeatures = newFeaturePatterns.some(pattern =>
      pattern.test(openapiContent)
    );

    if (hasNewFeatures) {
      console.log('Detected new features');
      return 'minor';
    }

    console.log('Detected minor changes');
    return 'patch';
  } catch (error) {
    console.warn(
      'Could not analyze OpenAPI content, defaulting to patch:',
      error
    );
    return 'patch';
  }
}

/**
 * 更新package.json版本
 */
function updatePackageVersion(newVersion: string): void {
  try {
    const packageJson = JSON.parse(
      readFileSync(CONFIG.packageJsonPath, 'utf8')
    );
    packageJson.version = newVersion;
    writeFileSync(
      CONFIG.packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    console.log(`Updated package.json version to ${newVersion}`);
  } catch (error) {
    throw new Error(`Failed to update package.json: ${error}`);
  }
}

/**
 * 生成版本信息文件
 */
async function generateVersionFile(
  version: string,
  openapiHash: string
): Promise<void> {
  const gitCommit = getGitCommit();
  const buildTime = new Date().toISOString();

  const versionContent = `// 自动生成的版本信息文件
// 请勿手动修改此文件

export const VERSION_INFO = {
  version: '${version}',
  buildTime: '${buildTime}',
  openapiHash: '${openapiHash}',
  gitCommit: '${gitCommit}'
} as const;

export const getVersionInfo = () => VERSION_INFO;
`;

  fs.writeFileSync(CONFIG.versionFilePath, versionContent);
  console.log(`📝 已生成版本信息文件: ${CONFIG.versionFilePath}`);
}

/**
 * 保存校验和
 */
function saveChecksum(checksumPath: string, hash: string): void {
  fs.writeFileSync(checksumPath, hash);
  console.log(`💾 已保存校验和: ${hash}`);
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    console.log('🔄 Starting SDK version update...');

    // 检查OpenAPI文件是否存在
    try {
      readFileSync(CONFIG.openApiPath);
    } catch (error) {
      throw new Error(`OpenAPI file not found: ${CONFIG.openApiPath}`);
    }

    // 读取当前版本
    const packageJson = JSON.parse(
      readFileSync(CONFIG.packageJsonPath, 'utf8')
    );
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // 检测变更类型
    const changeType = detectChangeType();
    console.log(`Detected change type: ${changeType}`);

    // 计算新版本
    const newVersion = bumpVersion(currentVersion, changeType);
    console.log(`New version: ${newVersion}`);

    // 更新版本
    updatePackageVersion(newVersion);

    // 计算OpenAPI哈希
    const currentHash = calculateFileHash(CONFIG.openApiPath);

    // 生成版本信息文件
    await generateVersionFile(newVersion, currentHash);

    // 保存校验和
    saveChecksum(CONFIG.checksumPath, currentHash);

    console.log('✅ SDK version update completed successfully!');
    console.log(`📦 Version: ${currentVersion} → ${newVersion}`);
  } catch (error) {
    console.error('❌ SDK version update failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { main as updateSDKVersion, detectChangeType, bumpVersion };
