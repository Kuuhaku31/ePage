#!/bin/bash
# 快速启动脚本 - 图片浏览器 Docker 应用

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.env"
IMAGES_HOST_DIR="${IMAGES_HOST_DIR:-D:/def/e/comic}"

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

# 读取配置文件中的 Docker /images 映射目录
if [ -f "$CONFIG_FILE" ]; then
    while IFS='=' read -r key value; do
        key="$(printf '%s' "$key" | tr -d '[:space:]')"
        value="${value%$'\r'}"
        case "$key" in
            IMAGES_HOST_DIR)
                IMAGES_HOST_DIR="${value%\"}"
                IMAGES_HOST_DIR="${IMAGES_HOST_DIR#\"}"
                ;;
        esac
    done < "$CONFIG_FILE"
fi

if [ -z "$IMAGES_HOST_DIR" ]; then
    echo "❌ config.env 中 IMAGES_HOST_DIR 不能为空"
    exit 1
fi

# 创建图片映射目录
echo "📁 创建图片映射目录..."
case "$IMAGES_HOST_DIR" in
    [A-Za-z]:/*)
        drive="$(printf '%s' "${IMAGES_HOST_DIR%%:*}" | tr '[:upper:]' '[:lower:]')"
        rest="${IMAGES_HOST_DIR#?:/}"
        mkdir -p "/$drive/$rest" 2>/dev/null \
            || mkdir -p "/mnt/$drive/$rest" 2>/dev/null \
            || mkdir -p "$IMAGES_HOST_DIR"
        ;;
    *)
        mkdir -p "$IMAGES_HOST_DIR"
        ;;
esac
echo "✓ /images 将映射到：$IMAGES_HOST_DIR"
echo ""

# 启动 Docker Compose
echo "🐳 启动 Docker 容器..."
echo ""
cd "$SCRIPT_DIR"
if [ -f "$CONFIG_FILE" ]; then
    docker-compose --env-file "$CONFIG_FILE" up --build
else
    docker-compose up --build
fi

echo ""
echo "========================================"
echo "应用已停止"
echo "========================================"
