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

const ROOT_PATH = "/api/image/";

// ==================== DOM 元素 ====================
// DOM 元素引用（在 DOMContentLoaded 前可能为 null）
// const leftPageImg = document.getElementById('leftPageImg');
// const rightPageImg = document.getElementById('rightPageImg');

const pageContainer = document.getElementById('pagesContainer');

const d_pageStatus = document.getElementById("pageStatus");
const totalPages = document.getElementById('totalPages');
const mangaTitle = document.getElementById('mangaTitle');
const d_pageSlider = document.getElementById("pageSlider");
const sliderLabel = document.getElementById('sliderLabel');
const directionBtn = document.getElementById('directionBtn');
const directionIcon = document.getElementById('directionIcon');
const directionLabel = document.getElementById('directionLabel');
const modeBtn = document.getElementById('modeBtn');
const modeIcon = document.getElementById('modeIcon');
const modeLabel = document.getElementById('modeLabel');
const d_leftBtn = document.getElementById("leftBtn");
const d_rightBtn = document.getElementById("rightBtn");
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
    if (d_pageSlider) d_pageSlider.max = mangaImages.length;
    // if (d_pageSlider) d_pageSlider.max = Math.ceil(mangaImages.length / 2) * 2;

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
        // pagesContainer.classList.add('rtl');
        if (directionLabel) directionLabel.textContent = '从右向左';
        if (directionIcon) directionIcon.textContent = '📖';
        if (directionBtn) directionBtn.classList.add('active');
        if (d_leftBtn) d_leftBtn.title = '下一页 (←)';
        if (d_rightBtn) d_rightBtn.title = '上一页 (→)';
    } else {
        // pagesContainer.classList.remove('rtl');
        if (directionLabel) directionLabel.textContent = '从左到右';
        if (directionIcon) directionIcon.textContent = '📚';
        if (directionBtn) directionBtn.classList.remove('active');
        if (d_leftBtn) d_leftBtn.title = '上一页 (←)';
        if (d_rightBtn) d_rightBtn.title = '下一页 (→)';
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


// 更新页码显示
function RenderPageNumbers(index_array) {

    // 将索引数组转换为字符串，使用 '-' 连接
    let str = index_array.map(i => (i + 1).toString()).join('-');

    d_pageStatus.textContent = str;
}

// ==================== 页面更新 ====================
function updatePages() {
    let render_index_array = [];

    if(isSinglePageMode) {
        render_index_array = [currentPageIndex];
    } else if(isRTL) {
        // 从右向左：右侧是较小页码，左侧是较大页码
        render_index_array = [currentPageIndex + 1, currentPageIndex];
    } else {
        // 从左到右：左侧是较小页码，右侧是较大页码
        render_index_array = [currentPageIndex, currentPageIndex + 1];
    }



    RenderPageNumbers(render_index_array);

    // 更新滑块和标签
    updateSliderDisplay();

    // 加载图片
    RenderPageImages(render_index_array);
    // loadPageImages([leftIndex, rightIndex]);

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

    // 滑块显示当前页码（1-based）
    if(d_pageSlider) d_pageSlider.value = isRTL ? mangaImages.length - currentPageIndex : currentPageIndex + 1;
    // if(sliderLabel) sliderLabel.textContent = displayText;
}


// 渲染图片
// 根据编号数组往 pageContainer 中加载图片
function RenderPageImages(indexArray) {

    // 参数检查
    if(!pagesContainer || !indexArray || indexArray.length === 0) return;

    // 清空当前页面内容
    pagesContainer.innerHTML = '';

    indexArray.forEach(index => {
        if (index < 0 || index >= mangaImages.length) return; // 索引越界检查

        const imgElement = document.createElement('img');   // 创建新的 img 元素
        const imgPath    = mangaImages[index].relativePath; // 获取图片相对路径
        imgElement.src   = `${ROOT_PATH}${imgPath}`;        // 设置图片源路径
        imgElement.alt   = `Page ${index + 1}`;             // 设置 alt 属性
        imgElement.classList.add('page-image');             // 添加样式类

        // 添加加载状态类，图片加载完成或失败后移除
        imgElement.onload  = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };
        imgElement.onerror = () => { if (pagesContainer) pagesContainer.classList.remove('loading'); };

        // 将 img 元素添加到页面容器尾部
        pagesContainer.appendChild(imgElement);
    });
}

function updateNavButtonStates() {
    if (isSinglePageMode) {
        // 单页模式：每次翻页 1 页
        if (d_leftBtn) d_leftBtn.disabled = currentPageIndex <= 0;
        if (d_rightBtn) d_rightBtn.disabled = currentPageIndex >= mangaImages.length - 1;
    } else {
        // 双页模式：每次翻页 2 页
        if (isRTL) {
            // RTL 模式：上一页和下一页方向相反
            if (d_leftBtn) d_leftBtn.disabled = currentPageIndex >= mangaImages.length - 2;
            if (d_rightBtn) d_rightBtn.disabled = currentPageIndex <= 0;
        } else {
            // LTR 模式：正常方向
            if (d_leftBtn) d_leftBtn.disabled = currentPageIndex <= 0;
            if (d_rightBtn) d_rightBtn.disabled = currentPageIndex >= mangaImages.length - 2;
        }
    }
}

// ==================== 翻页函数 ====================
function TurnPage(is_left, distance = null) {

    let direction = is_left ? 1 : -1;
    if(distance === null) distance = isSinglePageMode ? 1 : 2;

    currentPageIndex += direction * distance;
    if(currentPageIndex >= mangaImages.length) currentPageIndex = mangaImages.length - 1;
    if(currentPageIndex < 0) currentPageIndex = 0;
    updatePages();
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
    d_leftBtn.addEventListener('click', () => TurnPage(true));
    d_rightBtn.addEventListener('click', () => TurnPage(false));
    backBtn.addEventListener('click', goBack);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    directionBtn.addEventListener('click', toggleReadingMode);
    modeBtn.addEventListener('click', togglePageMode);

    one_left.addEventListener('click', () => TurnPage(true, 1));
    one_right.addEventListener('click', () => TurnPage(false, 1));

    // 滑块控制
    d_pageSlider.addEventListener('input', (e) => {
        const pageNum = Math.min(parseInt(e.target.value), mangaImages.length);
        goToPage(pageNum);
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'arrowleft':
            case 'a':
                TurnPage(true);
                break;
            case 'arrowright':
            case 'd':
                TurnPage(false);
                break;
            case 'arrowup':
                TurnPage(true, 1);
                break;
            case 'arrowdown':
                TurnPage(false, 1);
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
