@echo off
setlocal enabledelayedexpansion

:: 古灵通项目生产环境部署脚本 (Windows版)
:: Production Deployment Script for GuLingTong (Windows version)

:: 颜色定义
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:: 配置变量
set "PROJECT_NAME=gulingtong"
if not defined REGISTRY_URL set "REGISTRY_URL=registry.example.com"
if not defined NAMESPACE set "NAMESPACE=gulingtong"
if not defined ENVIRONMENT set "ENVIRONMENT=production"

:: 生成版本号（如果未指定）
for /f "tokens=2 delims=:" %%a in ('powershell -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"') do set "DEFAULT_VERSION=%%a"
set "DEFAULT_VERSION=%DEFAULT_VERSION: =%"
if not defined VERSION set "VERSION=%DEFAULT_VERSION%"

:: 打印带颜色的消息
:print_message
    echo %~2[Deploy] %~1%NC%
    exit /b 0

:print_success
    call :print_message "%~1" "%GREEN%"
    exit /b 0

:print_warning
    call :print_message "%~1" "%YELLOW%"
    exit /b 0

:print_error
    call :print_message "%~1" "%RED%"
    exit /b 0

:print_info
    call :print_message "%~1" "%BLUE%"
    exit /b 0

:: 检查必要的工具
:check_requirements
    call :print_info "检查部署环境依赖..."
    
    :: 检查 Docker
    where docker >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        call :print_error "Docker 未安装"
        exit /b 1
    )
    
    :: 检查 docker-compose
    where docker-compose >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        call :print_error "docker-compose 未安装"
        exit /b 1
    )
    
    :: 检查 kubectl（如果使用 Kubernetes）
    if "%USE_KUBERNETES%"=="true" (
        where kubectl >nul 2>&1
        if %ERRORLEVEL% neq 0 (
            call :print_error "kubectl 未安装，但启用了 Kubernetes 部署"
            exit /b 1
        )
    )
    
    call :print_success "环境检查完成"
    exit /b 0

:: 构建 Docker 镜像
:build_images
    call :print_info "构建 Docker 镜像..."
    
    :: 构建 API 镜像
    call :print_info "构建 API 服务镜像..."
    docker build -t "%REGISTRY_URL%/%PROJECT_NAME%-api:%VERSION%" ^^
                 -t "%REGISTRY_URL%/%PROJECT_NAME%-api:latest" ^^
                 --target api .
    if %ERRORLEVEL% neq 0 (
        call :print_error "API 镜像构建失败"
        exit /b 1
    )
    
    :: 构建 Admin 镜像
    call :print_info "构建管理后台镜像..."
    docker build -t "%REGISTRY_URL%/%PROJECT_NAME%-admin:%VERSION%" ^^
                 -t "%REGISTRY_URL%/%PROJECT_NAME%-admin:latest" ^^
                 --target admin .
    if %ERRORLEVEL% neq 0 (
        call :print_error "管理后台镜像构建失败"
        exit /b 1
    )
    
    call :print_success "镜像构建完成"
    exit /b 0

:: 推送镜像到仓库
:push_images
    call :print_info "推送镜像到仓库..."
    
    :: 登录到镜像仓库
    if defined REGISTRY_USERNAME if defined REGISTRY_PASSWORD (
        echo %REGISTRY_PASSWORD% | docker login "%REGISTRY_URL%" -u "%REGISTRY_USERNAME%" --password-stdin
        if %ERRORLEVEL% neq 0 (
            call :print_error "登录镜像仓库失败"
            exit /b 1
        )
    )
    
    :: 推送 API 镜像
    docker push "%REGISTRY_URL%/%PROJECT_NAME%-api:%VERSION%"
    docker push "%REGISTRY_URL%/%PROJECT_NAME%-api:latest"
    
    :: 推送 Admin 镜像
    docker push "%REGISTRY_URL%/%PROJECT_NAME%-admin:%VERSION%"
    docker push "%REGISTRY_URL%/%PROJECT_NAME%-admin:latest"
    
    call :print_success "镜像推送完成"
    exit /b 0

:: 运行测试
:run_tests
    call :print_info "运行测试..."
    
    :: 安装依赖
    where pnpm >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call pnpm install --frozen-lockfile
        call pnpm db:generate
        call pnpm test
    ) else (
        call npm ci
        call npm run db:generate
        call npm test
    )
    
    if %ERRORLEVEL% neq 0 (
        call :print_error "测试失败"
        exit /b 1
    )
    
    call :print_success "测试通过"
    exit /b 0

:: 备份数据库
:backup_database
    if "%SKIP_BACKUP%"=="true" (
        call :print_warning "跳过数据库备份"
        exit /b 0
    )
    
    call :print_info "备份数据库..."
    
    set "backup_file=backup-%PROJECT_NAME%-%VERSION%.sql"
    
    if defined DATABASE_URL (
        :: 使用 pg_dump 备份 PostgreSQL
        where pg_dump >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            pg_dump "%DATABASE_URL%" > "%backup_file%"
            
            :: 上传备份到云存储（示例）
            if defined BACKUP_STORAGE_URL (
                :: 这里可以添加上传到 S3、阿里云 OSS 等的逻辑
                call :print_info "上传备份到云存储..."
            )
            
            call :print_success "数据库备份完成: %backup_file%"
        ) else (
            call :print_warning "pg_dump 未安装，无法备份 PostgreSQL 数据库"
        )
    ) else (
        call :print_warning "未配置数据库连接，跳过备份"
    )
    
    exit /b 0

:: Docker Compose 部署
:deploy_with_compose
    call :print_info "使用 Docker Compose 部署..."
    
    :: 创建部署目录
    set "deploy_dir=C:\opt\%PROJECT_NAME%"
    if not exist "%deploy_dir%" mkdir "%deploy_dir%"
    
    :: 复制配置文件
    copy docker-compose.yml "%deploy_dir%\"
    copy nginx.conf "%deploy_dir%\"
    
    :: 创建环境变量文件
    (
        echo NODE_ENV=production
        echo VERSION=%VERSION%
        echo REGISTRY_URL=%REGISTRY_URL%
        echo PROJECT_NAME=%PROJECT_NAME%
        echo DATABASE_URL=%DATABASE_URL%
        echo REDIS_URL=%REDIS_URL%
        echo NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL%
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY%
        echo SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY%
    ) > "%deploy_dir%\.env"
    
    :: 停止旧服务
    cd /d "%deploy_dir%"
    docker-compose down
    
    :: 启动新服务
    docker-compose up -d
    if %ERRORLEVEL% neq 0 (
        call :print_error "Docker Compose 部署失败"
        exit /b 1
    )
    
    :: 等待服务启动
    call :print_info "等待服务启动..."
    timeout /t 30 /nobreak > nul
    
    :: 健康检查
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/api/health' -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
    if %ERRORLEVEL% equ 0 (
        call :print_success "API 服务健康检查通过"
    ) else (
        call :print_error "API 服务健康检查失败"
        exit /b 1
    )
    
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost' -UseBasicParsing; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
    if %ERRORLEVEL% equ 0 (
        call :print_success "管理后台健康检查通过"
    ) else (
        call :print_error "管理后台健康检查失败"
        exit /b 1
    )
    
    call :print_success "Docker Compose 部署完成"
    exit /b 0

:: Kubernetes 部署
:deploy_with_kubernetes
    call :print_info "使用 Kubernetes 部署..."
    
    :: 检查 k8s 目录是否存在
    if not exist "k8s" (
        call :print_error "k8s 目录不存在"
        exit /b 1
    )
    
    :: 替换镜像版本
    powershell -Command "Get-ChildItem -Path k8s -Filter *.yaml -Recurse | ForEach-Object { (Get-Content $_.FullName) -replace '{{VERSION}}', '%VERSION%' -replace '{{REGISTRY_URL}}', '%REGISTRY_URL%' -replace '{{PROJECT_NAME}}', '%PROJECT_NAME%' | Set-Content $_.FullName }"
    
    :: 创建命名空间
    kubectl create namespace "%NAMESPACE%" --dry-run=client -o yaml | kubectl apply -f -
    
    :: 应用配置
    kubectl apply -f k8s/ -n "%NAMESPACE%"
    if %ERRORLEVEL% neq 0 (
        call :print_error "Kubernetes 部署失败"
        exit /b 1
    )
    
    :: 等待部署完成
    kubectl rollout status deployment/%PROJECT_NAME%-api -n "%NAMESPACE%"
    kubectl rollout status deployment/%PROJECT_NAME%-admin -n "%NAMESPACE%"
    
    :: 获取服务地址
    for /f "tokens=*" %%a in ('kubectl get service %PROJECT_NAME%-api -n "%NAMESPACE%" -o jsonpath^={.status.loadBalancer.ingress[0].ip}') do set "api_url=%%a"
    for /f "tokens=*" %%a in ('kubectl get service %PROJECT_NAME%-admin -n "%NAMESPACE%" -o jsonpath^={.status.loadBalancer.ingress[0].ip}') do set "admin_url=%%a"
    
    call :print_success "Kubernetes 部署完成"
    call :print_info "API 服务地址: http://%api_url%"
    call :print_info "管理后台地址: http://%admin_url%"
    exit /b 0

:: 运行数据库迁移
:run_migrations
    call :print_info "运行数据库迁移..."
    
    if "%USE_KUBERNETES%"=="true" (
        :: 在 Kubernetes 中运行迁移
        kubectl run migration-job --image="%REGISTRY_URL%/%PROJECT_NAME%-api:%VERSION%" ^^
                --restart=Never --rm -i --tty ^^
                --env="DATABASE_URL=%DATABASE_URL%" ^^
                --command -- pnpm db:migrate
    ) else (
        :: 在 Docker Compose 中运行迁移
        docker run --rm ^^
                --env DATABASE_URL="%DATABASE_URL%" ^^
                "%REGISTRY_URL%/%PROJECT_NAME%-api:%VERSION%" ^^
                pnpm db:migrate
    )
    
    if %ERRORLEVEL% neq 0 (
        call :print_error "数据库迁移失败"
        exit /b 1
    )
    
    call :print_success "数据库迁移完成"
    exit /b 0

:: 清理旧镜像
:cleanup_old_images
    call :print_info "清理旧镜像..."
    
    :: 保留最近的 5 个版本
    for /f "tokens=3" %%a in ('docker images "%REGISTRY_URL%/%PROJECT_NAME%-api" --format "{{.Tag}}" ^| sort /r ^| findstr /v "latest" ^| more +5') do (
        docker rmi "%REGISTRY_URL%/%PROJECT_NAME%-api:%%a" 2>nul
    )
    
    for /f "tokens=3" %%a in ('docker images "%REGISTRY_URL%/%PROJECT_NAME%-admin" --format "{{.Tag}}" ^| sort /r ^| findstr /v "latest" ^| more +5') do (
        docker rmi "%REGISTRY_URL%/%PROJECT_NAME%-admin:%%a" 2>nul
    )
    
    call :print_success "镜像清理完成"
    exit /b 0

:: 发送部署通知
:send_notification
    if defined WEBHOOK_URL (
        call :print_info "发送部署通知..."
        
        set "message=🚀 %PROJECT_NAME% %ENVIRONMENT% 环境部署完成\n版本: %VERSION%\n时间: %date% %time%"
        
        powershell -Command "$message = '%message%'; $body = @{text = $message} | ConvertTo-Json; Invoke-RestMethod -Uri '%WEBHOOK_URL%' -Method Post -Body $body -ContentType 'application/json'"
        
        call :print_success "通知发送完成"
    )
    exit /b 0

:: 显示帮助信息
:show_help
    echo 古灵通项目生产环境部署脚本 (Windows版)
    echo.
    echo 用法: %~nx0 [选项]
    echo.
    echo 选项:
    echo   --help, -h              显示帮助信息
    echo   --environment ENV       部署环境 (production^|staging)
    echo   --version VERSION       版本号
    echo   --skip-tests            跳过测试
    echo   --skip-backup           跳过数据库备份
    echo   --use-kubernetes        使用 Kubernetes 部署
    echo   --registry-url URL      镜像仓库地址
    echo   --namespace NS          Kubernetes 命名空间
    echo.
    echo 环境变量:
    echo   REGISTRY_USERNAME       镜像仓库用户名
    echo   REGISTRY_PASSWORD       镜像仓库密码
    echo   DATABASE_URL            数据库连接字符串
    echo   WEBHOOK_URL             通知 Webhook 地址
    echo.
    echo 示例:
    echo   %~nx0                                      默认部署到生产环境
    echo   %~nx0 --environment staging                部署到测试环境
    echo   %~nx0 --use-kubernetes --namespace test    使用 K8s 部署到 test 命名空间
    exit /b 0

:: 主函数
:main
    setlocal enabledelayedexpansion
    
    set "skip_tests=false"
    set "SKIP_BACKUP=false"
    set "USE_KUBERNETES=false"
    
    :: 解析命令行参数
    :parse_args
    if "%~1"=="" goto start_deployment
    if "%~1"=="--help" goto show_help
    if "%~1"=="-h" goto show_help
    if "%~1"=="--environment" (
        set "ENVIRONMENT=%~2"
        shift
        shift
        goto parse_args
    )
    if "%~1"=="--version" (
        set "VERSION=%~2"
        shift
        shift
        goto parse_args
    )
    if "%~1"=="--skip-tests" (
        set "skip_tests=true"
        shift
        goto parse_args
    )
    if "%~1"=="--skip-backup" (
        set "SKIP_BACKUP=true"
        shift
        goto parse_args
    )
    if "%~1"=="--use-kubernetes" (
        set "USE_KUBERNETES=true"
        shift
        goto parse_args
    )
    if "%~1"=="--registry-url" (
        set "REGISTRY_URL=%~2"
        shift
        shift
        goto parse_args
    )
    if "%~1"=="--namespace" (
        set "NAMESPACE=%~2"
        shift
        shift
        goto parse_args
    )
    
    call :print_error "未知选项: %~1"
    call :show_help
    exit /b 1
    
    :start_deployment
    call :print_success "开始部署 %PROJECT_NAME% 到 %ENVIRONMENT% 环境"
    call :print_info "版本: %VERSION%"
    call :print_info "镜像仓库: %REGISTRY_URL%"
    
    :: 检查环境
    call :check_requirements
    if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
    
    :: 运行测试
    if "%skip_tests%"=="false" (
        call :run_tests
        if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
    )
    
    :: 备份数据库
    call :backup_database
    
    :: 构建镜像
    call :build_images
    if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
    
    :: 推送镜像
    call :push_images
    if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
    
    :: 运行数据库迁移
    call :run_migrations
    if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
    
    :: 部署应用
    if "%USE_KUBERNETES%"=="true" (
        call :deploy_with_kubernetes
    ) else (
        call :deploy_with_compose
    )
    if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%
    
    :: 清理旧镜像
    call :cleanup_old_images
    
    :: 发送通知
    call :send_notification
    
    call :print_success "🎉 部署完成！"
    call :print_info "管理后台: http://localhost (Docker Compose) 或查看 K8s 服务地址"
    call :print_info "API 文档: http://localhost/api/docs"
    
    exit /b 0

:: 捕获中断信号 - Windows 批处理不支持，但保留此注释以与 bash 脚本对应

:: 运行主函数
call :main %*
exit /b %ERRORLEVEL%