
console.log('ePage 前端脚本已加载');

// ==================== DOM 元素 ====================
const pathInput = document.getElementById('pathInput');
const loadBtn = document.getElementById('loadBtn');
const rootBtn = document.getElementById('rootBtn');
const gallery = document.getElementById('gallery');
const status = document.getElementById('status');
const infoBar = document.getElementById('infoBar');
const pathDisplay = document.getElementById('pathDisplay');
const countDisplay = document.getElementById('countDisplay');
const pathBar = document.getElementById('pathBar');
const breadcrumb = document.getElementById('breadcrumb');
const folderPanel = document.getElementById('folderPanel');
const folderList = document.getElementById('folderList');
const folderCountDisplay = document.getElementById('folderCountDisplay');

let currentPath = '.';

// ==================== 工具函数 ====================
function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    if (type === 'loading') {
        status.innerHTML = `<div class="spinner"></div>${message}`;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function encodePathForUrl(path) {
    return path.split('/').map(encodeURIComponent).join('/');
}

function normalizeInputPath(path) {
    const normalized = path.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    return normalized || '.';
}

function getDisplayPath(path) {
    return path === '.' ? '/' : `/${path}`;
}

function getParentPath(path) {
    if (path === '.') return null;

    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return parts.length ? parts.join('/') : '.';
}

function renderBreadcrumb(path) {
    const parts = path === '.' ? [] : path.split('/').filter(Boolean);
    const items = ['<button class="breadcrumb-item" data-path=".">根目录</button>'];
    let builtPath = '';

    parts.forEach((part) => {
        builtPath = builtPath ? `${builtPath}/${part}` : part;
        items.push('<span class="breadcrumb-separator">/</span>');
        items.push(`<button class="breadcrumb-item" data-path="${escapeHTML(builtPath)}">${escapeHTML(part)}</button>`);
    });

    breadcrumb.innerHTML = items.join('');
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach((button) => {
        button.addEventListener('click', () => loadDirectory(button.dataset.path));
    });
    pathBar.style.display = 'flex';
}

function renderFolders(folders, path) {
    const parentPath = getParentPath(path);
    const folderItems = [];

    if (parentPath) {
        folderItems.push(`
            <button class="folder-item parent-folder" data-path="${escapeHTML(parentPath)}">
                <span class="folder-icon">↑</span>
                <span class="folder-name">返回上一级</span>
            </button>
        `);
    }

    folderItems.push(...folders.map((folder) => `
        <button class="folder-item" data-path="${escapeHTML(folder.relativePath)}" title="${escapeHTML(folder.name)}">
            <span class="folder-icon">📁</span>
            <span class="folder-name">${escapeHTML(folder.name)}</span>
        </button>
    `));

    folderList.innerHTML = folderItems.length
        ? folderItems.join('')
        : '<div class="folder-empty">当前目录没有子文件夹</div>';

    folderList.querySelectorAll('.folder-item').forEach((button) => {
        button.addEventListener('click', () => loadDirectory(button.dataset.path));
    });

    folderCountDisplay.textContent = folders.length;
    folderPanel.style.display = 'block';
}

// ==================== 图片卡片 HTML 生成 ====================
function generateImageCard(img, index) {
    const imageUrl = `/api/image/${encodePathForUrl(img.relativePath)}`;
    const imageName = escapeHTML(img.name);

    return `
    <div class="image-card" data-index="${index}">
      <div class="image-wrapper">
        <img 
          src="${imageUrl}"
          alt="${imageName}"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3E加载失败%3C/text%3E%3C/svg%3E'"
        >
        <div class="card-overlay">
          <span>📖 阅读从第 ${index + 1} 页</span>
        </div>
      </div>
      <div class="image-info">
        <div class="image-name" title="${imageName}">第 ${index + 1} 页</div>
        <div class="image-size">${formatFileSize(img.size)}</div>
      </div>
    </div>
  `;
}

function attachCardClickListeners() {
    document.querySelectorAll('.image-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            enterReader(index);
        });
    });
}

// ==================== 阅读器导航 ====================
function enterReader(startIndex) {
    // 保存当前数据到 sessionStorage
    sessionStorage.setItem('mangaPath', currentPath);
    sessionStorage.setItem('mangaImages', JSON.stringify(gallery.mangaImages));
    sessionStorage.setItem('startIndex', startIndex);
    sessionStorage.setItem('restorePathOnIndexLoad', '1');

    // 进入阅读器
    window.location.href = '/reader.html';
}

// ==================== 空状态 HTML ====================
function getEmptyStateHTML() {
    return `
    <div class="empty-state" style="grid-column: 1/-1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <p>当前目录暂无图片文件</p>
    </div>
  `;
}

function getErrorStateHTML() {
    return `
    <div class="empty-state" style="grid-column: 1/-1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>加载失败</p>
    </div>
  `;
}

// ==================== 加载目录 ====================
async function loadDirectory(path = pathInput.value) {
    const relativePath = normalizeInputPath(path);

    showStatus('正在加载目录...', 'loading');
    gallery.innerHTML = '';
    infoBar.style.display = 'none';
    folderPanel.style.display = 'none';
    pathBar.style.display = 'none';

    try{
        const response = await fetch('/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ relativePath }),
        });

        if(!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '加载失败');
        }

        const data = await response.json();
        currentPath = data.relativePath || relativePath;
        pathInput.value = currentPath;

        if(data.count === 0) {
            gallery.innerHTML = getEmptyStateHTML();
        } else {
            const imageHTML = data.images.map((img, index) => generateImageCard(img, index)).join('');

            gallery.innerHTML = imageHTML;

            // 为每张卡片添加点击事件
            attachCardClickListeners();
        }

        gallery.mangaImages = data.images;
        sessionStorage.setItem('mangaPath', currentPath);
        sessionStorage.setItem('mangaImages', JSON.stringify(data.images));

        renderBreadcrumb(currentPath);
        renderFolders(data.folders || [], currentPath);

        const folderCount = data.folderCount || 0;
        showStatus(`✓ ${getDisplayPath(currentPath)}：${folderCount} 个文件夹，${data.count} 页漫画`, 'success');
        pathDisplay.textContent = getDisplayPath(currentPath);
        countDisplay.textContent = data.count;
        infoBar.style.display = 'flex';
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
        gallery.innerHTML = getErrorStateHTML();
    }
}

// ==================== 恢复之前的状态 ====================
function restorePreviousState() {
    const shouldRestorePath = sessionStorage.getItem('restorePathOnIndexLoad') === '1';
    const savedPath = shouldRestorePath ? sessionStorage.getItem('mangaPath') : null;

    sessionStorage.removeItem('restorePathOnIndexLoad');
    loadDirectory(savedPath || '.');
    pathInput.focus();
}

// ==================== 事件绑定 ====================
loadBtn.addEventListener('click', () => loadDirectory());
rootBtn.addEventListener('click', () => loadDirectory('.'));
pathInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadDirectory(); });

// 页面加载时恢复之前的状态
window.addEventListener('load', restorePreviousState);
