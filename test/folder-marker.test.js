import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';

test('目录标记 API：持久化、扫描、幂等及路径安全', { timeout: 20000 }, async (t) => {
    const temp = await fs.mkdtemp(join(tmpdir(), 'epage-marker-'));
    const root = join(temp, 'images');
    const chapter = join(root, '漫画 第一章');
    await fs.mkdir(chapter, { recursive: true });
    await fs.writeFile(join(chapter, 'page.jpg'), 'test image');
    const portServer = createServer();
    portServer.listen(0, '127.0.0.1');
    await once(portServer, 'listening');
    const port = portServer.address().port;
    await new Promise((resolve, reject) => portServer.close(error => error ? reject(error) : resolve()));
    const server = spawn(process.execPath, [fileURLToPath(new URL('../server.js', import.meta.url))], {
        env: { ...process.env, IMAGE_ROOT: root, HOST: '127.0.0.1', PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    t.after(async () => {
        if (server.exitCode === null) {
            const exited = once(server, 'exit');
            server.kill();
            await exited;
        }
        await fs.rm(temp, { recursive: true, force: true });
    });
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('服务启动超时')), 10000);
        server.once('error', error => { clearTimeout(timer); reject(error); });
        server.once('exit', code => { clearTimeout(timer); reject(new Error(`服务退出：${code}`)); });
        server.stdout.on('data', chunk => {
            if (chunk.toString().includes('图片浏览应用运行在')) { clearTimeout(timer); resolve(); }
        });
    });
    const base = `http://127.0.0.1:${port}`;
    async function request(path, body, method = 'POST', headers = {}) {
        const response = await fetch(`${base}${path}`, {
            method, headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body),
        });
        return { status: response.status, data: await response.json() };
    }
    const mark = (relativePath, marked) => request('/api/folder-marker', { relativePath, marked }, 'PUT');
    const scan = relativePath => request('/api/images', { relativePath });

    await t.test('创建标记、读取当前及子目录状态，保留图片列表', async () => {
        assert.equal((await scan('.')).data.folders[0].marked, false);
        const result = await mark('漫画 第一章', true);
        assert.equal(result.status, 200);
        assert.equal(result.data.marked, true);
        assert.equal(await fs.readFile(join(chapter, '.epage-mark'), 'utf8'), '');
        assert.equal((await scan('.')).data.folders[0].marked, true);
        const data = (await scan('漫画 第一章')).data;
        assert.equal(data.marked, true);
        assert.equal(data.count, 1);
        assert.equal(data.images[0].name, 'page.jpg');
    });
    await t.test('幂等写入不覆盖文件，幂等移除不删除图片', async () => {
        await fs.writeFile(join(chapter, '.epage-mark'), 'keep');
        assert.equal((await mark('漫画 第一章', true)).status, 200);
        assert.equal(await fs.readFile(join(chapter, '.epage-mark'), 'utf8'), 'keep');
        assert.equal((await mark('漫画 第一章', false)).data.marked, false);
        assert.equal((await mark('漫画 第一章', false)).status, 200);
        assert.equal((await scan('.')).data.folders[0].marked, false);
        assert.equal(await fs.readFile(join(chapter, 'page.jpg'), 'utf8'), 'test image');
    });
    await t.test('根目录也可标记，识别外部创建和删除的标记', async () => {
        assert.equal((await mark('.', true)).data.marked, true);
        assert.equal((await scan('.')).data.marked, true);
        await fs.unlink(join(root, '.epage-mark'));
        assert.equal((await scan('.')).data.marked, false);
    });
    await t.test('拒绝遍历、绝对路径、非法参数、跨域请求及不存在目录', async () => {
        assert.equal((await mark('../outside', true)).status, 403);
        assert.equal((await mark(temp, true)).status, 403);
        assert.equal((await mark('missing', true)).status, 404);
        assert.equal((await mark('漫画 第一章/page.jpg', true)).status, 400);
        assert.equal((await mark('.', 'true')).status, 400);
        assert.equal((await request('/api/folder-marker', { marked: true }, 'PUT')).status, 400);
        assert.equal((await request('/api/folder-marker', { relativePath: '.', marked: true }, 'PUT', {
            Origin: 'https://example.com',
        })).status, 403);
        assert.equal((await request('/api/folder-marker', { relativePath: '.', marked: false }, 'PUT', {
            Origin: `https://127.0.0.1:${port}`, 'Sec-Fetch-Site': 'same-origin',
        })).status, 200);
    });
    await t.test('同名目录不能当成标记或被删除', async () => {
        await fs.mkdir(join(chapter, '.epage-mark'));
        assert.equal((await scan('漫画 第一章')).data.marked, false);
        assert.equal((await mark('漫画 第一章', true)).status, 409);
        assert.equal((await mark('漫画 第一章', false)).status, 409);
        assert.equal((await fs.stat(join(chapter, '.epage-mark'))).isDirectory(), true);
        await fs.rmdir(join(chapter, '.epage-mark'));
    });
    await t.test('目录链接不能越界写入', async () => {
        const outside = join(temp, 'outside');
        await fs.mkdir(outside);
        await fs.symlink(outside, join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
        assert.equal((await mark('escape', true)).status, 403);
        await assert.rejects(fs.stat(join(outside, '.epage-mark')), { code: 'ENOENT' });
    });
});