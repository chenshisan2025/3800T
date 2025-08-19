# 古灵通 API 服务

古灵通股票投资平台的后端 API 服务，基于 Next.js App Router 构建，提供用户认证、股票数据、投资组合管理等功能。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: Supabase Auth
- **日志**: Winston
- **验证**: Zod
- **部署**: Vercel/Docker

## 项目结构

```
src/
├── app/
│   ├── api/                 # API 路由
│   │   ├── auth/            # 用户认证
│   │   ├── stocks/          # 股票数据
│   │   ├── users/           # 用户功能
│   │   ├── ai/              # AI 报告
│   │   └── health/          # 健康检查
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 主页
├── lib/
│   ├── prisma.ts            # 数据库连接
│   ├── supabase.ts          # Supabase 配置
│   └── logger.ts            # 日志配置
├── types/
│   └── index.ts             # 类型定义
└── utils/
    └── index.ts             # 工具函数
prisma/
├── schema.prisma            # 数据库模型
└── seed.ts                  # 数据种子
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

配置必要的环境变量：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/gulingtong"

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT 密钥
JWT_SECRET="your-jwt-secret-key"
```

### 3. 数据库设置

生成 Prisma 客户端：

```bash
npx prisma generate
```

运行数据库迁移：

```bash
npx prisma db push
```

填充种子数据：

```bash
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将在 http://localhost:3001 启动。

## API 文档

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/magic-link` - 发送魔法链接
- `GET /api/auth/magic-link` - 验证魔法链接
- `GET /api/auth/me` - 获取当前用户信息

### 股票数据

- `GET /api/stocks` - 获取股票列表
- `POST /api/stocks` - 创建股票（管理员）
- `GET /api/stocks/[code]` - 获取股票详情
- `PUT /api/stocks/[code]` - 更新股票（管理员）
- `DELETE /api/stocks/[code]` - 删除股票（管理员）
- `GET /api/stocks/[code]/data` - 获取股票历史数据
- `POST /api/stocks/[code]/data` - 添加股票数据（管理员）

### 用户功能

#### 自选股
- `GET /api/users/watchlist` - 获取自选股列表
- `POST /api/users/watchlist` - 添加自选股
- `GET /api/users/watchlist/[id]` - 获取自选股详情
- `PUT /api/users/watchlist/[id]` - 更新自选股
- `DELETE /api/users/watchlist/[id]` - 删除自选股

#### 投资组合
- `GET /api/users/portfolio` - 获取投资组合列表
- `POST /api/users/portfolio` - 创建投资组合
- `GET /api/users/portfolio/[id]` - 获取投资组合详情
- `PUT /api/users/portfolio/[id]` - 更新投资组合
- `DELETE /api/users/portfolio/[id]` - 删除投资组合
- `GET /api/users/portfolio/[id]/items` - 获取持仓列表
- `POST /api/users/portfolio/[id]/items` - 添加持仓
- `GET /api/users/portfolio/[id]/items/[itemId]` - 获取持仓详情
- `PUT /api/users/portfolio/[id]/items/[itemId]` - 更新持仓
- `DELETE /api/users/portfolio/[id]/items/[itemId]` - 删除持仓

### AI 报告

- `GET /api/ai/reports` - 获取 AI 报告列表
- `POST /api/ai/reports` - 创建 AI 报告（管理员）
- `GET /api/ai/reports/[id]` - 获取 AI 报告详情
- `PUT /api/ai/reports/[id]` - 更新 AI 报告（管理员）
- `DELETE /api/ai/reports/[id]` - 删除 AI 报告（管理员）

### 系统监控

- `GET /api/health` - 健康检查
- `HEAD /api/health` - 健康检查（仅状态码）

## 数据模型

### 用户 (User)
- 基本信息：邮箱、昵称、头像
- 关联：自选股、投资组合
- 认证：通过 Supabase Auth

### 股票 (Stock)
- 基本信息：代码、名称、市场、行业
- 价格数据：当前价格、涨跌幅
- 关联：历史数据、AI 报告

### 股票数据 (StockData)
- 历史价格：开盘、收盘、最高、最低
- 交易量、成交额
- 技术指标

### 自选股 (Watchlist)
- 用户自定义股票列表
- 支持备注和分组

### 投资组合 (Portfolio)
- 用户投资组合管理
- 包含多个持仓项目
- 自动计算收益统计

### 持仓项目 (PortfolioItem)
- 股票持仓详情
- 数量、成本、当前价值
- 收益计算

### AI 报告 (AiReport)
- AI 生成的股票分析报告
- 支持多种报告类型
- 包含评分和建议

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- API 路由使用统一的响应格式
- 错误处理和日志记录

### 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 数据库操作

```bash
# 查看数据库
npx prisma studio

# 重置数据库
npx prisma db reset

# 生成迁移
npx prisma migrate dev --name migration_name
```

### 日志查看

日志文件位于 `logs/` 目录：
- `error.log` - 错误日志
- `combined.log` - 所有日志

## 部署

### Vercel 部署

1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### Docker 部署

```bash
# 构建镜像
docker build -t gulingtong-api .

# 运行容器
docker run -p 3001:3001 gulingtong-api
```

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | ✅ |
| `NODE_ENV` | 运行环境 | ❌ |
| `LOG_LEVEL` | 日志级别 | ❌ |
| `STOCK_API_KEY` | 股票数据 API 密钥 | ❌ |
| `OPENAI_API_KEY` | OpenAI API 密钥 | ❌ |

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认数据库服务运行状态

2. **Supabase 认证失败**
   - 验证 Supabase 项目配置
   - 检查 API 密钥是否正确

3. **API 请求失败**
   - 查看服务器日志
   - 检查请求格式和参数

### 性能优化

- 使用数据库索引
- 实现 API 响应缓存
- 优化查询语句
- 启用 gzip 压缩

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License