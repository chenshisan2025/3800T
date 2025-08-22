#!/usr/bin/env node

/**
 * Provider切换功能测试脚本
 * 验证通过环境变量可以一键切换到ProviderX
 */

const { spawn } = require('child_process');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试单个端点的provider
async function testEndpointProvider(url, expectedProvider) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const actualProvider = data.metadata?.provider;

    if (actualProvider === expectedProvider) {
      log('green', `✅ ${url} - Provider: ${actualProvider}`);
      return true;
    } else {
      log(
        'red',
        `❌ ${url} - Expected: ${expectedProvider}, Got: ${actualProvider}`
      );
      return false;
    }
  } catch (error) {
    log('red', `❌ ${url} - Error: ${error.message}`);
    return false;
  }
}

// 运行API服务器并测试
function runTestWithProvider(providerType, expectedProvider) {
  return new Promise(resolve => {
    log('blue', `\n🧪 测试 DATA_PROVIDER_TYPE=${providerType}`);
    log('blue', '='.repeat(50));

    // 设置环境变量并启动服务器
    const env = {
      ...process.env,
      DATA_PROVIDER_TYPE: providerType,
      PORT: '3002',
    };
    const server = spawn('pnpm', ['dev'], {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let serverReady = false;
    let testResults = [];

    // 监听服务器输出
    server.stdout.on('data', async data => {
      const output = data.toString();

      // 检查服务器是否启动完成
      if (
        output.includes('Ready') ||
        output.includes('started') ||
        output.includes('listening')
      ) {
        if (!serverReady) {
          serverReady = true;
          log('green', '🚀 服务器启动完成');

          // 等待一秒确保服务器完全就绪
          setTimeout(async () => {
            // 测试所有端点
            const endpoints = [
              'http://localhost:3002/api/market/indices?page=1&limit=2',
              'http://localhost:3002/api/market/quotes?codes=000001&page=1&limit=2',
              'http://localhost:3002/api/market/kline?code=000001&period=1d&limit=10',
              'http://localhost:3002/api/news?page=1&limit=2',
            ];

            for (const endpoint of endpoints) {
              const result = await testEndpointProvider(
                endpoint,
                expectedProvider
              );
              testResults.push(result);
            }

            const passedTests = testResults.filter(r => r).length;
            const totalTests = testResults.length;

            log('blue', '\n📊 测试结果:');
            log(
              passedTests === totalTests ? 'green' : 'red',
              `${passedTests}/${totalTests} 端点使用了正确的Provider`
            );

            // 关闭服务器
            server.kill('SIGTERM');

            resolve({
              providerType,
              expectedProvider,
              passed: passedTests,
              total: totalTests,
              success: passedTests === totalTests,
            });
          }, 2000);
        }
      }
    });

    server.stderr.on('data', data => {
      const error = data.toString();
      if (error.includes('EADDRINUSE')) {
        log('yellow', '⚠️  端口3002被占用，尝试使用其他端口');
      }
    });

    // 超时处理
    setTimeout(() => {
      if (!serverReady) {
        log('red', '❌ 服务器启动超时');
        server.kill('SIGTERM');
        resolve({
          providerType,
          expectedProvider,
          passed: 0,
          total: 4,
          success: false,
          error: '服务器启动超时',
        });
      }
    }, 15000);
  });
}

// 主测试函数
async function runProviderSwitchTest() {
  log('blue', '🔄 Provider切换功能测试');
  log('blue', '='.repeat(60));

  const testCases = [
    { providerType: 'mock', expectedProvider: 'MockProvider' },
    { providerType: 'providerx', expectedProvider: 'ProviderX' },
  ];

  const results = [];

  for (const testCase of testCases) {
    const result = await runTestWithProvider(
      testCase.providerType,
      testCase.expectedProvider
    );
    results.push(result);

    // 等待一秒再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 汇总报告
  log('blue', '\n' + '='.repeat(60));
  log('blue', '📋 Provider切换测试汇总');
  log('blue', '='.repeat(60));

  results.forEach(result => {
    const statusIcon = result.success ? '✅' : '❌';
    const statusColor = result.success ? 'green' : 'red';

    log(
      statusColor,
      `${statusIcon} ${result.providerType.toUpperCase()} -> ${result.expectedProvider}`
    );
    log('blue', `   📊 通过: ${result.passed}/${result.total}`);

    if (result.error) {
      log('red', `   ❌ 错误: ${result.error}`);
    }
  });

  const allPassed = results.every(r => r.success);

  log('blue', '\n' + '-'.repeat(40));
  if (allPassed) {
    log('green', '🎉 所有Provider切换测试通过！');
    log('green', '✅ 可以通过设置 DATA_PROVIDER_TYPE 环境变量一键切换Provider');
  } else {
    log('red', '❌ 部分Provider切换测试失败');
  }

  log('blue', '\n💡 使用方法:');
  log('blue', '   export DATA_PROVIDER_TYPE=mock      # 使用Mock数据');
  log('blue', '   export DATA_PROVIDER_TYPE=providerx # 使用ProviderX数据');

  process.exit(allPassed ? 0 : 1);
}

// 启动测试
if (require.main === module) {
  runProviderSwitchTest().catch(error => {
    log('red', `❌ 测试失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runProviderSwitchTest };
