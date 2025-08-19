#!/usr/bin/env node

/**
 * API端点健康检查测试脚本
 * 验证 /api/market/indices, /api/market/quotes, /api/market/kline, /api/news 端点
 */

const BASE_URL = 'http://localhost:3001';

// 测试配置
const TEST_ENDPOINTS = [
  {
    name: 'Market Indices',
    url: '/api/market/indices',
    params: { page: 1, limit: 10 }
  },
  {
    name: 'Market Quotes',
    url: '/api/market/quotes',
    params: { codes: '000001,000002', page: 1, limit: 10 }
  },
  {
    name: 'Market Kline',
    url: '/api/market/kline',
    params: { code: '000001', period: '1d', limit: 100 }
  },
  {
    name: 'News',
    url: '/api/news',
    params: { page: 1, limit: 10, category: 'market' }
  }
];

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 构建URL参数
function buildUrl(endpoint, params) {
  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

// 测试单个端点
async function testEndpoint(config) {
  const { name, url, params } = config;
  const fullUrl = buildUrl(url, params);
  
  log('blue', `\n🧪 测试 ${name}`);
  log('blue', `📍 URL: ${fullUrl}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(fullUrl);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 验证响应结构
    const validations = [
      { check: data.success === true, message: '✅ 响应成功状态' },
      { check: Array.isArray(data.data) || typeof data.data === 'object', message: '✅ 包含数据字段' },
      { check: data.metadata && typeof data.metadata === 'object', message: '✅ 包含元数据' },
      { check: data.metadata.provider && typeof data.metadata.provider === 'string', message: '✅ 包含provider信息' },
      { check: typeof data.metadata.isPrimary === 'boolean', message: '✅ 包含isPrimary标志' },
      { check: data.metadata.timestamp, message: '✅ 包含时间戳' }
    ];
    
    let passedChecks = 0;
    validations.forEach(({ check, message }) => {
      if (check) {
        log('green', `  ${message}`);
        passedChecks++;
      } else {
        log('red', `  ❌ ${message.replace('✅', '❌')}`);
      }
    });
    
    // 显示provider信息
    if (data.metadata) {
      log('yellow', `  📊 Provider: ${data.metadata.provider}`);
      log('yellow', `  🎯 Is Primary: ${data.metadata.isPrimary}`);
      log('yellow', `  ⏱️  Response Time: ${responseTime}ms`);
      
      if (data.metadata.delay) {
        log('yellow', `  🕐 Simulated Delay: ${data.metadata.delay}ms`);
      }
    }
    
    // 显示数据样本
    if (data.data) {
      const dataCount = Array.isArray(data.data) ? data.data.length : Object.keys(data.data).length;
      log('yellow', `  📈 Data Count: ${dataCount}`);
      
      if (Array.isArray(data.data) && data.data.length > 0) {
        log('yellow', `  📋 Sample Data Keys: ${Object.keys(data.data[0]).join(', ')}`);
      }
    }
    
    const status = passedChecks === validations.length ? 'PASS' : 'PARTIAL';
    log(status === 'PASS' ? 'green' : 'yellow', `  🎯 Status: ${status} (${passedChecks}/${validations.length})`);
    
    return { name, status, passedChecks, totalChecks: validations.length, responseTime, provider: data.metadata?.provider };
    
  } catch (error) {
    log('red', `  ❌ Error: ${error.message}`);
    return { name, status: 'FAIL', error: error.message };
  }
}

// 主测试函数
async function runTests() {
  log('blue', '🚀 开始API端点健康检查测试\n');
  log('blue', '=' .repeat(60));
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟
  }
  
  // 汇总报告
  log('blue', '\n' + '=' .repeat(60));
  log('blue', '📊 测试汇总报告');
  log('blue', '=' .repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(result => {
    const statusColor = result.status === 'PASS' ? 'green' : result.status === 'PARTIAL' ? 'yellow' : 'red';
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
    
    log(statusColor, `${statusIcon} ${result.name}: ${result.status}`);
    
    if (result.passedChecks !== undefined) {
      log('blue', `   📊 检查通过: ${result.passedChecks}/${result.totalChecks}`);
    }
    
    if (result.responseTime) {
      log('blue', `   ⏱️  响应时间: ${result.responseTime}ms`);
    }
    
    if (result.provider) {
      log('blue', `   🔧 Provider: ${result.provider}`);
    }
    
    if (result.error) {
      log('red', `   ❌ 错误: ${result.error}`);
    }
  });
  
  log('blue', '\n' + '-' .repeat(40));
  log('green', `✅ 通过: ${passed}`);
  log('yellow', `⚠️  部分通过: ${partial}`);
  log('red', `❌ 失败: ${failed}`);
  log('blue', `📊 总计: ${results.length}`);
  
  // 检查Mock数据和Provider切换
  const mockProviders = results.filter(r => r.provider && r.provider.toLowerCase().includes('mock')).length;
  if (mockProviders === results.filter(r => r.provider).length) {
    log('green', '\n✅ 所有端点都在使用Mock数据提供者');
  } else {
    log('yellow', '\n⚠️  部分端点未使用Mock数据提供者');
  }
  
  log('blue', '\n🔧 要切换到ProviderX，请设置环境变量:');
  log('blue', '   export DATA_PROVIDER_TYPE=providerx');
  log('blue', '   或在.env文件中设置: DATA_PROVIDER_TYPE=providerx');
  
  const overallStatus = failed === 0 ? (partial === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS') : 'FAILURE';
  process.exit(overallStatus === 'SUCCESS' ? 0 : 1);
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`, { method: 'HEAD' });
    return true;
  } catch (error) {
    log('red', `❌ 无法连接到服务器 ${BASE_URL}`);
    log('yellow', '请确保API服务器正在运行:');
    log('yellow', '  cd services/api && pnpm dev');
    return false;
  }
}

// 启动测试
if (require.main === module) {
  (async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
      await runTests();
    } else {
      process.exit(1);
    }
  })();
}

module.exports = { testEndpoint, runTests };