const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 使用与.env文件中相同的JWT_SECRET
const JWT_SECRET = 'test-jwt-secret-key-for-development';

// 创建测试用户数据
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
};

// 生成NextAuth风格的JWT token
const token = jwt.sign(
  {
    ...testUser,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
    jti: crypto.randomUUID(),
  },
  JWT_SECRET
);

console.log('Generated JWT Token:');
console.log(token);
console.log('\nTest command:');
console.log(
  `curl -X POST http://localhost:3003/api/alerts/scan -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`
);
