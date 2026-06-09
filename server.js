
// 引入各种模块和库
import express, { json } from 'express';                     // Express 框架
import { normalize, isAbsolute, join, extname } from 'path'; //路径模块
import { promises as fs } from 'fs';                         //文件系统模块的 Promise 版本
import cors from 'cors';                                     // CORS 中间件


const app = express();        // 创建 Express 应用
const PORT = 3000;            // 定义服务器端口
const IMAGE_ROOT = '/images'; // 在Docker中映射的卷路径

// 支持的图片扩展名
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

app.use(cors()); // 启用 CORS 中间件，允许跨域请求
app.use(json()); // 解析 JSON 请求体

/**
 * POST /api/images
 * 获取指定相对路径下的所有图片
 * 请求体: { relativePath: "img/a" }
 */
app.post('/api/images', async (req, res) => {
    try {
        const { relativePath } = req.body;

        if (!relativePath || typeof relativePath !== 'string') {
            return res.status(400).json({ error: '请提供有效的相对路径' });
        }

        // 防止路径遍历攻击
        const normalizedPath = normalize(relativePath);
        if (normalizedPath.startsWith('..') || isAbsolute(normalizedPath)) {
            return res.status(403).json({ error: '无效的路径' });
        }

        // 构建完整路径
        const fullPath = join(IMAGE_ROOT, normalizedPath);

        // 确保路径在IMAGE_ROOT内
        if (!fullPath.startsWith(IMAGE_ROOT)) {
            return res.status(403).json({ error: '路径超出允许范围' });
        }

        // 检查目录是否存在
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: '路径不是目录' });
        }

        // 读取目录中的所有文件
        const files = await fs.readdir(fullPath);

        // 过滤出图片文件
        const images = [];
        for (const file of files) {
            const ext = extname(file).toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
                const filePath = join(fullPath, file);
                const fileStats = await fs.stat(filePath);
                if (fileStats.isFile()) {
                    images.push({
                        name: file,
                        relativePath: join(normalizedPath, file).replace(/\\/g, '/'),
                        size: fileStats.size,
                    });
                }
            }
        }

        res.json({
            success: true,
            path: fullPath.replace(/\\/g, '/'),
            count: images.length,
            images: images.sort((a, b) => a.name.localeCompare(b.name)),
        });
    } catch (error) {
        console.error('Error:', error);
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: '目录不存在' });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/image/:imagePath
 * 获取图片文件
 */
app.get('/api/image/:imagePath(*)', async (req, res) => {
    try {
        const imagePath = req.params.imagePath;

        // 防止路径遍历攻击
        const normalizedPath = normalize(imagePath);
        if (normalizedPath.startsWith('..') || isAbsolute(normalizedPath)) {
            return res.status(403).json({ error: '无效的路径' });
        }

        const fullPath = join(IMAGE_ROOT, normalizedPath);

        // 确保路径在IMAGE_ROOT内
        if (!fullPath.startsWith(IMAGE_ROOT)) {
            return res.status(403).json({ error: '路径超出允许范围' });
        }

        // 检查文件是否存在且是文件
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) {
            return res.status(404).json({ error: '文件不存在' });
        }

        // 验证是否是支持的图片格式
        const ext = extname(fullPath).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
            return res.status(403).json({ error: '不支持的文件类型' });
        }

        res.sendFile(fullPath);
    } catch (error) {
        console.error('Error:', error);
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: '文件不存在' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✓ 图片浏览应用运行在 http://localhost:${PORT}`);
    console.log(`✓ 图片根路径: ${IMAGE_ROOT}`);
});
