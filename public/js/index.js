// ==================== DOM 元素 ====================
const pathInput = document.getElementById('pathInput');
const loadBtn = document.getElementById('loadBtn');
const gallery = document.getElementById('gallery');
const status = document.getElementById('status');
const infoBar = document.getElementById('infoBar');
const pathDisplay = document.getElementById('pathDisplay');
const countDisplay = document.getElementById('countDisplay');

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

// ==================== 图片卡片 HTML 生成 ====================
function generateImageCard(img, index) {
    return `
    <div class="image-card" data-index="${index}">
      <div class="image-wrapper">
        <img 
          src="/api/image/${img.relativePath}" 
          alt="${img.name}"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3E加载失败%3C/text%3E%3C/svg%3E'"
        >
        <div class="card-overlay">
          <span>📖 阅读从第 ${index + 1} 页</span>
        </div>
      </div>
      <div class="image-info">
        <div class="image-name" title="${img.name}">第 ${index + 1} 页</div>
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
    sessionStorage.setItem('mangaPath', pathInput.value.trim());
    sessionStorage.setItem('mangaImages', JSON.stringify(gallery.mangaImages));
    sessionStorage.setItem('startIndex', startIndex);

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
      <p>该文件夹中暂无图片文件</p>
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

// ==================== 加载图片 ====================
async function loadImages() {
    const relativePath = pathInput.value.trim();

    if (!relativePath) {
        showStatus('❌ 请输入文件夹路径', 'error');
        return;
    }

    showStatus('正在加载漫画...', 'loading');
    gallery.innerHTML = '';
    infoBar.style.display = 'none';

    try {
        const response = await fetch('/api/images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ relativePath }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '加载失败');
        }

        const data = await response.json();

        if (data.count === 0) {
            showStatus(`✓ 已加载，但该文件夹中没有漫画`, 'success');
            gallery.innerHTML = getEmptyStateHTML();
        } else {
            showStatus(`✓ 成功加载 ${data.count} 页漫画`, 'success');

            const imageHTML = data.images.map((img, index) => generateImageCard(img, index)).join('');

            gallery.innerHTML = imageHTML;
            gallery.mangaImages = data.images;

            // 为每张卡片添加点击事件
            attachCardClickListeners();
        }

        pathDisplay.textContent = relativePath;
        countDisplay.textContent = data.count;
        infoBar.style.display = 'flex';
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
        gallery.innerHTML = getErrorStateHTML();
    }
}

// ==================== 恢复之前的状态 ====================
function restorePreviousState() {
    const savedPath = sessionStorage.getItem('mangaPath');
    if (savedPath) {
        pathInput.value = savedPath;
        const savedImages = sessionStorage.getItem('mangaImages');
        if (savedImages) {
            // 直接显示已加载的图片，无需重新加载
            const images = JSON.parse(savedImages);
            const imageHTML = images.map((img, index) => generateImageCard(img, index)).join('');

            gallery.innerHTML = imageHTML;
            gallery.mangaImages = images;

            // 为每张卡片添加点击事件
            attachCardClickListeners();

            pathDisplay.textContent = savedPath;
            countDisplay.textContent = images.length;
            infoBar.style.display = 'flex';
            showStatus(`✓ 已加载 ${images.length} 页漫画`, 'success');
        }
    }

    pathInput.focus();
}

// ==================== 事件绑定 ====================
loadBtn.addEventListener('click', loadImages);
pathInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadImages();
    }
});

// 页面加载时恢复之前的状态
window.addEventListener('load', restorePreviousState);
