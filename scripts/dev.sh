#!/bin/bash

# 古灵通项目开发环境启动脚本
# Development Environment Setup Script for GuLingTong

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}[GuLingTong] $1${NC}"
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
    print_info "检查开发环境依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js 20+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 版本过低，需要 18+ 版本"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm 未安装，正在安装..."
        npm install -g pnpm
    fi
    
    # 检查 Docker（可选）
    if ! command -v docker &> /dev/null; then
        print_warning "Docker 未安装，将无法使用容器化开发环境"
    fi
    
    print_success "环境检查完成"
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    if [ ! -f "pnpm-lock.yaml" ]; then
        print_warning "pnpm-lock.yaml 不存在，将生成新的锁定文件"
    fi
    
    pnpm install
    
    print_success "依赖安装完成"
}

# 设置环境变量
setup_env() {
    print_info "设置环境变量..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "已复制 .env.example 到 .env，请根据需要修改配置"
        else
            print_error ".env.example 文件不存在"
            exit 1
        fi
    else
        print_success "环境变量文件已存在"
    fi
}

# 初始化数据库
setup_database() {
    print_info "初始化数据库..."
    
    # 检查是否有 Docker 和 docker-compose
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_info "启动数据库容器..."
        docker-compose -f docker-compose.yml up -d postgres redis
        
        # 等待数据库启动
        print_info "等待数据库启动..."
        sleep 10
    else
        print_warning "Docker 不可用，请手动配置数据库连接"
    fi
    
    # 生成 Prisma 客户端
    print_info "生成 Prisma 客户端..."
    pnpm db:generate
    
    # 运行数据库迁移
    print_info "运行数据库迁移..."
    pnpm db:migrate || print_warning "数据库迁移失败，请检查数据库连接"
    
    print_success "数据库初始化完成"
}

# 构建共享包
build_shared() {
    print_info "构建共享 SDK..."
    pnpm build:shared
    print_success "共享 SDK 构建完成"
}

# 启动开发服务器
start_dev_servers() {
    print_info "启动开发服务器..."
    
    # 检查端口是否被占用
    check_port() {
        if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
            print_warning "端口 $1 已被占用"
            return 1
        fi
        return 0
    }
    
    if ! check_port 3000; then
        print_error "端口 3000 被占用，请释放后重试"
        exit 1
    fi
    
    if ! check_port 3001; then
        print_error "端口 3001 被占用，请释放后重试"
        exit 1
    fi
    
    print_success "开始启动服务..."
    print_info "管理后台: http://localhost:3000"
    print_info "API 服务: http://localhost:3001"
    print_info "按 Ctrl+C 停止服务"
    
    # 启动开发服务器
    pnpm dev
}

# 显示帮助信息
show_help() {
    echo "古灵通项目开发环境启动脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help, -h          显示帮助信息"
    echo "  --skip-deps         跳过依赖安装"
    echo "  --skip-db           跳过数据库初始化"
    echo "  --docker            使用 Docker 开发环境"
    echo "  --clean             清理并重新安装"
    echo ""
    echo "示例:"
    echo "  $0                  完整启动开发环境"
    echo "  $0 --skip-deps      跳过依赖安装直接启动"
    echo "  $0 --docker         使用 Docker 容器启动"
    echo "  $0 --clean          清理重装"
}

# 清理环境
clean_env() {
    print_info "清理开发环境..."
    
    # 停止 Docker 容器
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    fi
    
    # 清理 node_modules
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理构建产物
    rm -rf apps/admin/.next
    rm -rf services/api/dist
    rm -rf packages/shared-sdk/dist
    
    print_success "环境清理完成"
}

# Docker 开发环境
start_docker_dev() {
    print_info "启动 Docker 开发环境..."
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose 未安装"
        exit 1
    fi
    
    # 构建并启动开发容器
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
}

# 主函数
main() {
    local skip_deps=false
    local skip_db=false
    local use_docker=false
    local clean=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --skip-deps)
                skip_deps=true
                shift
                ;;
            --skip-db)
                skip_db=true
                shift
                ;;
            --docker)
                use_docker=true
                shift
                ;;
            --clean)
                clean=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_success "古灵通项目开发环境启动"
    print_info "项目路径: $(pwd)"
    
    # 清理环境
    if [ "$clean" = true ]; then
        clean_env
    fi
    
    # Docker 开发环境
    if [ "$use_docker" = true ]; then
        start_docker_dev
        return
    fi
    
    # 检查环境
    check_requirements
    
    # 设置环境变量
    setup_env
    
    # 安装依赖
    if [ "$skip_deps" = false ]; then
        install_dependencies
    fi
    
    # 初始化数据库
    if [ "$skip_db" = false ]; then
        setup_database
    fi
    
    # 构建共享包
    build_shared
    
    # 启动开发服务器
    start_dev_servers
}

# 捕获中断信号
trap 'print_info "正在停止服务..."; exit 0' INT TERM

# 运行主函数
main "$@"