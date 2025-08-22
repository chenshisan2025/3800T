const { createClient } = require('redis');

async function testRedisConnection() {
  console.log('Testing Redis connection...');

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 60000,
      lazyConnect: true,
    },
  });

  try {
    // 连接到Redis
    await client.connect();
    console.log('✅ Redis连接成功');

    // 测试基本操作
    await client.set('test:connection', 'success');
    const value = await client.get('test:connection');
    console.log('✅ Redis读写测试成功:', value);

    // 测试过期时间
    await client.setEx('test:ttl', 10, 'expires in 10 seconds');
    const ttl = await client.ttl('test:ttl');
    console.log('✅ Redis TTL测试成功, 剩余时间:', ttl, '秒');

    // 测试哈希操作
    await client.hSet('test:hash', 'field1', 'value1');
    await client.hSet('test:hash', 'field2', 'value2');
    const hashValue = await client.hGetAll('test:hash');
    console.log('✅ Redis哈希操作测试成功:', hashValue);

    // 测试有序集合操作
    await client.zAdd('test:zset', { score: 1, value: 'item1' });
    await client.zAdd('test:zset', { score: 2, value: 'item2' });
    const zsetValues = await client.zRange('test:zset', 0, -1, { REV: true });
    console.log('✅ Redis有序集合测试成功:', zsetValues);

    // 清理测试数据
    await client.del('test:connection', 'test:ttl', 'test:hash', 'test:zset');
    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.error('❌ Redis连接测试失败:', error.message);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('Redis连接已关闭');
  }
}

testRedisConnection();
