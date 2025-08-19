#!/bin/bash

# 古灵通项目生产环境部署脚本
# Production Deployment Script for GuLingTong

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="gulingtong"
REGISTRY_URL="${REGISTRY_URL:-registry.example.com}"
NAMESPACE="${NAMESPACE:-gulingtong}"
ENVIRONMENT="${ENVIRONMENT:-production}"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

# 打印带颜色的消息
print_message() {
    echo -e "${2}[Deploy] $1${NC}"
}

print_success() {
    print_message "$1" "$GREEN"
}

print_warning() {
    print_message "$1" "$YELLOW"
}

print_error() {
    print_message "$1" "$RED"
}

print_info() {
    print_message "$1" "$BLUE"
}

# 检查必要的工具
check_requirements() {
    print_info "检查部署环境依赖..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 docker-compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose 未安装"
        exit 1
    fi
    
    # 检查 kubectl（如果使用 Kubernetes）
    if [ "$USE_KUBERNETES" = "true" ] && ! command -v kubectl &> /dev/null; then
        print_error "kubectl 未安装，但启用了 Kubernetes 部署"
        exit 1
    fi
    
    print_success "环境检查完成"
}

# 构建 Docker 镜像
build_images() {
    print_info "构建 Docker 镜像..."
    
    # 构建 API 镜像
    print_info "构建 API 服务镜像..."
    docker build -t "${REGISTRY_URL}/${PROJECT_NAME}-api:${VERSION}" \
                 -t "${REGISTRY_URL}/${PROJECT_NAME}-api:latest" \
                 --target api .
    
    # 构建 Admin 镜像
    print_info "构建管理后台镜像..."
    docker build -t "${REGISTRY_URL}/${PROJECT_NAME}-admin:${VERSION}" \
                 -t "${REGISTRY_URL}/${PROJECT_NAME}-admin:latest" \
                 --target admin .
    
    print_success "镜像构建完成"
}

# 推送镜像到仓库
push_images() {
    print_info "推送镜像到仓库..."
    
    # 登录到镜像仓库
    if [ -n "$REGISTRY_USERNAME" ] && [ -n "$REGISTRY_PASSWORD" ]; then
        echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_URL" -u "$REGISTRY_USERNAME" --password-stdin
    fi
    
    # 推送 API 镜像
    docker push "${REGISTRY_URL}/${PROJECT_NAME}-api:${VERSION}"
    docker push "${REGISTRY_URL}/${PROJECT_NAME}-api:latest"
    
    # 推送 Admin 镜像
    docker push "${REGISTRY_URL}/${PROJECT_NAME}-admin:${VERSION}"
    docker push "${REGISTRY_URL}/${PROJECT_NAME}-admin:latest"
    
    print_success "镜像推送完成"
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    
    # 安装依赖
    if command -v pnpm &> /dev/null; then
        pnpm install --frozen-lockfile
        pnpm db:generate
        pnpm test
    else
        npm ci
        npm run db:generate
        npm test
    fi
    
    print_success "测试通过"
}

# 备份数据库
backup_database() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        print_warning "跳过数据库备份"
        return
    fi
    
    print_info "备份数据库..."
    
    local backup_file="backup-${PROJECT_NAME}-${VERSION}.sql"
    
    if [ -n "$DATABASE_URL" ]; then
        # 使用 pg_dump 备份 PostgreSQL
        pg_dump "$DATABASE_URL" > "$backup_file"
        
        # 上传备份到云存储（示例）
        if [ -n "$BACKUP_STORAGE_URL" ]; then
            # 这里可以添加上传到 S3、阿里云 OSS 等的逻辑
            print_info "上传备份到云存储..."
        fi
        
        print_success "数据库备份完成: $backup_file"
    else
        print_warning "未配置数据库连接，跳过备份"
    fi
}

# Docker Compose 部署
deploy_with_compose() {
    print_info "使用 Docker Compose 部署..."
    
    # 创建部署目录
    local deploy_dir="/opt/${PROJECT_NAME}"
    sudo mkdir -p "$deploy_dir"
    
    # 复制配置文件
    sudo cp docker-compose.yml "$deploy_dir/"
    sudo cp nginx.conf "$deploy_dir/"
    
    # 创建环境变量文件
    cat > "$deploy_dir/.env" << EOF
NODE_ENV=production
VERSION=$VERSION
REGISTRY_URL=$REGISTRY_URL
PROJECT_NAME=$PROJECT_NAME
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
EOF
    
    # 停止旧服务
    cd "$deploy_dir"
    sudo docker-compose down || true
    
    # 启动新服务
    sudo docker-compose up -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 30
    
    # 健康检查
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_success "API 服务健康检查通过"
    else
        print_error "API 服务健康检查失败"
        exit 1
    fi
    
    if curl -f http://localhost > /dev/null 2>&1; then
        print_success "管理后台健康检查通过"
    else
        print_error "管理后台健康检查失败"
        exit 1
    fi
    
    print_success "Docker Compose 部署完成"
}

# Kubernetes 部署
deploy_with_kubernetes() {
    print_info "使用 Kubernetes 部署..."
    
    # 检查 k8s 目录是否存在
    if [ ! -d "k8s" ]; then
        print_error "k8s 目录不存在"
        exit 1
    fi
    
    # 替换镜像版本
    find k8s -name "*.yaml" -exec sed -i "s|{{VERSION}}|${VERSION}|g" {} \;
    find k8s -name "*.yaml" -exec sed -i "s|{{REGISTRY_URL}}|${REGISTRY_URL}|g" {} \;
    find k8s -name "*.yaml" -exec sed -i "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" {} \;
    
    # 创建命名空间
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # 应用配置
    kubectl apply -f k8s/ -n "$NAMESPACE"
    
    # 等待部署完成
    kubectl rollout status deployment/${PROJECT_NAME}-api -n "$NAMESPACE"
    kubectl rollout status deployment/${PROJECT_NAME}-admin -n "$NAMESPACE"
    
    # 获取服务地址
    local api_url=$(kubectl get service ${PROJECT_NAME}-api -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    local admin_url=$(kubectl get service ${PROJECT_NAME}-admin -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    print_success "Kubernetes 部署完成"
    print_info "API 服务地址: http://${api_url}"
    print_info "管理后台地址: http://${admin_url}"
}

# 运行数据库迁移
run_migrations() {
    print_info "运行数据库迁移..."
    
    if [ "$USE_KUBERNETES" = "true" ]; then
        # 在 Kubernetes 中运行迁移
        kubectl run migration-job --image="${REGISTRY_URL}/${PROJECT_NAME}-api:${VERSION}" \
                --restart=Never --rm -i --tty \
                --env="DATABASE_URL=$DATABASE_URL" \
                --command -- pnpm db:migrate
    else
        # 在 Docker Compose 中运行迁移
        docker run --rm \
                --env DATABASE_URL="$DATABASE_URL" \
                "${REGISTRY_URL}/${PROJECT_NAME}-api:${VERSION}" \
                pnpm db:migrate
    fi
    
    print_success "数据库迁移完成"
}

# 清理旧镜像
cleanup_old_images() {
    print_info "清理旧镜像..."
    
    # 保留最近的 5 个版本
    docker images "${REGISTRY_URL}/${PROJECT_NAME}-api" --format "table {{.Tag}}\t{{.ID}}" | \
        tail -n +2 | sort -r | tail -n +6 | awk '{print $2}' | xargs -r docker rmi || true
    
    docker images "${REGISTRY_URL}/${PROJECT_NAME}-admin" --format "table {{.Tag}}\t{{.ID}}" | \
        tail -n +2 | sort -r | tail -n +6 | awk '{print $2}' | xargs -r docker rmi || true
    
    print_success "镜像清理完成"
}

# 发送部署通知
send_notification() {
    if [ -n "$WEBHOOK_URL" ]; then
        print_info "发送部署通知..."
        
        local message="🚀 ${PROJECT_NAME} ${ENVIRONMENT} 环境部署完成\n版本: ${VERSION}\n时间: $(date)"
        
        curl -X POST "$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"text\": \"$message\"}" || true
        
        print_success "通知发送完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "古灵通项目生产环境部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h              显示帮助信息"
    echo "  --environment ENV       部署环境 (production|staging)"
    echo "  --version VERSION       版本号"
    echo "  --skip-tests            跳过测试"
    echo "  --skip-backup           跳过数据库备份"
    echo "  --use-kubernetes        使用 Kubernetes 部署"
    echo "  --registry-url URL      镜像仓库地址"
    echo "  --namespace NS          Kubernetes 命名空间"
    echo ""
    echo "环境变量:"
    echo "  REGISTRY_USERNAME       镜像仓库用户名"
    echo "  REGISTRY_PASSWORD       镜像仓库密码"
    echo "  DATABASE_URL            数据库连接字符串"
    echo "  WEBHOOK_URL             通知 Webhook 地址"
    echo ""
    echo "示例:"
    echo "  $0                                      默认部署到生产环境"
    echo "  $0 --environment staging                部署到测试环境"
    echo "  $0 --use-kubernetes --namespace test    使用 K8s 部署到 test 命名空间"
}

# 主函数
main() {
    local skip_tests=false
    local skip_backup=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --use-kubernetes)
                USE_KUBERNETES=true
                shift
                ;;
            --registry-url)
                REGISTRY_URL="$2"
                shift 2
                ;;
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_success "开始部署 ${PROJECT_NAME} 到 ${ENVIRONMENT} 环境"
    print_info "版本: ${VERSION}"
    print_info "镜像仓库: ${REGISTRY_URL}"
    
    # 检查环境
    check_requirements
    
    # 运行测试
    if [ "$skip_tests" = false ]; then
        run_tests
    fi
    
    # 备份数据库
    backup_database
    
    # 构建镜像
    build_images
    
    # 推送镜像
    push_images
    
    # 运行数据库迁移
    run_migrations
    
    # 部署应用
    if [ "$USE_KUBERNETES" = "true" ]; then
        deploy_with_kubernetes
    else
        deploy_with_compose
    fi
    
    # 清理旧镜像
    cleanup_old_images
    
    # 发送通知
    send_notification
    
    print_success "🎉 部署完成！"
    print_info "管理后台: http://localhost (Docker Compose) 或查看 K8s 服务地址"
    print_info "API 文档: http://localhost/api/docs"
}

# 捕获中断信号
trap 'print_info "部署被中断"; exit 1' INT TERM

# 运行主函数
main "$@"