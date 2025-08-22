# 古灵通 (GuLingTong)

古灵通是一个现代化的股票信息服务平台，为用户提供实时股票数据、个性化自选股管理、智能分析和投资决策支持。

## 🚀 项目特色

- **多端支持**: Web管理后台、移动端App、微信小程序三端覆盖
- **实时数据**: 提供实时股票行情、K线图表、技术指标分析
- **智能推荐**: 基于用户行为的个性化股票推荐
- **社交功能**: 用户互动、观点分享、专家解读
- **专业工具**: 技术分析工具、财务数据分析、风险评估

## 🏗️ 技术架构

### 前端技术栈

- **Web管理后台**: Next.js 14 + TypeScript + Ant Design + Tailwind CSS
- **移动端App**: Flutter + Riverpod + Dio + Hive + go_router
- **微信小程序**: 原生小程序 + 自定义组件库

### 后端技术栈

- **API服务**: Next.js Route Handlers + TypeScript
- **数据库**: Supabase (PostgreSQL) + Prisma ORM
- **认证**: Supabase Auth
- **实时通信**: Supabase Realtime

### 开发工具

- **包管理**: pnpm workspace (monorepo)
- **代码规范**: ESLint + Prettier
- **类型检查**: TypeScript
- **API契约**: OpenAPI 3.0 + 自动生成客户端

## 📁 项目结构

```
gulingtong/
├── apps/                          # 应用程序
│   ├── admin/                     # Web管理后台 (Next.js)
│   │   ├── src/
│   │   │   ├── app/              # App Router页面
│   │   │   ├── components/       # React组件
│   │   │   ├── hooks/            # 自定义Hooks
│   │   │   ├── lib/              # 工具库
│   │   │   ├── styles/           # 样式文件
│   │   │   └── types/            # 类型定义
│   │   ├── public/               # 静态资源
│   │   └── package.json
│   ├── mobile/                    # 移动端App (Flutter)
│   │   ├── lib/
│   │   │   ├── core/             # 核心功能
│   │   │   ├── features/         # 功能模块
│   │   │   ├── shared/           # 共享组件
│   │   │   └── main.dart
│   │   ├── assets/               # 资源文件
│   │   └── pubspec.yaml
│   └── miniapp/                   # 微信小程序
│       ├── pages/                # 页面
│       ├── components/           # 组件
│       ├── utils/                # 工具函数
│       ├── app.js                # 应用入口
│       └── app.json              # 应用配置
├── services/                      # 后端服务
│   └── api/                      # API服务 (Next.js)
│       ├── src/
│       │   ├── app/api/          # API路由
│       │   ├── lib/              # 工具库
│       │   └── types/            # 类型定义
│       ├── prisma/               # 数据库模式
│       └── package.json
├── packages/                      # 共享包
│   └── shared-sdk/               # 共享SDK
│       ├── src/
│       │   ├── types/            # 类型定义
│       │   ├── api/              # API客户端
│       │   └── utils/            # 工具函数
│       └── package.json
├── supabase/                      # Supabase配置
│   └── migrations/               # 数据库迁移
├── theme.config.js               # 全局主题配置
├── package.json                  # 根package.json
├── pnpm-workspace.yaml          # pnpm工作空间配置
└── README.md                     # 项目文档
```

## 🎨 设计系统

### 主题色彩

- **主色调**: #2166A5 (品牌蓝)
- **辅助色**: #4A90E2 (浅蓝), #1A5490 (深蓝)
- **功能色**:
  - 成功: #00C851 (绿色)
  - 警告: #FFB300 (橙色)
  - 错误: #FF4444 (红色)
  - 信息: #2166A5 (蓝色)

### A股市场色彩规范

- **上涨**: #FF4444 (红色)
- **下跌**: #00C851 (绿色)
- **平盘**: #666666 (灰色)

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Flutter >= 3.0.0 (移动端开发)
- 微信开发者工具 (小程序开发)

### 安装依赖

```bash
# 安装所有依赖
pnpm install
```

### 环境配置

1. 复制环境变量模板

```bash
cp .env.example .env.local
```

2. 配置Supabase

- 在 `.env.local` 中填入Supabase项目URL和密钥
- 运行数据库迁移: `pnpm db:migrate`

### 启动开发服务

#### 启动所有服务

```bash
pnpm dev
```

#### 单独启动服务

```bash
# API服务 (http://localhost:3001)
pnpm dev:api

# Web管理后台 (http://localhost:3000)
pnpm dev:admin

# 移动端App
pnpm dev:mobile

# 微信小程序 (需要微信开发者工具)
pnpm dev:miniapp
```

## 📱 应用功能

### Web管理后台

- 用户管理和权限控制
- 股票数据管理和配置
- 内容管理和审核
- 系统监控和分析
- 运营数据统计

### 移动端App

- 实时股票行情查看
- 自选股管理和提醒
- K线图表和技术分析
- 资讯阅读和分享
- 用户社区互动

### 微信小程序

- 轻量级股票查询
- 自选股快速查看
- 简化版图表展示
- 微信分享功能
- 消息推送提醒

## 🔧 开发指南

### 代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint和Prettier配置
- 组件命名使用PascalCase
- 文件命名使用kebab-case
- 提交信息遵循Conventional Commits

### API开发

- 使用OpenAPI 3.0规范定义接口
- 自动生成类型定义和客户端代码
- 统一错误处理和响应格式
- 实现请求验证和权限控制

### 数据库

- 使用Prisma ORM管理数据模型
- 通过迁移文件管理数据库变更
- 遵循数据库命名规范
- 实现行级安全策略(RLS)

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 运行特定应用测试
pnpm test:admin
pnpm test:api
pnpm test:mobile

# 运行测试覆盖率
pnpm test:coverage
```

## 📦 构建部署

```bash
# 构建所有应用
pnpm build

# 构建特定应用
pnpm build:admin
pnpm build:api
pnpm build:mobile
pnpm build:miniapp

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目主页: [https://github.com/your-org/gulingtong](https://github.com/your-org/gulingtong)
- 问题反馈: [Issues](https://github.com/your-org/gulingtong/issues)
- 邮箱: contact@gulingtong.com

---

**古灵通** - 让投资更智能，让决策更精准 🚀
