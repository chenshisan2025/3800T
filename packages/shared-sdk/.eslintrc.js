module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // 覆盖基础的 no-unused-vars 规则
    'no-unused-vars': 'off',
    // 允许接口中定义但未使用的参数（用于类型定义）
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'none',
        ignoreRestSiblings: true,
      },
    ],
  },
  env: {
    node: true,
    es6: true,
  },
};
