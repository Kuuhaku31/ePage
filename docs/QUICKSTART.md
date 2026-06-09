# 🚀 快速启动指南

## ⚡ 30 秒快速开始

### Windows 用户

**方式 1：双击启动脚本（推荐）**

```
双击 start.bat 文件
```

**方式 2：手动命令**

```powershell
cd d:\html\RPage
docker-compose up --build
```

### Mac/Linux 用户

```bash
cd d/html/RPage
bash start.sh
```

---

## 📝 首次使用步骤

### 1️⃣ 启动应用

运行上述命令之一后，容器会自动启动

```
✓ 图片浏览应用运行在 http://localhost:3000
✓ 图片根路径: /images
```

### 2️⃣ 打开浏览器

访问：`http://localhost:3000`

### 3️⃣ 输入路径并加载图片

**示例操作流程：**

| 步骤 | 操作                     | 说明                     |
| ---- | ------------------------ | ------------------------ |
| 1    | 在输入框输入 `img/a`     | 访问 D:\def\img\a 文件夹 |
| 2    | 点击"加载图片"或按 Enter | 获取该文件夹中的所有图片 |
| 3    | 查看网格显示的图片       | 显示图片名称和文件大小   |

---

## 🎯 常见场景

### 场景 1：查看特定文件夹的图片

```
输入路径：photos/2024/summer
访问位置：D:\def\photos\2024\summer
```

### 场景 2：浏览根目录的图片

```
输入路径：.
访问位置：D:\def\
```

### 场景 3：查看嵌套文件夹

```
输入路径：archive/old/albums/family
访问位置：D:\def\archive\old\albums\family
```

---

## 🛑 停止应用

- **Ctrl + C** 在终端中停止容器
- 或运行：`docker-compose down`

---

## 🔄 重新启动应用

```bash
cd d:\html\RPage
docker-compose restart
```

---

## 🖼️ 添加测试图片

### Windows PowerShell

```powershell
# 创建测试图片（使用在线图片）
$path = "D:\def\img\a"
mkdir $path -Force

# 下载示例图片
Invoke-WebRequest -Uri "https://via.placeholder.com/400" `
  -OutFile "$path\test-image-1.jpg"
```

### 或手动操作

1. 打开 `D:\def\img\a` 文件夹
2. 复制你的图片文件到该文件夹
3. 在应用中输入 `img/a` 并加载

---

## ⚙️ 修改存储路径

如需改变图片存储位置（默认 D:\def）：

1. 打开 `docker-compose.yml`
2. 修改 `volumes` 部分：

```yaml
volumes:
  - E:/MyPictures:/images # 改为你的路径
```

3. 重新启动容器

---

## 🆘 常见问题

### ❓ "无法连接到 localhost:3000"

**解决方案：**

- 检查容器是否运行：`docker ps`
- 查看错误日志：`docker-compose logs`
- 确保端口 3000 未被占用

### ❓ "目录不存在" 错误

**解决方案：**

- 确认文件夹确实存在
- 检查路径拼写（区分大小写）
- 示例：`img/a` 不是 `Img/A`

### ❓ 图片无法加载显示 "加载失败"

**解决方案：**

- 确认是支持的格式（jpg, png, gif, webp, bmp）
- 检查文件权限
- 查看浏览器开发者工具（F12）的错误消息

### ❓ 如何更改网页打开的端口（不是 3000）？

**解决方案：**
编辑 `docker-compose.yml`：

```yaml
ports:
  - "8080:3000" # 改为 8080，访问 http://localhost:8080
```

---

## 📊 应用架构简图

```
你的浏览器
    ↓
http://localhost:3000
    ↓
Docker 容器 (Node.js + Express)
    ↓
访问 D:\def 文件夹内的图片
    ↓
网页显示图片列表
```

---

## 📱 功能预览

✅ **输入相对路径** → 如 `img/a`, `photos`, `album/2024`

✅ **自动扫描** → 找到该文件夹下的所有图片

✅ **网格显示** → 美观的卡片式布局

✅ **显示信息** → 文件名、文件大小

✅ **响应式设计** → 适配手机、平板、电脑

✅ **安全防护** → 防止路径攻击

---

## 💡 提示

- 路径使用 `/` 分隔符，不是 `\`
- 首次启动会下载 Docker 镜像，可能需要 1-2 分钟
- 之后启动会很快（几秒钟）
- 容器内的文件改动不会保存（只有挂载的文件夹是持久的）

---

**🎉 享受你的图片浏览体验！**

有问题？查看完整文档：README.md
