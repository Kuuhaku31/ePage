
// 引入各种模块和库
import express, { json } from 'express';                     // Express 框架
import { dirname, normalize, isAbsolute, join, extname, resolve, relative, sep } from 'path'; //路径模块
import { promises as fs, readFileSync } from 'fs';           //文件系统模块的 Promise 版本
import { fileURLToPath } from 'url';
import cors from 'cors';                                     // CORS 中间件


const APP_DIR = dirname(fileURLToPath(import.meta.url));
const CONFIG = readConfigEnv(join(APP_DIR, 'config.env'));
const app = express();        // 创建 Express 应用
const PORT = Number(process.env.PORT || CONFIG.PORT || 3000); // 定义服务器端口
const HOST = process.env.HOST || CONFIG.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const IMAGE_ROOT = resolve(
    process.env.IMAGE_ROOT
    || process.env.IMAGES_HOST_DIR
    || CONFIG.IMAGE_ROOT
    || CONFIG.IMAGES_HOST_DIR
    || '/images',
); // Docker 默认为 /images，本地运行可读取 config.env

// 支持的图片扩展名
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const FOLDER_MARKER_FILE = '.epage-mark';

app.use(cors()); // 启用 CORS 中间件，允许跨域请求
app.use(json()); // 解析 JSON 请求体
app.use(express.static(join(APP_DIR, 'public'))); // 提供首页和前端静态资源

function readConfigEnv(configPath) {
    try {
        const values = {};
        const lines = readFileSync(configPath, 'utf8').split(/\r?\n/);
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            const separatorIndex = trimmedLine.indexOf('=');
            if (separatorIndex === -1) {
                continue;
            }

            const key = trimmedLine.slice(0, separatorIndex).trim();
            let value = trimmedLine.slice(separatorIndex + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"'))
                || (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            values[key] = value;
        }
        return values;
    } catch {
        return {};
    }
}

function normalizeRelativePath(input) {
    const rawPath = typeof input === 'string' ? input.trim() : '.';
    const normalizedPath = normalize(rawPath || '.');
    if (normalizedPath.startsWith('..') || isAbsolute(normalizedPath)) {
        return null;
    }
    return normalizedPath;
}

function resolveImagePath(normalizedPath) {
    const fullPath = resolve(IMAGE_ROOT, normalizedPath);
    const pathFromRoot = relative(IMAGE_ROOT, fullPath);
    if (
        pathFromRoot
        && (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot))
    ) {
        return null;
    }
    return fullPath;
}

async function resolveMarkerDirectory(normalizedPath) {
    const fullPath = resolveImagePath(normalizedPath);
    if (!fullPath) throw Object.assign(new Error('路径超出允许范围'), { status: 403 });

    // 写入前检查真实路径，避免目录符号链接跳出图片根目录。
    const [rootPath, realPath] = await Promise.all([
        fs.realpath(IMAGE_ROOT), fs.realpath(fullPath),
    ]);
    const pathFromRoot = relative(rootPath, realPath);
    if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
        throw Object.assign(new Error('路径超出允许范围'), { status: 403 });
    }
    if (!(await fs.stat(realPath)).isDirectory()) {
        throw Object.assign(new Error('路径不是目录'), { status: 400 });
    }
    return realPath;
}

async function hasFolderMarker(directory) {
    try {
        // 不跟随标记文件的符号链接，也不把同名目录识别成标记。
        return (await fs.lstat(join(directory, FOLDER_MARKER_FILE))).isFile();
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    }
}

/** PUT /api/folder-marker: { relativePath, marked: boolean } */
app.put('/api/folder-marker', async (req, res) => {
    // 文件写操作只接受本站请求，不继承读取接口的任意跨域权限。
    const origin = req.get('origin');
    let allowedOrigin = !origin;
    if (origin) {
        try {
            const originUrl = new URL(origin);
            // HTTPS 反向代理可能通过 HTTP 转发到容器，不能用 req.protocol 判断外部协议。
            allowedOrigin = ['http:', 'https:'].includes(originUrl.protocol) &&
                originUrl.host === req.get('host');
        } catch {
            allowedOrigin = false;
        }
    }
    if (req.get('sec-fetch-site') === 'cross-site' ||
        !allowedOrigin) {
        return res.status(403).json({ error: '不允许跨域修改目录标记' });
    }
    if (!req.is('application/json') || typeof req.body?.relativePath !== 'string' ||
        typeof req.body?.marked !== 'boolean') {
        return res.status(400).json({ error: '需要 relativePath 和布尔值 marked' });
    }
    const normalizedPath = normalizeRelativePath(req.body.relativePath);
    if (!normalizedPath) return res.status(403).json({ error: '无效的路径' });

    try {
        const directory = await resolveMarkerDirectory(normalizedPath);
        const markerPath = join(directory, FOLDER_MARKER_FILE);
        if (req.body.marked) {
            try {
                // wx 确保不覆盖已有文件或跟随已有符号链接。
                await fs.writeFile(markerPath, '', { flag: 'wx' });
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
                if (!await hasFolderMarker(directory)) {
                    throw Object.assign(new Error('标记路径已被目录或符号链接占用'), { status: 409 });
                }
            }
        } else {
            try {
                const stats = await fs.lstat(markerPath);
                if (!stats.isFile()) {
                    throw Object.assign(new Error('标记路径不是普通文件，拒绝删除'), { status: 409 });
                }
                await fs.unlink(markerPath);
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
            }
        }
        res.json({
            success: true, relativePath: normalizedPath.replace(/\\/g, '/'),
            marked: await hasFolderMarker(directory)
        });
    } catch (error) {
        const statusCode = error.status || (error.code === 'ENOENT' ? 404 :
            ['EACCES', 'EPERM', 'EROFS'].includes(error.code) ? 403 : 500);
        const message = error.code === 'ENOENT' ? '目录不存在' :
            ['EACCES', 'EPERM', 'EROFS'].includes(error.code) ? '目录不可写，请检查目录或挂载权限' : error.message;
        res.status(statusCode).json({ error: message });
    }
});

/**
 * POST /api/images
 * 获取指定相对路径下的文件夹和图片
 * 请求体: { relativePath: "img/a" }，空值或 "." 表示 /images 根目录
 */
app.post('/api/images', async (req, res) => {
    try {
        // 防止路径遍历攻击
        const normalizedPath = normalizeRelativePath(req.body?.relativePath);
        if (!normalizedPath) {
            return res.status(403).json({ error: '无效的路径' });
        }

        // 构建完整路径
        const fullPath = resolveImagePath(normalizedPath);

        // 确保路径在IMAGE_ROOT内
        if (!fullPath) {
            return res.status(403).json({ error: '路径超出允许范围' });
        }

        // 检查目录是否存在
        const stats = await fs.stat(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ error: '路径不是目录' });
        }

        // 读取目录中的所有文件和文件夹
        const entries = await fs.readdir(fullPath, { withFileTypes: true });

        // 过滤出文件夹和图片文件
        const folders = [];
        const images = [];
        for (const entry of entries) {
            const entryRelativePath = join(normalizedPath === '.' ? '' : normalizedPath, entry.name).replace(/\\/g, '/');

            if (entry.isDirectory()) {
                folders.push({
                    name: entry.name,
                    relativePath: entryRelativePath,
                    marked: await hasFolderMarker(join(fullPath, entry.name)),
                });
                continue;
            }

            const ext = extname(entry.name).toLowerCase();
            if (entry.isFile() && SUPPORTED_EXTENSIONS.includes(ext)) {
                const filePath = join(fullPath, entry.name);
                const fileStats = await fs.stat(filePath);
                images.push({
                    name: entry.name,
                    relativePath: entryRelativePath,
                    size: fileStats.size,
                });
            }
        }

        const currentPath = normalizedPath === '.' ? '.' : normalizedPath.replace(/\\/g, '/');

        res.json({
            success: true,
            relativePath: currentPath,
            path: fullPath.replace(/\\/g, '/'),
            marked: await hasFolderMarker(fullPath),
            folderCount: folders.length,
            count: images.length,
            folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
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
        // 防止路径遍历攻击
        const normalizedPath = normalizeRelativePath(req.params.imagePath);
        if (!normalizedPath) {
            return res.status(403).json({ error: '无效的路径' });
        }

        const fullPath = resolveImagePath(normalizedPath);

        // 确保路径在IMAGE_ROOT内
        if (!fullPath) {
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

app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`✓ 图片浏览应用运行在 http://${displayHost}:${PORT}`);
    console.log(`✓ 图片根路径: ${IMAGE_ROOT}`);
});
