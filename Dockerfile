# 多阶段构建 Dockerfile for 古灵通项目

# Stage 1: 基础镜像和依赖安装
FROM node:20-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/
COPY services/api/package.json ./services/api/
COPY packages/shared-sdk/package.json ./packages/shared-sdk/

# 安装依赖
RUN pnpm install --frozen-lockfile

# Stage 2: 构建阶段
FROM base AS builder

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN pnpm db:generate

# 构建项目
RUN pnpm build

# Stage 3: API 服务生产镜像
FROM node:20-alpine AS api

# 安装 pnpm
RUN npm install -g pnpm

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 复制构建产物和依赖
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# 复制 Prisma 相关文件
COPY --from=builder /app/services/api/prisma ./services/api/prisma
COPY --from=builder /app/services/api/node_modules/.prisma ./services/api/node_modules/.prisma

# 设置用户权限
USER nextjs

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["pnpm", "--filter", "@gulingtong/api", "start"]

# Stage 4: Admin 管理后台生产镜像
FROM node:20-alpine AS admin

# 安装 pnpm
RUN npm install -g pnpm

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

# 设置用户权限
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "apps/admin/server.js"]

# Stage 5: 开发环境镜像
FROM base AS development

# 安装开发工具
RUN apk add --no-cache git

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN pnpm db:generate

# 暴露端口
EXPOSE 3000 3001

# 启动开发服务
CMD ["pnpm", "dev"]