@echo off
setlocal
REM 快速启动脚本 - 图片浏览器 Docker 应用

set "SCRIPT_DIR=%~dp0"
set "CONFIG_FILE=%SCRIPT_DIR%config.env"
set "IMAGES_HOST_DIR=D:/def/e/comic"

echo.
echo ========================================
echo 🖼️  图片浏览器 Docker 应用 - 快速启动
echo ========================================
echo.

REM 检查 Docker 是否已安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装或未在 PATH 中
    echo 请先安装 Docker: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✓ Docker 已安装
echo.

REM 读取配置文件中的 Docker /images 映射目录
if exist "%CONFIG_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%CONFIG_FILE%") do (
        if /I "%%A"=="IMAGES_HOST_DIR" set "IMAGES_HOST_DIR=%%B"
    )
)
set "IMAGES_HOST_DIR=%IMAGES_HOST_DIR:"=%"

if "%IMAGES_HOST_DIR%"=="" (
    echo ❌ config.env 中 IMAGES_HOST_DIR 不能为空
    pause
    exit /b 1
)

REM 创建图片映射目录
set "IMAGES_HOST_DIR_WIN=%IMAGES_HOST_DIR:/=\%"
echo 📁 创建图片映射目录...
if not exist "%IMAGES_HOST_DIR_WIN%" mkdir "%IMAGES_HOST_DIR_WIN%"
echo ✓ /images 将映射到：%IMAGES_HOST_DIR%
echo.

REM 启动 Docker Compose
echo 🐳 启动 Docker 容器...
echo.
cd /d "%SCRIPT_DIR%"
if exist "%CONFIG_FILE%" (
    docker-compose --env-file "%CONFIG_FILE%" up --build
) else (
    docker-compose up --build
)

echo.
echo ========================================
echo 应用已停止
echo ========================================
pause
