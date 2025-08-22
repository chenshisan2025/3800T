# 代码规范和质量控制系统

本文档描述了项目的代码规范和质量控制系统的配置和使用方法。

## 概述

我们的代码质量控制系统包含以下组件：

- **ESLint**: 代码静态分析和规范检查
- **Prettier**: 代码格式化
- **Husky**: Git 钩子管理
- **lint-staged**: 暂存文件处理
- **commitlint**: 提交消息规范检查
- **CODEOWNERS**: 代码审查负责人管理

## 工具配置

### ESLint 配置

项目使用统一的 ESLint 配置，主要规则包括：

- 基于 `@next/eslint-config-next` 和 `@typescript-eslint/recommended`
- 强制使用 `const` 而非 `let`（当变量不会重新赋值时）
- 禁止使用 `var`
- 忽略 `prisma/generated/` 目录

### Prettier 配置

代码格式化规则：

- 使用单引号
- 行尾添加分号
- 打印宽度：80 字符
- 缩进：2 个空格
- 尾随逗号：ES5 兼容模式

### commitlint 配置

提交消息必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

支持的类型：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构代码
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD 相关
- `build`: 构建系统相关
- `revert`: 回滚提交

## Git 钩子

### pre-commit 钩子

在每次提交前自动执行：

1. **Prettier 格式化**: 自动格式化暂存的 JS/TS/JSON/MD/YAML 文件
2. **ESLint 检查**: 对暂存的 JS/TS 文件执行 lint 检查并自动修复

### pre-push 钩子

在推送代码前执行：

- **测试运行**: 执行 `pnpm test` 确保所有测试通过

### commit-msg 钩子

在提交消息创建后执行：

- **提交消息检查**: 使用 commitlint 验证提交消息格式

## 使用方法

### 日常开发

1. **代码编写**: 按照项目规范编写代码
2. **提交代码**: 
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```
   - pre-commit 钩子会自动格式化和检查代码
   - commit-msg 钩子会验证提交消息格式

3. **推送代码**:
   ```bash
   git push
   ```
   - pre-push 钩子会运行测试

### 手动执行命令

```bash
# 代码格式化
pnpm format

# 代码检查
pnpm lint

# 代码检查并自动修复
pnpm lint:fix

# 类型检查
pnpm type-check

# 运行测试
pnpm test
```

### 跳过钩子（紧急情况）

```bash
# 跳过 pre-commit 钩子
git commit --no-verify -m "emergency fix"

# 跳过 pre-push 钩子
git push --no-verify
```

**注意**: 仅在紧急情况下使用，正常情况下应该遵循所有质量检查。

## CODEOWNERS

项目使用 CODEOWNERS 文件管理代码审查：

- **全局默认**: `@gulingtong-team`
- **技术负责人**: 根目录配置文件
- **DevOps 团队**: 构建和部署配置
- **前端团队**: `apps/admin/` 目录
- **移动端团队**: `apps/mobile/` 和 `apps/miniapp/` 目录
- **数据库团队**: `prisma/` 目录
- **安全团队**: 安全相关文件
- **文档团队**: 文档文件

## 故障排除

### 常见问题

1. **ESLint 错误**: 
   - 检查 `.eslintrc.json` 配置文件
   - 运行 `pnpm lint:fix` 自动修复

2. **Prettier 格式化问题**:
   - 检查 `.prettierrc` 配置
   - 运行 `pnpm format` 手动格式化

3. **提交消息被拒绝**:
   - 确保遵循 Conventional Commits 规范
   - 检查 `commitlint.config.js` 配置

4. **钩子不执行**:
   - 确保 `.husky/` 目录下的文件有执行权限
   - 运行 `pnpm prepare` 重新初始化 husky

### 重新安装

如果遇到配置问题，可以重新安装依赖：

```bash
# 重新安装依赖
pnpm install

# 重新初始化 husky
pnpm prepare
```

## 最佳实践

1. **提交频率**: 小而频繁的提交，每个提交只包含一个逻辑变更
2. **提交消息**: 清晰描述变更内容和原因
3. **代码审查**: 所有 PR 都需要相应 CODEOWNERS 的审查
4. **测试覆盖**: 新功能和修复都应该包含相应测试
5. **文档更新**: 重要变更需要更新相关文档

## 配置文件位置

- ESLint: `.eslintrc.json` (各包目录)
- Prettier: `.prettierrc` (项目根目录)
- Husky: `.husky/` (项目根目录)
- commitlint: `commitlint.config.js` (项目根目录)
- CODEOWNERS: `.github/CODEOWNERS` (项目根目录)
- lint-staged: `package.json` 中的 `lint-staged` 字段

---

如有问题或建议，请联系技术团队。