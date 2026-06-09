#!/bin/bash
# 快速启动脚本 - 图片浏览器 Docker 应用

echo ""
echo "========================================"
echo "🖼️  图片浏览器 Docker 应用 - 快速启动"
echo "========================================"
echo ""

# 检查 Docker 是否已安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo "请先安装 Docker: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✓ Docker 已安装"
echo ""

# 创建图片存储目录
echo "📁 创建图片存储目录..."
mkdir -p /d/def/img/a 2>/dev/null || mkdir -p D:/def/img/a
echo "✓ 目录已创建"
echo ""

# 启动 Docker Compose
echo "🐳 启动 Docker 容器..."
echo ""
cd "$(dirname "$0")"
docker-compose up --build

echo ""
echo "========================================"
echo "应用已停止"
echo "========================================"
