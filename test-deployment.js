#!/usr/bin/env node

const http = require('http');
const https = require('https');

// 测试配置
const API_BASE = 'http://localhost:3001';
const FRONTEND_BASE = 'http://localhost:3002';

// 简单的HTTP请求函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// 测试用例
const tests = [
  {
    name: '健康检查API',
    url: `${API_BASE}/api/health`,
    expectedStatus: 200
  },
  {
    name: '定价信息API',
    url: `${API_BASE}/api/pricing`,
    expectedStatus: 200
  },
  {
    name: '用户信息API（未认证）',
    url: `${API_BASE}/api/auth/me`,
    expectedStatus: 401
  },
  {
    name: '前端应用',
    url: FRONTEND_BASE,
    expectedStatus: 200
  },
  {
    name: 'AI分析状态API',
    url: `${API_BASE}/api/ai/analyze/status`,
    method: 'POST',
    expectedStatus: [200, 401, 429]
  }
];

// 运行测试
async function runTests() {
  console.log('🚀 开始部署测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`📋 测试: ${test.name}`);
      const result = await makeRequest(test.url, {
        method: test.method || 'GET'
      });
      
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      if (expectedStatuses.includes(result.status)) {
        console.log(`✅ 通过 - 状态码: ${result.status}`);
        passed++;
      } else {
        console.log(`❌ 失败 - 期望状态码: ${test.expectedStatus}, 实际: ${result.status}`);
        failed++;
      }
      
      // 显示响应数据的前100个字符
      if (result.data && result.data.length > 0) {
        const preview = result.data.substring(0, 100).replace(/\n/g, ' ');
        console.log(`📄 响应预览: ${preview}${result.data.length > 100 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`❌ 失败 - 错误: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  // 测试总结
  console.log('📊 测试总结:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！部署成功！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关服务。');
  }
}

// 运行测试
runTests().catch(console.error);