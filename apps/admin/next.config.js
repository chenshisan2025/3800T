/** @type {import('next').NextConfig} */
const nextConfig = {
  // 实验性功能
  experimental: {
    // 启用 App Router
    appDir: true,
  },
  
  // 编译配置
  compiler: {
    // 移除 console.log（仅在生产环境）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // 图片优化配置
  images: {
    domains: [
      'localhost',
      'api.gulingtong.com',
      'cdn.gulingtong.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
  
  // 重写配置（用于 API 代理）
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  
  // 输出配置
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 电源配置
  poweredByHeader: false,
  
  // 严格模式
  reactStrictMode: true,
  
  // SWC 配置
  swcMinify: true,
  
  // 构建时的静态优化
  trailingSlash: false,
  
  // Webpack 配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 添加自定义 webpack 配置
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // 页面扩展名
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // 国际化配置（如果需要）
  // i18n: {
  //   locales: ['zh-CN', 'en-US'],
  //   defaultLocale: 'zh-CN',
  // },
};

module.exports = nextConfig;