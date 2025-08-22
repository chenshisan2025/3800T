# PR-05: CI 与 SDK 漂移守护

## 概述

本PR实现了完整的CI流水线和SDK漂移检测机制，确保OpenAPI规范与生成的SDK保持同步，防止API契约漂移导致的集成问题。

## 实现功能

### 1. CI流水线增强

- ✅ 完整的CI流程：`install → typecheck → lint → test → build → openapi export → sdk generate → drift guard`
- ✅ OpenAPI规范自动导出
- ✅ SDK自动生成（TypeScript + Dart）
- ✅ SDK漂移检测与报告

### 2. SDK版本管理

- ✅ 语义化版本控制（SemVer）
- ✅ 基于OpenAPI变更的自动版本升级
- ✅ 版本信息文件生成
- ✅ Git提交哈希追踪

### 3. 漂移检测机制

- ✅ 文件哈希比较
- ✅ 详细的变更报告
- ✅ CI环境下的自动失败机制
- ✅ 本地修复工具

## 常见失败案例与修复方式

### 案例1：SDK漂移检测失败

**错误信息：**

```
❌ SDK drift detected! The generated SDK differs from the current version.
📊 Drift Summary:
- Modified files: 3
- New files: 1
- Deleted files: 0

Detailed changes:
📝 Modified: src/client/apis/StocksApi.ts
📝 Modified: src/types/index.ts
📝 Modified: package.json
🆕 New: src/client/apis/UsersApi.ts
```

**原因分析：**

- OpenAPI规范已更新，但SDK未重新生成
- API接口发生变更（新增、修改、删除）
- 手动修改了生成的SDK文件

**修复方式：**

1. **本地修复（推荐）：**

   ```bash
   # 自动修复SDK漂移
   npm run sdk:drift-guard:fix

   # 或者手动步骤
   npm run openapi:generate
   npm run sdk:generate
   ```

2. **强制更新：**

   ```bash
   # 强制重新生成SDK
   npm run sdk:drift-guard -- --force
   ```

3. **检查变更：**
   ```bash
   # 查看详细的漂移报告
   cat packages/shared-sdk/.drift-report.json
   ```

### 案例2：OpenAPI导出失败

**错误信息：**

```
❌ OpenAPI generation failed: Cannot find API routes
Error: No API files found in services/api/app/api
```

**原因分析：**

- API路由文件路径错误
- API文件命名不符合约定
- TypeScript编译错误

**修复方式：**

1. **检查API路由结构：**

   ```bash
   # 确保API路由文件存在
   ls -la services/api/app/api/

   # 检查文件命名约定
   find services/api/app/api -name "route.ts" -o -name "*.ts"
   ```

2. **修复TypeScript错误：**

   ```bash
   # 在API服务目录下运行类型检查
   cd services/api
   npm run type-check
   ```

3. **手动测试OpenAPI生成：**
   ```bash
   cd services/api
   npm run openapi:generate
   ```

### 案例3：SDK生成失败

**错误信息：**

```
❌ SDK generation failed: OpenAPI Generator CLI not found
Error: Command 'openapi-generator-cli' not found
```

**原因分析：**

- OpenAPI Generator CLI未安装
- 依赖版本不兼容
- 网络问题导致下载失败

**修复方式：**

1. **重新安装依赖：**

   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install

   # 或使用pnpm
   pnpm install --force
   ```

2. **手动安装OpenAPI Generator：**

   ```bash
   npm install -g @openapitools/openapi-generator-cli
   ```

3. **检查Java环境：**

   ```bash
   # OpenAPI Generator需要Java运行时
   java -version

   # 如果没有Java，安装OpenJDK
   brew install openjdk@11
   ```

### 案例4：版本更新失败

**错误信息：**

```
❌ SDK version update failed: Invalid version format: undefined
Error: Could not parse current version from package.json
```

**原因分析：**

- package.json文件损坏
- 版本字段缺失或格式错误
- 文件权限问题

**修复方式：**

1. **检查package.json格式：**

   ```bash
   # 验证JSON格式
   cat packages/shared-sdk/package.json | jq .

   # 检查版本字段
   jq '.version' packages/shared-sdk/package.json
   ```

2. **修复版本格式：**

   ```json
   {
     "name": "@gulingtong/shared-sdk",
     "version": "1.0.0",
     ...
   }
   ```

3. **重置版本：**
   ```bash
   cd packages/shared-sdk
   npm version 1.0.0 --no-git-tag-version
   ```

### 案例5：CI环境权限问题

**错误信息：**

```
❌ Permission denied: cannot write to packages/shared-sdk/
Error: EACCES: permission denied, open 'packages/shared-sdk/package.json'
```

**原因分析：**

- CI环境文件权限限制
- 只读文件系统
- 用户权限不足

**修复方式：**

1. **更新CI配置权限：**

   ```yaml
   # .github/workflows/ci.yml
   - name: Generate SDK
     run: |
       chmod -R 755 packages/shared-sdk/
       npm run sdk:generate
   ```

2. **使用临时目录：**
   ```bash
   # 在临时目录生成，然后复制
   export TMPDIR=/tmp/sdk-gen
   npm run sdk:generate
   ```

## 最佳实践

### 开发流程

1. **API开发：**

   ```bash
   # 1. 修改API代码
   # 2. 更新OpenAPI注释
   # 3. 生成OpenAPI规范
   npm run openapi:generate

   # 4. 生成SDK
   npm run sdk:generate

   # 5. 检查漂移
   npm run sdk:drift-guard
   ```

2. **提交前检查：**

   ```bash
   # 完整的检查流程
   npm run type-check
   npm run lint
   npm run test
   npm run build
   npm run sdk:drift-guard
   ```

3. **版本发布：**

   ```bash
   # 自动版本升级
   npm run sdk:generate  # 包含版本更新

   # 手动版本控制
   cd packages/shared-sdk
   npm run version:patch  # 或 minor/major
   ```

### 监控与维护

1. **定期检查：**
   - 每周运行完整的SDK生成流程
   - 监控CI失败率和原因
   - 检查版本升级是否合理

2. **文档同步：**
   - 保持OpenAPI规范文档最新
   - 更新SDK使用示例
   - 维护变更日志

3. **依赖管理：**
   - 定期更新OpenAPI Generator版本
   - 检查生成代码的质量
   - 测试不同环境的兼容性

## 故障排除清单

- [ ] 检查Node.js和npm版本
- [ ] 验证Java运行时环境
- [ ] 确认OpenAPI文件格式正确
- [ ] 检查文件权限和路径
- [ ] 验证网络连接和代理设置
- [ ] 清理缓存和临时文件
- [ ] 检查CI环境变量配置
- [ ] 验证Git仓库状态

## 联系支持

如果遇到本文档未涵盖的问题，请：

1. 查看详细的错误日志
2. 检查相关的GitHub Issues
3. 联系开发团队获取支持
4. 提交新的Issue并附上完整的错误信息

---

**注意：** 本文档会随着系统的更新而持续维护，请确保使用最新版本。
