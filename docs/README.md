# 🖼️ 图片浏览器 - Docker 版本

一个基于 Docker 的网页应用，用于浏览和管理本地文件夹中的图片。

## 📋 功能特性

- ✅ 支持通过相对路径快速访问本地图片
- ✅ 安全的路径验证（防止路径遍历攻击）
- ✅ 支持多种图片格式（JPG、PNG、GIF、WebP、BMP）
- ✅ 响应式设计，支持桌面和移动设备
- ✅ 显示图片信息（文件名、文件大小）
- ✅ Docker 容器化部署

## 🚀 快速开始

### 前置要求

- Docker 已安装
- Docker Compose 已安装

### 安装步骤

1. **克隆或下载项目到本地**

```bash
cd D:\html\ePage
```

2. **配置图片存储文件夹**

编辑 `config.env`：

```env
IMAGES_HOST_DIR=D:/def/e/comic
```

启动脚本会自动创建该目录。

3. **启动 Docker 容器**

```bash
docker-compose --env-file config.env up --build
```

首次运行会自动构建镜像并启动容器。

4. **打开浏览器**

访问 `http://localhost:3000`

## 📖 使用说明

### 基本操作

1. 在输入框中输入相对路径
   - 示例：`img/a`、`photos`、`album/2024`

2. 点击"加载图片"按钮或按 Enter 键

3. 应用会显示该文件夹下的所有图片

### 路径规则

- **相对路径**：相对于 Docker 中挂载的 `/images` 目录（即 `config.env` 中的 `IMAGES_HOST_DIR`）
- **示例**：
  - `img/a` → `IMAGES_HOST_DIR\img\a`
  - `photos/2024` → `IMAGES_HOST_DIR\photos\2024`
  - `myalbum` → `IMAGES_HOST_DIR\myalbum`

### 支持的图片格式

- `.jpg`, `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.bmp`

## 🐳 Docker 配置

### config.env 说明

```env
IMAGES_HOST_DIR=D:/def/e/comic
```

- **本机路径**：`IMAGES_HOST_DIR` - 你的本地图片存储位置
- **容器路径**：`/images` - 容器内的挂载点

### 修改存储路径

如需修改本机的图片存储位置，编辑 `config.env`：

```env
IMAGES_HOST_DIR=E:/MyPictures
```

## 🔧 常用命令

```bash
# 启动容器
docker-compose --env-file config.env up

# 后台启动
docker-compose --env-file config.env up -d

# 停止容器
docker-compose --env-file config.env down

# 查看日志
docker-compose logs -f

# 重新构建镜像
docker-compose --env-file config.env up --build
```

## 🔒 安全特性

- ✅ 路径遍历攻击防护（验证所有输入路径）
- ✅ 文件类型验证（只允许图片格式）
- ✅ 路径边界检查（确保访问在允许的目录内）

## 📁 项目结构

```
ePage/
├── config.env              # Docker /images 映射目录配置
├── Dockerfile              # Docker 镜像定义
├── docker-compose.yml      # Docker Compose 配置
├── package.json            # Node.js 依赖
├── server.js               # Express 后端服务器
├── public/
│   ├── index.html          # 前端网页（图片库）
│   ├── reader.html         # 漫画阅读器 HTML
│   ├── css/
│   │   └── reader.css      # 漫画阅读器样式
│   └── js/
│       └── reader.js       # 漫画阅读器逻辑
├── docs/                   # 文档目录
│   ├── READING_DIRECTION.md    # 阅读方向功能说明
│   ├── CACHE_TIPS.md           # 缓存常见问题
│   ├── QUICKSTART.md           # 快速开始指南
│   ├── FEATURE_DEMO.md         # 功能演示
│   ├── MANGA_GUIDE.md          # 漫画阅读器使用指南
│   ├── PROJECT_COMPLETION.md   # 项目完成说明
│   ├── DEMO.md                 # 演示
│   └── ...其他文档
├── .dockerignore            # Docker 构建忽略文件
└── .gitignore              # Git 忽略文件
```

## 🛠️ 技术栈

- **后端**：Node.js + Express
- **前端**：HTML5 + CSS3 + JavaScript
- **部署**：Docker + Docker Compose

## 💡 常见问题

### Q: 如何访问深层目录的图片？

A: 使用路径分隔符 `/`，如 `photos/2024/summer`

### Q: 图片无法加载？

A:

1. 检查文件夹路径是否正确
2. 确认文件格式是支持的图片格式
3. 查看容器日志：`docker-compose logs`

### Q: 如何修改端口？

A: 编辑 `docker-compose.yml`：

```yaml
ports:
  - "8080:3000" # 改为 8080
```

### Q: Windows 路径格式问题？

A: `config.env` 支持 Windows 路径格式（如 `D:/def/e/comic`），Docker for Windows 会自动处理

## 📝 API 参考

### POST /api/images

获取指定路径下的图片列表

**请求**：

```json
{
  "relativePath": "img/a"
}
```

**响应**：

```json
{
  "success": true,
  "path": "/images/img/a",
  "count": 5,
  "images": [
    {
      "name": "photo1.jpg",
      "relativePath": "img/a/photo1.jpg",
      "size": 102400
    }
  ]
}
```

### GET /api/image/:imagePath

获取单个图片文件

**示例**：`/api/image/img/a/photo1.jpg`

## 🐛 调试

查看完整日志：

```bash
docker-compose logs -f app
```

进入容器调试：

```bash
docker-compose exec app sh
```

## 📄 许可证

MIT

## 👤 作者

Created with ❤️

---

**需要帮助？** 检查容器日志或查看服务器输出

## 📚 漫画阅读器功能

本项目包含完整的漫画阅读器，支持以下功能：

### 核心功能

- **双页显示**：默认并排显示两页漫画
- **单页模式**：可切换为单页显示（按 `M` 键切换）
- **双向阅读**：支持从左到右 (LTR) 和从右到左 (RTL) 两种阅读模式
  - 从右向左（RTL）：日本漫画标准模式（默认）
  - 从左到右（LTR）：欧美漫画模式
- **灵活的翻页**：支持多种翻页方式

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `←` / `A` | 翻页（根据阅读方向） |
| `→` / `D` | 翻页（根据阅读方向） |
| `↑` | 向前进（阅读方向） |
| `↓` | 向后退（阅读方向） |
| `R` | 切换阅读方向（LTR/RTL） |
| `M` | 切换单页/双页显示 |
| `F` | 全屏模式 |
| `Esc` | 返回首页 |

### 项目开发

- **前端框架**：原生 JavaScript（无依赖）
- **文件组织**：
  - `public/reader.html` - HTML 结构
  - `public/css/reader.css` - 样式表
  - `public/js/reader.js` - 交互逻辑
- **会话管理**：使用浏览器 SessionStorage 保存阅读状态和偏好设置

### 文档位置

详细文档请查看 `docs/` 文件夹：
- 阅读方向功能：`docs/READING_DIRECTION.md`
- 缓存常见问题：`docs/CACHE_TIPS.md`
- 使用指南：`docs/MANGA_GUIDE.md`
