# 股灵通 · PR 提示词 + 验收检查清单（对照版）

使用说明：

- 左边：**PR 提示词**（复制到 TRAE SOLO 执行）。
- 右边：**验收检查清单**（完成后逐条打勾）。

---

## PR-01 统一响应/鉴权/健康检查

**PR 提示词（pr-01-auth-featuregate-health）**

```text
1. 新增 src/lib/http.ts 与 src/lib/log.ts：ok()/fail()、x-request-id；错误包 {ok:false,error:{code,message,traceId}}
2. 新增 middleware/auth.ts：requireUser() 与 featureGate(required:'free'|'pro')
3. 现有 app/api/**/route.ts 接入 zod 入参校验与统一错误处理
4. 新增 /api/health 与 /api/version 路由
5. 为以上改造新增最小单测；更新 services/api/README 的“响应规范/健康检查”
```

**验收清单**

- [ ] 所有 route.ts 返回 {ok:true,data} 或 {ok:false,error:{code,message,traceId}}
- [ ] 响应头含 x-request-id，错误体 traceId 与之对应
- [ ] /api/health 200；/api/version 返回版本号
- [ ] 所有入参通过 zod 校验，非法参数 400 + 标准错误包
- [ ] FeatureGate 受限返回 403 + 标准错误包

---

## PR-02 DataProvider 抽象/回退

**PR 提示词（pr-02-dataprovider-switch-fallback）**

```text
1. src/lib/providers/BaseProvider.ts 定义 getIndices/getQuotes/getKline/getNews 接口
2. 实现 MockProvider 与 ProviderX（读取 env: DATA_BASE_URL, DATA_API_KEY）
3. providers/index.ts：Admin配置→env→Mock 选择逻辑；所有响应附 meta:{source,lagMs}
4. 改造 /api/market/* 与 /api/news 路由调用抽象层
5. 更新 .env.example 键名（不含值）
```

**验收清单**

- [ ] BaseProvider 定义 indices/quotes/kline/news
- [ ] ProviderX 读取 .env；失败回退 MockProvider
- [ ] 响应包含 meta.source 与 meta.lagMs
- [ ] 契约测试覆盖字段完整性/精度/单位；时延>0

---

## PR-03 AI Orchestrator 模板

**PR 提示词（pr-03-ai-orchestrator-template-llm-hooks）**

```text
1. 实现 orchestrator 与四子 agent（fundamental/technical/sentiment/risk）模板，统一安全措辞
2. /api/ai/analyze?symbol=xxx 返回 {symbol,rating,reasons[{agent,text,score,cites[]}],meta:{timeliness}}
3. 预留 LLM provider 接入点与费用/缓存/限流钩子（占位）
4. 单测：安全用语与结构校验；文档与示例响应
```

**验收清单**

- [ ] /api/ai/analyze 返回 rating/reasons/cites/meta.timeliness
- [ ] 四子 agent 均有输出；无“保本/稳赚”类用语
- [ ] 至少两个 symbol 示例响应通过
- [ ] 缓存/限流/费用钩子已预留（占位可）

---

## PR-04 Supabase RLS 与 Prisma

**PR 提示词（pr-04-supabase-rls-policies）**

```text
1. 对 watchlist/alerts/notifications/aireport 等表启用 RLS（默认拒绝）
2. 增加 owner 策略：auth.uid() = user_id
3. 对齐 prisma/schema.prisma 字段/索引；生成可重复迁移
4. 文档：本地迁移与回滚；SQL 示例验证
```

**验收清单**

- [ ] 业务表启用 RLS 且默认拒绝
- [ ] 存在 owner 策略：auth.uid() = user_id
- [ ] 不同用户访问同一记录被拒绝
- [ ] 迁移/回滚脚本可重复执行

---

## PR-05 CI 与 SDK 漂移守护

**PR 提示词（pr-05-ci-openapi-sdk-drift-guard）**

```text
1. CI：install→typecheck→lint→test→build→openapi export→sdk generate→diff guard
2. 生成 shared-sdk（TS；有 Dart 则一并生成）
3. PR_DRAFT.md 写清失败案例与修复方式
```

**验收清单**

- [ ] CI 含 install/typecheck/lint/test/build/openapi/sdk
- [ ] SDK drift 检测：有 diff 则 PR 失败
- [ ] shared-sdk 版本与 README 更新

---

## PR-06 Admin RBAC/Audit/数据源配置

**PR 提示词（pr-06-admin-rbac-audit-datasource）**

```text
1. 路由守卫 + 角色：admin/analyst/support（前后端双校验）
2. AuditLog 工具与页面
3. 数据源配置页：ProviderX baseURL/key、测试连通、配额/速率占位
```

**验收清单**

- [ ] 非白名单用户被拒绝进入管理界面
- [ ] admin/analyst/support 前后端双校验生效
- [ ] 敏感操作写入 AuditLog（actor/action/target/time）
- [ ] 数据源配置页能测试连接（mock 可）并显示结果

---

## PR-07 Mobile Flutter 稳定性

**PR 提示词（pr-07-mobile-stability-network-cache-observability）**

```text
1. Dio 拦截器与 request() 统一（token/重试/错误映射）
2. Riverpod 划分与资源释放；Hive 短缓存行情/AI 响应
3. Crashlytics/Sentry 占位；帧率日志
```

**验收清单**

- [ ] Dio 拦截器注入 token、重试与错误映射生效
- [ ] Riverpod 划分清晰且无内存泄漏
- [ ] Hive 缓存命中可见；断网/超时提示友好
- [ ] Crashlytics/Sentry 事件可见；帧率日志可导出

---

## PR-08 小程序工程化

**PR 提示词（pr-08-miniapp-network-skeleton-subscribe）**

```text
1. utils/request.js 封装（token/重试/Toast）
2. 高频页骨架屏与错误占位
3. 订阅消息模板位；业务域名白名单提示
```

**验收清单**

- [ ] utils/request.js 注入 token、重试 与 Toast 生效
- [ ] 高频页面有骨架屏；弱网/失败有兜底与重试
- [ ] 订阅消息模板位与业务域名白名单配置完成

---

## PR-09 合规组件

**PR 提示词（pr-09-compliance-disclaimer-datasource-hint）**

```text
1. <Disclaimer/> 与 <DataSourceHint/> 跨端组件（文案可配置、可国际化）
2. 个股详情页与 AI 面板底部固定展示
```

**验收清单**

- [ ] 三端引入 <Disclaimer/> 与 <DataSourceHint/>
- [ ] 个股详情与 AI 面板底部固定展示
- [ ] 文案集中配置，可国际化；可全局开关

---

## PR-10 Alert 引擎

**PR 提示词（pr-10-alert-engine-scan-idempotent）**

```text
1. 每5分钟扫描 alerts 规则（Mock→ProviderX）；命中写 notifications（user+symbol+rule+day 幂等）
2. /api/me/notifications 拉取
3. 单测：命中与幂等
```

**验收清单**

- [ ] 扫描任务每5分钟执行（本地可手动触发）
- [ ] 命中写 notifications，按 user+symbol+rule+day 幂等
- [ ] /api/me/notifications 能返回结果
- [ ] 单测覆盖命中与幂等

---

## PR-11 Observability 与安全

**PR 提示词（pr-11-security-rate-limit-logging-sentry）**

```text
1. /api/ai/* 与 /api/market/* 限流（per-user/per-ip）
2. 结构化日志 pino 与 x-request-id 注入；Sentry 接入（dsn 占位）
3. 文档：如何用 requestId 串联日志
```

**验收清单**

- [ ] /api/ai/_ 与 /api/market/_ 限流策略可配置并能触发 429
- [ ] 结构化日志记录 requestId，可链路追踪
- [ ] Sentry dsn 留空自动禁用，填入后事件可上报

---

## PR-12 Standards 守护

**PR 提示词（pr-12-standards-commitlint-husky-codeowners）**

```text
1. ESLint/Prettier 对齐；lint-staged + husky（pre-commit: format+lint；pre-push: test）
2. commitlint（conventional commits）；CODEOWNERS
```

**验收清单**

- [ ] ESLint/Prettier 在各包对齐；lint-staged + husky 钩子生效
- [ ] commitlint 强制 conventional commits
- [ ] CODEOWNERS 生效，关键目录有负责人

---
