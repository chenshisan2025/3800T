# 古灵通管理后台

基于 Next.js 14 + TypeScript + Ant Design 构建的现代化管理后台系统。

## 🚀 功能特性

### 核心功能
- **用户管理** - 用户注册、登录、权限管理
- **股票管理** - 股票数据管理、实时行情监控
- **AI 报告** - AI 生成的分析报告管理
- **数据分析** - 用户行为分析、市场数据统计
- **系统设置** - 系统配置、参数管理

### 技术特性
- **现代化 UI** - 基于 Ant Design 5.x 设计系统
- **响应式设计** - 支持桌面端和移动端
- **TypeScript** - 完整的类型安全
- **实时数据** - WebSocket 实时数据更新
- **国际化** - 支持中英文切换
- **主题定制** - 古灵通品牌主题

## 📦 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.x
- **UI 库**: Ant Design 5.x
- **样式**: Tailwind CSS 3.x
- **状态管理**: React Context + Hooks
- **HTTP 客户端**: 基于 @gulingtong/shared-sdk
- **图表**: Recharts
- **图标**: Ant Design Icons
- **日期处理**: Day.js
- **代码规范**: ESLint + Prettier

## 🛠️ 开发环境

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
# 在项目根目录
pnpm install

# 或者在当前目录
pnpm install
```

### 环境配置
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

### 启动开发服务器
```bash
# 开发模式
pnpm dev

# 指定端口
pnpm dev -- --port 3002
```

访问 http://localhost:3000 查看应用。

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── dashboard/         # 仪表板相关页面
│   ├── login/            # 登录页面
│   ├── globals.css       # 全局样式
│   ├── layout.tsx        # 根布局
│   └── page.tsx          # 首页
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   ├── charts/           # 图表组件
│   ├── forms/            # 表单组件
│   └── layout/           # 布局组件
├── providers/            # React Context 提供者
│   ├── ApiProvider.tsx   # API 客户端提供者
│   └── AuthProvider.tsx  # 认证状态提供者
├── hooks/                # 自定义 Hooks
│   ├── useAuth.ts        # 认证相关
│   ├── useApi.ts         # API 调用
│   └── useLocalStorage.ts # 本地存储
├── utils/                # 工具函数
│   ├── format.ts         # 格式化函数
│   ├── validation.ts     # 验证函数
│   └── constants.ts      # 常量定义
├── types/                # TypeScript 类型定义
│   ├── auth.ts           # 认证相关类型
│   ├── api.ts            # API 相关类型
│   └── common.ts         # 通用类型
└── config/               # 配置文件
    ├── theme.ts          # Ant Design 主题配置
    └── constants.ts      # 应用常量
```

## 🎨 设计系统

### 主题色彩
- **主色调**: #2166A5 (古灵通蓝)
- **成功色**: #52c41a (股票下跌 - 绿色)
- **错误色**: #ff4d4f (股票上涨 - 红色)
- **警告色**: #faad14
- **信息色**: #1677ff

### 股票涨跌色彩规范
- **上涨**: 红色 (#ff4d4f)
- **下跌**: 绿色 (#52c41a)
- **平盘**: 灰色 (#8c8c8c)

### 响应式断点
- **XS**: < 576px
- **SM**: ≥ 576px
- **MD**: ≥ 768px
- **LG**: ≥ 992px
- **XL**: ≥ 1200px
- **XXL**: ≥ 1600px

## 🔐 认证系统

### 认证流程
1. 用户登录获取 JWT Token
2. Token 存储在 localStorage
3. API 请求自动携带 Token
4. Token 过期自动跳转登录页

### 权限控制
- 路由级权限控制
- 组件级权限控制
- API 级权限验证

## 📊 数据管理

### API 集成
- 基于 @gulingtong/shared-sdk
- 统一的错误处理
- 请求/响应拦截器
- 自动重试机制

### 状态管理
- React Context 全局状态
- 本地状态 useState/useReducer
- 缓存策略 (localStorage/sessionStorage)

## 🧪 测试

### 运行测试
```bash
# 单元测试
pnpm test

# 测试覆盖率
pnpm test:coverage

# E2E 测试
pnpm test:e2e
```

### 测试策略
- 组件单元测试
- API 集成测试
- 用户交互测试
- 性能测试

## 📈 性能优化

### 已实现优化
- **代码分割** - 动态导入和懒加载
- **图片优化** - Next.js Image 组件
- **缓存策略** - API 响应缓存
- **Bundle 分析** - webpack-bundle-analyzer

### 性能监控
- Web Vitals 监控
- 错误边界处理
- 性能指标收集

## 🚀 部署

### 构建应用
```bash
# 生产构建
pnpm build

# 启动生产服务器
pnpm start

# 分析 Bundle 大小
pnpm analyze
```

### 部署选项

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### Docker 部署
```bash
# 构建镜像
docker build -t gulingtong-admin .

# 运行容器
docker run -p 3000:3000 gulingtong-admin
```

#### 静态部署
```bash
# 静态导出
pnpm build && pnpm export

# 部署到 CDN
# 将 out/ 目录上传到 CDN
```

## 🔧 开发工具

### 代码质量
```bash
# ESLint 检查
pnpm lint

# 自动修复
pnpm lint:fix

# TypeScript 类型检查
pnpm type-check

# 格式化代码
pnpm format
```

### 开发辅助
- **热重载** - 开发时自动刷新
- **错误提示** - 详细的错误信息
- **类型提示** - 完整的 TypeScript 支持
- **调试工具** - React DevTools 支持

## 📚 开发指南

### 组件开发
```tsx
// 组件模板
import React from 'react';
import { Card, Typography } from 'antd';

interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <Card title={title}>
      {children}
    </Card>
  );
}
```

### API 调用
```tsx
// 使用 API Services
import { useApiServices } from '@/providers/ApiProvider';

function MyComponent() {
  const services = useApiServices();
  
  const fetchData = async () => {
    try {
      const response = await services.stock.getStockList();
      // 处理响应
    } catch (error) {
      // 错误处理
    }
  };
}
```

### 样式规范
```tsx
// 使用 Tailwind CSS 类名
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-800">标题</h2>
  <Button type="primary">操作</Button>
</div>
```

## 🐛 故障排除

### 常见问题

**Q: 启动时出现端口占用错误**
```bash
# 查找占用端口的进程
lsof -ti:3000

# 杀死进程
kill -9 <PID>

# 或使用不同端口
pnpm dev -- --port 3001
```

**Q: API 请求失败**
- 检查 API 服务是否启动
- 验证环境变量配置
- 查看网络请求日志

**Q: 样式不生效**
- 检查 Tailwind CSS 配置
- 确认类名拼写正确
- 查看 CSS 优先级

### 调试技巧
- 使用 React DevTools
- 查看浏览器控制台
- 使用 Network 面板检查请求
- 启用详细日志输出

## 📄 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📞 支持

- 📧 邮箱: support@gulingtong.com
- 📱 微信: gulingtong-support
- 🌐 官网: https://gulingtong.com
- 📖 文档: https://docs.gulingtong.com

---

**古灵通团队** ❤️ 用心打造