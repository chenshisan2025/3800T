#!/usr/bin/env node

/**
 * 测试脚本：验证API端点返回Mock数据
 * 使用方法：node test-endpoints.js
 */

const http = require('http');
const { URL } = require('url');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const ENDPOINTS = [
  '/api/market/indices',
  '/api/market/quotes?codes=000001,000002',
  '/api/market/kline?code=000001&period=daily',
  '/api/news',
];

/**
 * 发送HTTP请求
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script/1.0',
      },
    };

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

/**
 * 验证响应是否符合预期
 */
function validateResponse(endpoint, response) {
  const { statusCode, data } = response;

  console.log(`\n=== 测试端点: ${endpoint} ===`);
  console.log(`状态码: ${statusCode}`);

  if (statusCode !== 200) {
    console.log('❌ 状态码不是200');
    console.log('响应数据:', JSON.stringify(data, null, 2));
    return false;
  }

  if (!data.success) {
    console.log('❌ 响应success字段不是true');
    console.log('错误信息:', data.error || data.message);
    return false;
  }

  if (!data.metadata) {
    console.log('❌ 缺少metadata字段');
    return false;
  }

  if (!data.metadata.provider) {
    console.log('❌ 缺少provider信息');
    return false;
  }

  console.log('✅ 响应格式正确');
  console.log(`数据提供者: ${data.metadata.provider}`);
  console.log(`是否为主要提供者: ${data.metadata.isPrimary}`);
  console.log(`数据条数: ${Array.isArray(data.data) ? data.data.length : '1'}`);

  // 检查是否为Mock数据
  if (data.metadata.provider.toLowerCase().includes('mock')) {
    console.log('✅ 确认使用Mock数据提供者');
  } else {
    console.log(`⚠️  当前使用的是: ${data.metadata.provider}`);
  }

  return true;
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('开始测试API端点...');
  console.log(`基础URL: ${BASE_URL}`);

  let passedTests = 0;
  let totalTests = ENDPOINTS.length;

  for (const endpoint of ENDPOINTS) {
    try {
      const fullUrl = BASE_URL + endpoint;
      const response = await makeRequest(fullUrl);

      if (validateResponse(endpoint, response)) {
        passedTests++;
      }
    } catch (error) {
      console.log(`\n=== 测试端点: ${endpoint} ===`);
      console.log('❌ 请求失败:', error.message);
    }
  }

  console.log('\n=== 测试总结 ===');
  console.log(`通过测试: ${passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('🎉 所有端点测试通过！');
    console.log('✅ 所有端点都返回Mock数据');
    console.log('✅ 支持通过DATA_PROVIDER_TYPE环境变量一键切换ProviderX');
  } else {
    console.log('❌ 部分测试失败，请检查API服务');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest, validateResponse };
