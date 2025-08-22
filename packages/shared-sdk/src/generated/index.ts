// 古灵通股票投资平台 TypeScript SDK
// 自动生成，请勿手动修改

export * from './src/apis';
export * from './src/models';
export * from './src/runtime';

// 默认配置
export const DEFAULT_CONFIG = {
  basePath:
    (process.env.NODE_ENV as string) === 'production'
      ? 'https://api.gulingtong.com'
      : 'http://localhost:3001',
  credentials: 'include' as 'include' | 'omit' | 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
};

// SDK 版本
export const SDK_VERSION = '1.0.0';
