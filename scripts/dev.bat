@echo off
REM 古灵通项目开发环境启动脚本 (Windows)
REM Development Environment Setup Script for GuLingTong (Windows)

setlocal enabledelayedexpansion

REM 设置颜色代码
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 打印带颜色的消息
:print_message
echo %~2[GuLingTong] %~1%NC%
goto :eof

:print_success
call :print_message "%~1" "%GREEN%"
goto :eof

:print_warning
call :print_message "%~1" "%YELLOW%"
goto :eof

:print_error
call :print_message "%~1" "%RED%"
goto :eof

:print_info
call :print_message "%~1" "%BLUE%"
goto :eof

REM 检查必要的工具
:check_requirements
call :print_info "检查开发环境依赖..."

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Node.js 未安装，请先安装 Node.js 20+"
    exit /b 1
)

REM 检查 Node.js 版本
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION:v=%") do set NODE_MAJOR=%%i
if %NODE_MAJOR% LSS 18 (
    call :print_error "Node.js 版本过低，需要 18+ 版本"
    exit /b 1
)

REM 检查 pnpm
pnpm --version >nul 2>&1
if errorlevel 1 (
    call :print_warning "pnpm 未安装，正在安装..."
    npm install -g pnpm
)

REM 检查 Docker（可选）
docker --version >nul 2>&1
if errorlevel 1 (
    call :print_warning "Docker 未安装，将无法使用容器化开发环境"
)

call :print_success "环境检查完成"
goto :eof

REM 安装依赖
:install_dependencies
call :print_info "安装项目依赖..."

if not exist "pnpm-lock.yaml" (
    call :print_warning "pnpm-lock.yaml 不存在，将生成新的锁定文件"
)

pnpm install
if errorlevel 1 (
    call :print_error "依赖安装失败"
    exit /b 1
)

call :print_success "依赖安装完成"
goto :eof

REM 设置环境变量
:setup_env
call :print_info "设置环境变量..."

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        call :print_warning "已复制 .env.example 到 .env，请根据需要修改配置"
    ) else (
        call :print_error ".env.example 文件不存在"
        exit /b 1
    )
) else (
    call :print_success "环境变量文件已存在"
)
goto :eof

REM 初始化数据库
:setup_database
call :print_info "初始化数据库..."

REM 检查是否有 Docker 和 docker-compose
docker --version >nul 2>&1 && docker-compose --version >nul 2>&1
if not errorlevel 1 (
    call :print_info "启动数据库容器..."
    docker-compose -f docker-compose.yml up -d postgres redis
    
    REM 等待数据库启动
    call :print_info "等待数据库启动..."
    timeout /t 10 /nobreak >nul
) else (
    call :print_warning "Docker 不可用，请手动配置数据库连接"
)

REM 生成 Prisma 客户端
call :print_info "生成 Prisma 客户端..."
pnpm db:generate
if errorlevel 1 (
    call :print_warning "Prisma 客户端生成失败"
)

REM 运行数据库迁移
call :print_info "运行数据库迁移..."
pnpm db:migrate
if errorlevel 1 (
    call :print_warning "数据库迁移失败，请检查数据库连接"
)

call :print_success "数据库初始化完成"
goto :eof

REM 构建共享包
:build_shared
call :print_info "构建共享 SDK..."
pnpm build:shared
if errorlevel 1 (
    call :print_error "共享 SDK 构建失败"
    exit /b 1
)
call :print_success "共享 SDK 构建完成"
goto :eof

REM 检查端口是否被占用
:check_port
netstat -an | find ":%~1 " | find "LISTENING" >nul
if not errorlevel 1 (
    call :print_warning "端口 %~1 已被占用"
    exit /b 1
)
exit /b 0

REM 启动开发服务器
:start_dev_servers
call :print_info "启动开发服务器..."

REM 检查端口是否被占用
call :check_port 3000
if errorlevel 1 (
    call :print_error "端口 3000 被占用，请释放后重试"
    exit /b 1
)

call :check_port 3001
if errorlevel 1 (
    call :print_error "端口 3001 被占用，请释放后重试"
    exit /b 1
)

call :print_success "开始启动服务..."
call :print_info "管理后台: http://localhost:3000"
call :print_info "API 服务: http://localhost:3001"
call :print_info "按 Ctrl+C 停止服务"

REM 启动开发服务器
pnpm dev
goto :eof

REM 显示帮助信息
:show_help
echo 古灵通项目开发环境启动脚本
echo.
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   --help, -h          显示帮助信息
echo   --skip-deps         跳过依赖安装
echo   --skip-db           跳过数据库初始化
echo   --docker            使用 Docker 开发环境
echo   --clean             清理并重新安装
echo.
echo 示例:
echo   %~nx0                  完整启动开发环境
echo   %~nx0 --skip-deps      跳过依赖安装直接启动
echo   %~nx0 --docker         使用 Docker 容器启动
echo   %~nx0 --clean          清理重装
goto :eof

REM 清理环境
:clean_env
call :print_info "清理开发环境..."

REM 停止 Docker 容器
docker-compose --version >nul 2>&1
if not errorlevel 1 (
    docker-compose down
)

REM 清理 node_modules
for /d /r . %%d in (node_modules) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM 清理构建产物
if exist "apps\admin\.next" rd /s /q "apps\admin\.next" 2>nul
if exist "services\api\dist" rd /s /q "services\api\dist" 2>nul
if exist "packages\shared-sdk\dist" rd /s /q "packages\shared-sdk\dist" 2>nul

call :print_success "环境清理完成"
goto :eof

REM Docker 开发环境
:start_docker_dev
call :print_info "启动 Docker 开发环境..."

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "docker-compose 未安装"
    exit /b 1
)

REM 构建并启动开发容器
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
goto :eof

REM 主函数
:main
set "skip_deps=false"
set "skip_db=false"
set "use_docker=false"
set "clean=false"

REM 解析命令行参数
:parse_args
if "%~1"=="" goto :start_setup
if "%~1"=="--help" goto :show_help_and_exit
if "%~1"=="-h" goto :show_help_and_exit
if "%~1"=="--skip-deps" set "skip_deps=true"
if "%~1"=="--skip-db" set "skip_db=true"
if "%~1"=="--docker" set "use_docker=true"
if "%~1"=="--clean" set "clean=true"
shift
goto :parse_args

:show_help_and_exit
call :show_help
exit /b 0

:start_setup
call :print_success "古灵通项目开发环境启动"
call :print_info "项目路径: %CD%"

REM 清理环境
if "%clean%"=="true" call :clean_env

REM Docker 开发环境
if "%use_docker%"=="true" (
    call :start_docker_dev
    goto :eof
)

REM 检查环境
call :check_requirements
if errorlevel 1 exit /b 1

REM 设置环境变量
call :setup_env
if errorlevel 1 exit /b 1

REM 安装依赖
if "%skip_deps%"=="false" (
    call :install_dependencies
    if errorlevel 1 exit /b 1
)

REM 初始化数据库
if "%skip_db%"=="false" (
    call :setup_database
    if errorlevel 1 exit /b 1
)

REM 构建共享包
call :build_shared
if errorlevel 1 exit /b 1

REM 启动开发服务器
call :start_dev_servers
goto :eof

REM 运行主函数
call :main %*