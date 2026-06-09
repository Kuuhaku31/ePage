// ==================== 全局变量 ====================
// 阅读器核心状态
let mangaImages = [];
let currentPageIndex = 0; // 当前索引（基于数组索引，0 开始）
let mangaPath = '';
let isRTL = true; // 默认从右向左阅读
let isSinglePageMode = false; // 默认双页显示

// 阅读方向常量
const READING_MODE = {
    LTR: 'ltr', // 从左到右
    RTL: 'rtl'  // 从右到左
};

// 页面模式常量
const PAGE_MODE = {
    SINGLE: 'single',
    DOUBLE: 'double'
};

// ==================== DOM 元素 ====================
// DOM 元素引用（在 DOMContentLoaded 前可能为 null）
const leftPageImg = document.getElementById('leftPageImg');
const rightPageImg = document.getElementById('rightPageImg');
const currentPageNum = document.getElementById('currentPageNum');
const nextPageNum = document.getElementById('nextPageNum');
const totalPages = document.getElementById('totalPages');
const mangaTitle = document.getElementById('mangaTitle');
const pageSlider = document.getElementById('pageSlider');
const sliderLabel = document.getElementById('sliderLabel');
const directionBtn = document.getElementById('directionBtn');
const directionIcon = document.getElementById('directionIcon');
const directionLabel = document.getElementById('directionLabel');
const modeBtn = document.getElementById('modeBtn');
const modeIcon = document.getElementById('modeIcon');
const modeLabel = document.getElementById('modeLabel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const backBtn = document.getElementById('backBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const pagesContainer = document.getElementById('pagesContainer');

// 注意：页面上有两个单页控制按钮，确保它们存在再绑定事件
const oneLeftBtn = document.getElementById('one_left');
const oneRightBtn = document.getElementById('one_right');

// ==================== 初始化 ====================
function init() {
    const params = new URLSearchParams(window.location.search); // 获取 URL 参数
    mangaPath = params.get('path') || sessionStorage.getItem('mangaPath');
    const imageDataStr = sessionStorage.getItem('mangaImages');
    const startIndex = parseInt(sessionStorage.getItem('startIndex')) || 0;
    const savedMode = sessionStorage.getItem('readingMode') || READING_MODE.RTL;

    if (!mangaPath || !imageDataStr) {
        alert('缺少必要参数');
        goBack();
        return;
    }

    mangaImages = JSON.parse(imageDataStr);
    // 按照文件名排序，确保正确的阅读顺序
    mangaImages.sort((a, b) => a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }));
    currentPageIndex = startIndex;
    isRTL = savedMode === READING_MODE.RTL;
    const savedPageMode = sessionStorage.getItem('pageMode') || PAGE_MODE.DOUBLE;
    isSinglePageMode = savedPageMode === PAGE_MODE.SINGLE;

    // 更新 UI 元素（存在性检查以防止 null 访问）
    if (mangaTitle) mangaTitle.textContent = mangaPath.split('/').pop();
    if (totalPages) totalPages.textContent = mangaImages.length;
    if (pageSlider) pageSlider.max = Math.ceil(mangaImages.length / 2) * 2;

    updateReadingModeUI();
    updatePageModeUI();
    updatePages();
    bindEvents();
}

// ==================== 阅读模式切换 ====================
function toggleReadingMode() {
    isRTL = !isRTL;
    sessionStorage.setItem('readingMode', isRTL ? READING_MODE.RTL : READING_MODE.LTR);
    updateReadingModeUI();
    updatePages();
}

function updateReadingModeUI() {
    if (!pagesContainer) return;
    if (isRTL) {
        pagesContainer.classList.add('rtl');
        if (directionLabel) directionLabel.textContent = '从右向左';
        if (directionIcon) directionIcon.textContent = '📖';
        if (directionBtn) directionBtn.classList.add('active');
        if (prevBtn) prevBtn.title = '下一页 (←)';
        if (nextBtn) nextBtn.title = '上一页 (→)';
    } else {
        pagesContainer.classList.remove('rtl');
        if (directionLabel) directionLabel.textContent = '从左到右';
        if (directionIcon) directionIcon.textContent = '📚';
        if (directionBtn) directionBtn.classList.remove('active');
        if (prevBtn) prevBtn.title = '上一页 (←)';
        if (nextBtn) nextBtn.title = '下一页 (→)';
    }
}

// ==================== 页面模式切换 ====================
function togglePageMode() {
    isSinglePageMode = !isSinglePageMode;
    sessionStorage.setItem('pageMode', isSinglePageMode ? PAGE_MODE.SINGLE : PAGE_MODE.DOUBLE);
    updatePageModeUI();
    updatePages();
}

function updatePageModeUI() {
    if (!pagesContainer) return;
    if (isSinglePageMode) {
        pagesContainer.classList.add('single-page');
        if (modeLabel) modeLabel.textContent = '单页';
        if (modeIcon) modeIcon.textContent = '📄';
        if (modeBtn) modeBtn.classList.add('active');
    } else {
        pagesContainer.classList.remove('single-page');
        if (modeLabel) modeLabel.textContent = '双页';
        if (modeIcon) modeIcon.textContent = '📖';
        if (modeBtn) modeBtn.classList.remove('active');
    }
}


// ==================== 页面更新 ====================
function updatePages() {
    let leftIndex, rightIndex;


    // 双页模式：显示两页
    if (isRTL) {
        // 从右向左：右侧是较小页码，左侧是较大页码
        rightIndex = currentPageIndex;
        leftIndex = currentPageIndex + 1;
    } else {
        // 从左到右：左侧是较小页码，右侧是较大页码
        leftIndex = currentPageIndex;
        rightIndex = currentPageIndex + 1;
    }

    // 更新页码显示
    // 更新页码显示（保护性检查 DOM）
    if (isSinglePageMode) {
        if (currentPageNum) currentPageNum.textContent = (Math.min(currentPageIndex, mangaImages.length - 1) + 1).toString();
        if (nextPageNum) nextPageNum.textContent = '';
    } else {
        if (currentPageNum) currentPageNum.textContent = (Math.max(0, leftIndex) + 1).toString();
        if (nextPageNum) nextPageNum.textContent = (Math.min(mangaImages.length - 1, rightIndex) + 1).toString();
    }

    // 更新滑块和标签
    updateSliderDisplay();

    // 加载图片
    loadPageImages(leftIndex, rightIndex);

    // 更新按钮状态
    updateNavButtonStates();
}

function updateSliderDisplay() {
    let displayPageNum, displayText;

    if (isSinglePageMode) {
        // 单页模式：显示当前页码
        displayPageNum = currentPageIndex + 1;
        displayText = `${displayPageNum}/${mangaImages.length}`;
    } else {
        // 双页模式
        if (isRTL) {
            // RTL 模式：从右向左翻，进度从后往前
            displayPageNum = mangaImages.length - currentPageIndex;
            const nextDisplayPage = Math.max(1, displayPageNum - 1);
            displayText = `${nextDisplayPage}-${displayPageNum}`;
        } else {
            // LTR 模式：从左向右翻，进度从前往后
            displayPageNum = currentPageIndex + 1;
            displayText = `${displayPageNum}-${Math.min(displayPageNum + 1, mangaImages.length)}`;
        }
    }

    if (pageSlider) pageSlider.value = displayPageNum;
    if (sliderLabel) sliderLabel.textContent = displayText;
}

function loadPageImages(leftIndex, rightIndex) {
    if (leftPageImg) leftPageImg.src = '';
    if (rightPageImg) rightPageImg.src = '';

    if (isSinglePageMode) {
        // 单页模式：只显示左侧页面（或基于RTL的页面）
        if (leftIndex >= 0 && leftIndex < mangaImages.length && leftPageImg) {
            if (pagesContainer) pagesContainer.classList.add('loading');
            const imgPath = mangaImages[leftIndex].relativePath;
            leftPageImg.onload = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            leftPageImg.onerror = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            leftPageImg.src = `/api/image/${imgPath}`;
        }

        if (rightIndex >= 0 && rightIndex < mangaImages.length && rightPageImg) {
            if (pagesContainer) pagesContainer.classList.add('loading');
            const imgPath = mangaImages[rightIndex].relativePath;
            rightPageImg.onload = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            rightPageImg.onerror = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            rightPageImg.src = `/api/image/${imgPath}`;
        } else if (rightPageImg) {
            rightPageImg.src = '';
        }
    } else {
        // 双页模式
        if (leftIndex >= 0 && leftIndex < mangaImages.length && leftPageImg) {
            if (pagesContainer) pagesContainer.classList.add('loading');
            const imgPath = mangaImages[leftIndex].relativePath;
            leftPageImg.onload = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            leftPageImg.onerror = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            leftPageImg.src = `/api/image/${imgPath}`;
        }

        if (rightIndex >= 0 && rightIndex < mangaImages.length && rightPageImg) {
            if (pagesContainer) pagesContainer.classList.add('loading');
            const imgPath = mangaImages[rightIndex].relativePath;
            rightPageImg.onload = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            rightPageImg.onerror = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
            rightPageImg.src = `/api/image/${imgPath}`;
        } else if (rightPageImg) {
            rightPageImg.src = '';
        }
    }
}

function updateNavButtonStates() {
    if (isSinglePageMode) {
        // 单页模式：每次翻页 1 页
        if (prevBtn) prevBtn.disabled = currentPageIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentPageIndex >= mangaImages.length - 1;
    } else {
        // 双页模式：每次翻页 2 页
        if (isRTL) {
            // RTL 模式：上一页和下一页方向相反
            if (prevBtn) prevBtn.disabled = currentPageIndex >= mangaImages.length - 2;
            if (nextBtn) nextBtn.disabled = currentPageIndex <= 0;
        } else {
            // LTR 模式：正常方向
            if (prevBtn) prevBtn.disabled = currentPageIndex <= 0;
            if (nextBtn) nextBtn.disabled = currentPageIndex >= mangaImages.length - 2;
        }
    }
}

// ==================== 翻页函数 ====================
function prevPage() {
    if (isSinglePageMode) {
        // 单页模式：每次减少 1
        if (currentPageIndex > 0) {
            currentPageIndex -= 1;
            updatePages();
        }
    } else {
        // 双页模式
        if (isRTL) {
            // RTL：← 向前翻（下一页）
            if (currentPageIndex + 2 < mangaImages.length) {
                currentPageIndex += 2;
                updatePages();
            } else if (currentPageIndex + 1 < mangaImages.length) {
                currentPageIndex = mangaImages.length - 1;
                updatePages();
            }
        } else {
            // LTR：← 向前翻（上一页）
            if (currentPageIndex >= 2) {
                currentPageIndex -= 2;
                updatePages();
            }
        }
    }
}

function nextPage() {
    if (isSinglePageMode) {
        // 单页模式：每次增加 1
        if (currentPageIndex < mangaImages.length - 1) {
            currentPageIndex += 1;
            updatePages();
        }
    } else {
        // 双页模式
        if (isRTL) {
            // RTL：→ 向后翻（上一页）
            if (currentPageIndex >= 2) {
                currentPageIndex -= 2;
                updatePages();
            }
        } else {
            // LTR：→ 向后翻（下一页）
            if (currentPageIndex + 2 < mangaImages.length) {
                currentPageIndex += 2;
                updatePages();
            } else if (currentPageIndex + 1 < mangaImages.length) {
                currentPageIndex = mangaImages.length - 1;
                updatePages();
            }
        }
    }
}

// 向当前阅读方向前进一页（用于向上箭头）
function pageForward() {
    // 单页模式：每次减少 1
    if (currentPageIndex > 0) {
        currentPageIndex -= 1;
        updatePages();
    }
}

// 向当前阅读方向后退一页（用于向下箭头）
function pageBackward() {
    // 单页模式：每次增加 1
    if (currentPageIndex < mangaImages.length - 1) {
        currentPageIndex += 1;
        updatePages();
    }
}

function goToPage(pageNum) {
    let index;

    if (isRTL) {
        // RTL 模式：页码从后往前计算
        index = Math.max(0, mangaImages.length - pageNum);
    } else {
        // LTR 模式：页码从前往后计算
        index = Math.max(0, pageNum - 1);
    }

    currentPageIndex = Math.floor(index / 2) * 2;
    updatePages();
}

function goBack() {
    sessionStorage.setItem('mangaPath', mangaPath);
    sessionStorage.setItem('mangaImages', JSON.stringify(mangaImages));
    sessionStorage.setItem('startIndex', currentPageIndex);
    sessionStorage.setItem('readingMode', isRTL ? READING_MODE.RTL : READING_MODE.LTR);
    window.location.href = '/';
}

// ==================== 全屏功能 ====================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            document.body.classList.toggle('fullscreen');
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('fullscreen', !!document.fullscreenElement);
});

// ==================== 事件绑定 ====================
function bindEvents() {
    prevBtn.addEventListener('click', prevPage);
    nextBtn.addEventListener('click', nextPage);
    backBtn.addEventListener('click', goBack);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    directionBtn.addEventListener('click', toggleReadingMode);
    modeBtn.addEventListener('click', togglePageMode);

    one_left.addEventListener('click', pageForward);
    one_right.addEventListener('click', pageBackward);

    // 滑块控制
    pageSlider.addEventListener('input', (e) => {
        const pageNum = Math.min(parseInt(e.target.value), mangaImages.length);
        goToPage(pageNum);
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'arrowleft':
            case 'a':
                prevPage();
                break;
            case 'arrowright':
            case 'd':
                nextPage();
                break;
            case 'arrowup':
                pageForward();
                break;
            case 'arrowdown':
                pageBackward();
                break;
            case 'r':
                toggleReadingMode();
                break;
            case 'm':
                togglePageMode();
                break;
            case 'f':
                toggleFullscreen();
                break;
            case 'escape':
                goBack();
                break;
        }
    });

    // 禁用移动端双击放大
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
        }
        lastTap = currentTime;
    });
}

// ==================== 页面加载 ====================
window.addEventListener('DOMContentLoaded', init);
