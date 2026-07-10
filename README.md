# ePage

本项目是一个 Docker 化的本地漫画/图片浏览器。它把宿主机图片目录挂载到容器内 `/images`，前端输入相对路径后扫描图片，并支持缩略图列表、双页阅读、单页阅读、阅读方向切换和快捷键翻页。

## 功能

- 浏览本地文件夹中的图片：`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
- 首页默认打开根目录，可浏览当前目录下的所有文件夹
- 点击文件夹自动切换目录，并刷新当前目录的图片列表
- 点击缩略图进入漫画阅读模式
- 支持双页/单页显示，默认双页
- 支持从右向左（RTL，默认）和从左到右（LTR）阅读
- 支持键盘、按钮、触摸滑动和进度条翻页
- 使用 `sessionStorage` 保存当前漫画列表、阅读页码和偏好
- 后端校验相对路径，防止路径遍历和越界访问

## 快速启动

需要先安装 Docker 和 Docker Compose。

1. 新建或编辑 `config.env`：

```env
IMAGES_HOST_DIR=D:/html/res
```

Windows 路径建议使用 `/`，不要写成 `D:\html\res`。该目录会映射到容器内的 `/images`。

2. 启动应用：

```powershell
docker-compose --env-file config.env up --build
```

也可以双击 `start.bat`。Mac/Linux 可执行：

```bash
bash start.sh
```

3. 打开浏览器：

```text
http://localhost:13000
```

4. 默认会打开根目录。可以点击文件夹切换目录，也可以输入相对路径并打开，例如：

```text
img/a
photos/2024
.
```

如果 `IMAGES_HOST_DIR=D:/html/res`，输入 `img/a` 就会读取 `D:/html/res/img/a`。

## 首页浏览

- `.` 表示根目录，也就是 `IMAGES_HOST_DIR`
- 文件夹区域会显示当前目录下的所有子文件夹
- 点击文件夹会进入该目录，并自动加载该目录下的所有图片
- 点击“根目录”可回到根目录
- 面包屑路径可快速返回上级目录

## 常用命令

```bash
# 前台启动
docker-compose --env-file config.env up --build

# 后台启动
docker-compose --env-file config.env up -d --build

# 停止
docker-compose --env-file config.env down

# 重启
docker-compose --env-file config.env restart

# 查看日志
docker-compose logs -f app

# 进入容器
docker-compose exec app sh
```

`docker-compose.yml` 当前端口映射为 `13000:3000`：宿主机访问 `13000`，容器内服务端口是 `3000`。

## 阅读操作

| 操作            | 说明                  |
| --------------- | --------------------- |
| 点击缩略图      | 从该页进入阅读模式    |
| 左右箭头按钮    | 翻页                  |
| 顶部“左/右”按钮 | 单页微调              |
| 拖动底部进度条  | 快速跳页              |
| 触摸滑动        | 移动端翻页            |
| `R`             | 切换 RTL/LTR 阅读方向 |
| `M`             | 切换单页/双页         |
| `F`             | 全屏                  |
| `Esc`           | 返回列表              |

快捷键：

| 快捷键    | 功能          |
| --------- | ------------- |
| `←` / `A` | 向左翻页      |
| `→` / `D` | 向右翻页      |
| `↑`       | 向左单页微调  |
| `↓`       | 向右单页微调  |
| `R`       | 切换阅读方向  |
| `M`       | 切换单页/双页 |
| `F`       | 全屏          |
| `Esc`     | 返回          |

RTL 模式适合日漫，LTR 模式适合从左到右阅读的漫画。阅读方向和显示模式会保存在当前浏览器标签页的 `sessionStorage` 中。

## API

### `POST /api/images`

获取指定相对路径下的文件夹和图片列表。

```json
{
  "relativePath": "img/a"
}
```

响应示例：

```json
{
  "success": true,
  "relativePath": "img/a",
  "path": "/images/img/a",
  "folderCount": 1,
  "count": 2,
  "folders": [
    {
      "name": "chapter-02",
      "relativePath": "img/a/chapter-02"
    }
  ],
  "images": [
    {
      "name": "001.jpg",
      "relativePath": "img/a/001.jpg",
      "size": 102400
    }
  ]
}
```

### `GET /api/image/:imagePath`

返回单个图片文件。

```text
/api/image/img/a/001.jpg
```

## 项目结构

```text
ePage/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── start.bat
├── start.sh
└── public/
    ├── index.html
    ├── reader.html
    ├── css/
    │   ├── index.css
    │   └── reader.css
    └── js/
        ├── index.js
        └── reader.js
```

## 常见问题

**无法访问页面**

- 确认容器已启动：`docker ps`
- 查看日志：`docker-compose logs -f app`
- 确认访问地址是 `http://localhost:13000`

**提示目录不存在**

- 确认 `config.env` 中的 `IMAGES_HOST_DIR` 存在
- 输入路径必须是相对路径，例如 `img/a`
- 不要输入绝对路径或包含 `..` 的路径

**图片加载失败**

- 确认文件扩展名在支持列表中
- 检查文件是否在 `IMAGES_HOST_DIR` 下
- 打开浏览器开发者工具查看 Network 请求状态

**修改前端后页面没变化**

- 先按 `F5` 刷新
- 仍无效时使用硬刷新：`Ctrl + Shift + R`
- 开发时可打开 DevTools，并在 Network 面板勾选 Disable cache

## 技术栈

- Node.js + Express
- 原生 HTML/CSS/JavaScript
- Docker + Docker Compose
