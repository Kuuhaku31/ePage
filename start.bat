@echo off
REM 快速启动脚本 - 图片浏览器 Docker 应用

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

REM 创建图片存储目录
echo 📁 创建图片存储目录...
if not exist "D:\def" mkdir D:\def
if not exist "D:\def\img" mkdir D:\def\img
if not exist "D:\def\img\a" mkdir D:\def\img\a
echo ✓ 目录已创建：D:\def\img\a
echo.

REM 启动 Docker Compose
echo 🐳 启动 Docker 容器...
echo.
cd /d "d:\html\RPage"
docker-compose up --build

echo.
echo ========================================
echo 应用已停止
echo ========================================
pause
