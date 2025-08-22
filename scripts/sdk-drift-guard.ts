#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { glob } from 'glob';

// 配置
const CONFIG = {
  sharedSdkDir: path.join(process.cwd(), 'packages/shared-sdk'),
  tempDir: path.join(process.cwd(), '.temp-sdk-check'),
  openApiPath: path.join(process.cwd(), 'packages/shared-sdk/openapi.yaml'),
  generatedDir: path.join(process.cwd(), 'packages/shared-sdk/src/generated'),
  checksumFile: path.join(process.cwd(), 'packages/shared-sdk/.sdk-checksum'),
  driftReportFile: path.join(process.cwd(), '.sdk-drift-report.json'),
};

// 漂移检测结果接口
interface DriftResult {
  hasDrift: boolean;
  summary: {
    totalFiles: number;
    changedFiles: number;
    addedFiles: number;
    removedFiles: number;
  };
  changes: {
    file: string;
    type: 'added' | 'removed' | 'modified';
    details?: string;
  }[];
  openApiHash: string;
  previousHash?: string;
  timestamp: string;
}

// 计算文件哈希
function calculateFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 计算目录哈希
function calculateDirectoryHash(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    return '';
  }

  const files = glob
    .sync('**/*', {
      cwd: dirPath,
      nodir: true,
      dot: false,
    })
    .sort();

  const hashes = files.map(file => {
    const filePath = path.join(dirPath, file);
    const hash = calculateFileHash(filePath);
    return `${file}:${hash}`;
  });

  return crypto.createHash('sha256').update(hashes.join('\n')).digest('hex');
}

// 获取当前SDK校验和
function getCurrentChecksum(): { openApiHash: string; sdkHash: string } {
  const openApiHash = calculateFileHash(CONFIG.openApiPath);
  const sdkHash = calculateDirectoryHash(CONFIG.generatedDir);

  return { openApiHash, sdkHash };
}

// 读取保存的校验和
function getSavedChecksum(): { openApiHash: string; sdkHash: string } | null {
  if (!fs.existsSync(CONFIG.checksumFile)) {
    return null;
  }

  try {
    const content = fs.readFileSync(CONFIG.checksumFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('警告: 无法读取校验和文件:', error);
    return null;
  }
}

// 保存校验和
function saveChecksum(checksum: { openApiHash: string; sdkHash: string }) {
  fs.writeFileSync(CONFIG.checksumFile, JSON.stringify(checksum, null, 2));
}

// 生成临时SDK用于比较
function generateTempSDK(): string {
  console.log('🔨 生成临时SDK用于比较...');

  // 清理临时目录
  if (fs.existsSync(CONFIG.tempDir)) {
    fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(CONFIG.tempDir, { recursive: true });

  const tempOutputDir = path.join(CONFIG.tempDir, 'generated');

  // 生成TypeScript SDK到临时目录
  const command = [
    'openapi-generator-cli generate',
    `-i ${CONFIG.openApiPath}`,
    '-g typescript-fetch',
    `-o ${tempOutputDir}`,
    '--additional-properties typescriptThreePlus=true,supportsES6=true',
    '--skip-validate-spec',
    '--remove-operation-id-prefix',
  ].join(' ');

  try {
    execSync(command, { stdio: 'pipe' });
    return tempOutputDir;
  } catch (error) {
    console.error('❌ 临时SDK生成失败:', error);
    throw error;
  }
}

// 比较两个目录的差异
function compareDirectories(
  oldDir: string,
  newDir: string
): DriftResult['changes'] {
  const changes: DriftResult['changes'] = [];

  if (!fs.existsSync(oldDir)) {
    // 如果旧目录不存在，所有新文件都是添加的
    const newFiles = glob.sync('**/*', { cwd: newDir, nodir: true });
    return newFiles.map(file => ({
      file,
      type: 'added' as const,
      details: '新生成的文件',
    }));
  }

  const oldFiles = new Set(glob.sync('**/*', { cwd: oldDir, nodir: true }));
  const newFiles = new Set(glob.sync('**/*', { cwd: newDir, nodir: true }));

  // 检查删除的文件
  for (const file of oldFiles) {
    if (!newFiles.has(file)) {
      changes.push({
        file,
        type: 'removed',
        details: '文件已被删除',
      });
    }
  }

  // 检查新增和修改的文件
  for (const file of newFiles) {
    const oldFilePath = path.join(oldDir, file);
    const newFilePath = path.join(newDir, file);

    if (!oldFiles.has(file)) {
      changes.push({
        file,
        type: 'added',
        details: '新增的文件',
      });
    } else {
      const oldHash = calculateFileHash(oldFilePath);
      const newHash = calculateFileHash(newFilePath);

      if (oldHash !== newHash) {
        changes.push({
          file,
          type: 'modified',
          details: '文件内容已修改',
        });
      }
    }
  }

  return changes;
}

// 检测SDK漂移
function detectSDKDrift(): DriftResult {
  console.log('🔍 检测SDK漂移...');

  const currentChecksum = getCurrentChecksum();
  const savedChecksum = getSavedChecksum();

  // 生成临时SDK
  const tempSDKDir = generateTempSDK();

  // 比较差异
  const changes = compareDirectories(CONFIG.generatedDir, tempSDKDir);

  const result: DriftResult = {
    hasDrift: changes.length > 0,
    summary: {
      totalFiles: glob.sync('**/*', { cwd: tempSDKDir, nodir: true }).length,
      changedFiles: changes.filter(c => c.type === 'modified').length,
      addedFiles: changes.filter(c => c.type === 'added').length,
      removedFiles: changes.filter(c => c.type === 'removed').length,
    },
    changes,
    openApiHash: currentChecksum.openApiHash,
    previousHash: savedChecksum?.openApiHash,
    timestamp: new Date().toISOString(),
  };

  // 清理临时目录
  if (fs.existsSync(CONFIG.tempDir)) {
    fs.rmSync(CONFIG.tempDir, { recursive: true, force: true });
  }

  return result;
}

// 生成漂移报告
function generateDriftReport(result: DriftResult) {
  console.log('📊 生成漂移报告...');

  // 保存详细报告
  fs.writeFileSync(CONFIG.driftReportFile, JSON.stringify(result, null, 2));

  // 控制台输出摘要
  console.log('\n📋 SDK 漂移检测结果:');
  console.log(
    `   漂移状态: ${result.hasDrift ? '❌ 检测到漂移' : '✅ 无漂移'}`
  );
  console.log(`   总文件数: ${result.summary.totalFiles}`);
  console.log(`   修改文件: ${result.summary.changedFiles}`);
  console.log(`   新增文件: ${result.summary.addedFiles}`);
  console.log(`   删除文件: ${result.summary.removedFiles}`);

  if (result.hasDrift) {
    console.log('\n🔍 详细变更:');
    result.changes.forEach(change => {
      const icon = {
        added: '➕',
        removed: '➖',
        modified: '📝',
      }[change.type];
      console.log(`   ${icon} ${change.file} (${change.details})`);
    });

    console.log(`\n📄 详细报告已保存到: ${CONFIG.driftReportFile}`);
  }
}

// 更新SDK
function updateSDK() {
  console.log('🔄 更新SDK...');

  try {
    // 重新生成SDK
    execSync('npm run generate:client', {
      cwd: CONFIG.sharedSdkDir,
      stdio: 'inherit',
    });

    // 更新校验和
    const newChecksum = getCurrentChecksum();
    saveChecksum(newChecksum);

    console.log('✅ SDK已更新');
  } catch (error) {
    console.error('❌ SDK更新失败:', error);
    throw error;
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const isCI = process.env.CI === 'true';
  const shouldFix = args.includes('--fix');
  const shouldForce = args.includes('--force');

  console.log('🚀 开始SDK漂移检测...');

  try {
    // 检查OpenAPI文件是否存在
    if (!fs.existsSync(CONFIG.openApiPath)) {
      console.error(`❌ OpenAPI文件不存在: ${CONFIG.openApiPath}`);
      console.log('请先运行: npm run openapi:generate');
      process.exit(1);
    }

    // 检测漂移
    const result = detectSDKDrift();

    // 生成报告
    generateDriftReport(result);

    if (result.hasDrift) {
      if (shouldFix) {
        console.log('🔧 自动修复模式，正在更新SDK...');
        updateSDK();
        console.log('✅ SDK已自动更新');
      } else if (isCI && !shouldForce) {
        console.error('\n💥 CI环境检测到SDK漂移，构建失败！');
        console.log('\n🔧 修复方法:');
        console.log('1. 本地运行: npm run sdk:update');
        console.log('2. 提交更新后的SDK文件');
        console.log('3. 或者运行: npm run sdk:drift-guard -- --fix');
        process.exit(1);
      } else {
        console.log('\n⚠️  检测到SDK漂移，但未启用自动修复');
        console.log('运行 npm run sdk:drift-guard -- --fix 来自动修复');
        if (!shouldForce) {
          process.exit(1);
        }
      }
    } else {
      console.log('\n🎉 SDK无漂移，检查通过！');

      // 更新校验和
      const currentChecksum = getCurrentChecksum();
      saveChecksum(currentChecksum);
    }
  } catch (error) {
    console.error('💥 SDK漂移检测失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

export { detectSDKDrift, main as sdkDriftGuard };
