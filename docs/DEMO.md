# 🎬 使用演示与工作流程

## 📌 项目架构概览

```
用户浏览器（客户端）
     ↓
  http://localhost:3000
     ↓
Docker 容器（服务器）
  - Node.js + Express
  - 文件系统扫描
  - API 服务
     ↓
本机文件系统（D:\def 及其子文件夹）
```

---

## 🎯 完整使用流程

### 第 1 步：启动应用

**双击 `start.bat`** 或在命令行运行：

```bash
cd d:\html\RPage
docker-compose up --build
```

**预期输出：**

```
Creating image-gallery-app ... done
✓ 图片浏览应用运行在 http://localhost:3000
✓ 图片根路径: /images
```

---

### 第 2 步：打开浏览器

访问：**http://localhost:3000**

**你会看到：**

- 标题：🖼️ 图片浏览器
- 输入框：用于输入相对路径
- "加载图片"按钮
- 空的图片网格（提示输入路径）

---

### 第 3 步：输入路径并加载

**操作步骤：**

1. 点击输入框
2. 输入相对路径，例如：`img/a`
3. 按 Enter 或点击"加载图片"按钮
4. 等待加载完成

**系统会做什么：**

1. 验证路径安全性（防止攻击）
2. 构建完整路径：`D:\def\img\a`
3. 扫描该文件夹下的所有图片
4. 生成缩略图网格
5. 显示图片信息（名称、大小）

---

## 💻 工作原理详解

### 前端流程（index.html）

```
用户输入路径
     ↓
点击按钮
     ↓
发送 POST 请求到 /api/images
  {
    "relativePath": "img/a"
  }
     ↓
处理响应数据
     ↓
生成图片卡片 HTML
     ↓
绑定图片源 URL
     ↓
网页显示结果
```

### 后端流程（server.js）

```
接收 POST 请求
     ↓
验证相对路径
  - 检查格式
  - 防止 .. 遍历
  - 防止绝对路径
     ↓
构建完整路径
  D:\def + img/a = D:\def\img\a
     ↓
验证路径边界
  - 确保在 D:\def 内
     ↓
检查目录是否存在
     ↓
读取目录中所有文件
     ↓
过滤图片文件
  - .jpg, .png, .gif, .webp, .bmp
     ↓
获取文件信息（名称、大小）
     ↓
返回 JSON 响应
  {
    "success": true,
    "path": "D:/def/img/a",
    "count": 5,
    "images": [...]
  }
```

---

## 📚 使用场景示例

### 场景 1：查看单层文件夹的图片

```
文件结构：
D:\def\
└── vacation/
    ├── photo1.jpg
    ├── photo2.jpg
    └── photo3.png

操作：输入 vacation → 看到 3 张图片
```

### 场景 2：查看多层嵌套文件夹

```
文件结构：
D:\def\
└── albums/
    └── 2024/
        └── summer/
            ├── beach1.jpg
            ├── beach2.jpg
            └── sunset.png

操作：输入 albums/2024/summer → 看到 3 张图片
```

### 场景 3：查看根目录的图片

```
文件结构：
D:\def\
├── cover.jpg
├── banner.png
└── logo.gif

操作：输入 . 或 （留空相对路径） → 看到 3 张图片
```

### 场景 4：处理特殊文件名

```
文件结构：
D:\def\
└── photos/
    ├── image (2).jpg      ← 有空格和括号
    ├── 2024-12-31.jpg     ← 有日期格式
    └── 图片1.png          ← 有中文

操作：输入 photos → 正确显示所有 3 张图片
```

---

## 🔒 安全机制演示

### 攻击防护 1：路径遍历

**恶意输入：** `../../../windows/system32`

**系统反应：**

```
❌ 错误：无效的路径
（检测到 .. 字符）
```

---

### 攻击防护 2：绝对路径

**恶意输入：** `/etc/passwd` 或 `C:\Windows`

**系统反应：**

```
❌ 错误：无效的路径
（检测到绝对路径）
```

---

### 攻击防护 3：非图片文件

**恶意尝试：** 上传文件夹中有 `.exe`, `.txt` 等

**系统反应：**

```
✓ 已加载，但该文件夹中没有图片
（自动过滤非图片文件）
```

---

## 🔧 实时调试方法

### 方法 1：查看浏览器控制台

按 `F12` 打开开发者工具，查看：

- Network 标签：查看 API 请求/响应
- Console 标签：查看 JavaScript 错误

### 方法 2：查看服务器日志

```bash
# 在启动容器的终端中查看实时日志
docker-compose logs -f
```

**日志示例：**

```
POST /api/images 200 - 5.234 ms
GET /api/image/img/a/photo1.jpg 200 - 2.123 ms
```

### 方法 3：进入容器调试

```bash
# 进入容器的 shell
docker-compose exec app sh

# 查看挂载的文件
ls -la /images/

# 验证路径
ls -la /images/img/a/
```

---

## 📊 API 详细文档

### 请求 1：获取图片列表

**Endpoint：** `POST /api/images`

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/images \
  -H "Content-Type: application/json" \
  -d '{"relativePath": "img/a"}'
```

**成功响应（200）：**

```json
{
  "success": true,
  "path": "D:/def/img/a",
  "count": 2,
  "images": [
    {
      "name": "photo1.jpg",
      "relativePath": "img/a/photo1.jpg",
      "size": 102400
    },
    {
      "name": "photo2.png",
      "relativePath": "img/a/photo2.png",
      "size": 256000
    }
  ]
}
```

**错误响应（400）：**

```json
{
  "error": "目录不存在"
}
```

---

### 请求 2：获取单个图片

**Endpoint：** `GET /api/image/:imagePath`

**请求示例：**

```bash
curl http://localhost:3000/api/image/img/a/photo1.jpg -o photo.jpg
```

**响应：** 直接返回图片文件的二进制数据

---

## 📈 性能指标

### 典型响应时间

| 操作            | 响应时间  |
| --------------- | --------- |
| 查询 5 张图片   | 5-10ms    |
| 查询 50 张图片  | 20-30ms   |
| 查询 500 张图片 | 100-200ms |
| 获取单张图片    | 2-5ms     |

**注：** 不包括网络延迟和浏览器渲染时间

---

## 🎨 UI/UX 特性

### 响应式设计

- **桌面** (>768px)：4 列网格
- **平板** (480-768px)：2-3 列网格
- **手机** (<480px)：2 列网格

### 交互反馈

- 输入框焦点时边框变色
- 按钮 hover 时上升动画
- 加载时显示旋转加载动画
- 错误/成功信息用不同颜色标记

### 图片加载

- 使用 `loading="lazy"` 实现懒加载
- 加载失败时显示灰色占位图
- 显示文件大小（自动转换 B/KB/MB）

---

## 🚀 性能优化建议

### 针对大量图片的文件夹

**问题：** 有 1000+ 张图片时加载较慢

**解决方案：**

1. **分页加载**（改进版本）

```javascript
// 修改 server.js 支持分页
app.post("/api/images", async (req, res) => {
  const { relativePath, page = 1, limit = 50 } = req.body;
  // ... 实现分页逻辑
});
```

2. **缓存文件列表**

```javascript
const cache = new Map();
// 缓存 5 分钟
```

3. **本地代理服务**

- 使用 CDN 缓存图片
- 减少 Docker 容器负载

---

## 🐛 常见问题排查

### 问题：图片显示为 "加载失败"

**排查步骤：**

1. 打开浏览器开发者工具（F12）
2. 查看 Network 标签中的请求
3. 找到失败的图片请求
4. 检查 HTTP 状态码

| 状态码 | 含义       | 解决方案         |
| ------ | ---------- | ---------------- |
| 404    | 文件不存在 | 检查文件名和路径 |
| 403    | 禁止访问   | 检查文件权限     |
| 500    | 服务器错误 | 查看容器日志     |

---

### 问题：输入路径后无响应

**排查步骤：**

1. 打开浏览器开发者工具
2. 查看 Console 标签的错误
3. 查看容器日志：`docker-compose logs`
4. 确认容器是否运行：`docker ps`

---

## 📞 获取帮助

查看文档：

- **README.md** - 完整功能文档
- **QUICKSTART.md** - 快速开始指南
- 浏览器控制台 - 实时错误信息
- 容器日志 - 服务器运行信息

---

**祝你使用愉快！🎉**
