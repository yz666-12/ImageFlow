document.addEventListener('DOMContentLoaded', function() {
    // 暗黑模式处理
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // 检查系统偏好
    function getSystemPreference() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // 检查本地存储的主题偏好
    function getUserPreference() {
        return localStorage.getItem('theme');
    }
    
    // 设置主题
    function setTheme(theme) {
        if (theme === 'dark' || (theme === 'system' && getSystemPreference())) {
            htmlElement.classList.add('dark');
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            htmlElement.classList.remove('dark');
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        }
        
        // 保存用户选择
        if (theme !== 'system') {
            localStorage.setItem('theme', theme);
        }
    }
    
    // 初始化主题
    function initTheme() {
        const savedTheme = getUserPreference();
        
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            // 如果没有保存的偏好，使用系统偏好
            setTheme(getSystemPreference() ? 'dark' : 'light');
        }
    }
    
    // 切换主题
    themeToggleBtn.addEventListener('click', function() {
        if (htmlElement.classList.contains('dark')) {
            setTheme('light');
        } else {
            setTheme('dark');
        }
    });
    
    // 监听系统主题变化
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            // 只有当用户没有明确设置主题时才跟随系统
            if (!getUserPreference()) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // 初始化主题
    initTheme();
    
    // 添加过渡效果
    document.body.classList.add('theme-transition');
    
    // 只为关键元素添加过渡效果，而不是所有元素，以提高性能
    const transitionElements = document.querySelectorAll('.page-bg, .animated-bg, .drop-zone, .bg-white, .text-gray-800, .text-gray-700, .text-gray-500, .bg-gray-50, .bg-gray-100, .bg-indigo-100');
    transitionElements.forEach(element => {
        element.classList.add('theme-transition');
    });
    
    // 原有代码
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectBtn = document.getElementById('select-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadBtnContainer = document.getElementById('upload-btn-container');
    const preview = document.getElementById('preview');
    const previewContainer = document.getElementById('preview-container');
    const removeBtn = document.getElementById('remove-btn');
    const statusContainer = document.getElementById('status-container');
    const uploads = document.getElementById('uploads');
    const noUploads = document.getElementById('no-uploads');
    const uploadForm = document.getElementById('upload-form');
    
    let selectedFile = null;
    
    // 点击选择按钮
    selectBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 文件选择变化
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖放事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 拖放视觉反馈
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('active');
    }
    
    function unhighlight() {
        dropZone.classList.remove('active');
    }
    
    // 处理拖放
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
    
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // 检查文件类型
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                showStatus('只支持 JPG 和 PNG 格式的图片', 'error');
                return;
            }
            
            // 检查文件大小
            if (file.size > 100 * 1024 * 1024) { // 100MB
                showStatus('图片大小不能超过 100MB', 'error');
                return;
            }
            
            selectedFile = file;
            fileInput.files = files;
            displayPreview(file);
        }
    }
    
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    function displayPreview(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            uploadBtnContainer.classList.remove('hidden');
            
            // 添加动画类
            previewContainer.classList.add('slide-up');
            uploadBtnContainer.classList.add('slide-up');
            
            // 动画结束后移除类
            setTimeout(() => {
                previewContainer.classList.remove('slide-up');
                uploadBtnContainer.classList.remove('slide-up');
            }, 400);
        };
        reader.readAsDataURL(file);
    }
    
    // 移除预览图片
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        previewContainer.classList.add('slide-down');
        uploadBtnContainer.classList.add('slide-down');
        
        setTimeout(() => {
            previewContainer.classList.add('hidden');
            uploadBtnContainer.classList.add('hidden');
            previewContainer.classList.remove('slide-down');
            uploadBtnContainer.classList.remove('slide-down');
            fileInput.value = '';
            selectedFile = null;
        }, 400);
    });
    
    // 表单提交
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!selectedFile) {
            showStatus('请先选择图片', 'error');
            return;
        }
        
        const formData = new FormData(this);
        
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>上传中...</span>';
        
        showStatus('正在上传...', 'info');
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showStatus('上传成功！', 'success');
                addUploadToList(selectedFile, data);
                
                // 重置表单
                previewContainer.classList.add('slide-down');
                uploadBtnContainer.classList.add('slide-down');
                
                setTimeout(() => {
                    previewContainer.classList.add('hidden');
                    uploadBtnContainer.classList.add('hidden');
                    previewContainer.classList.remove('slide-down');
                    uploadBtnContainer.classList.remove('slide-down');
                    fileInput.value = '';
                    selectedFile = null;
                }, 400);
            } else {
                showStatus('上传失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showStatus('上传出错: ' + error.message, 'error');
        })
        .finally(() => {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '上传图片';
        });
    });
    
    function showStatus(message, type) {
        statusContainer.classList.remove('hidden', 'bg-green-50', 'bg-red-50', 'bg-indigo-50', 'bg-green-900', 'bg-red-900', 'bg-indigo-900');
        statusContainer.innerHTML = '';
        
        let icon, bgColor, textColor, borderColor;
        const isDarkMode = htmlElement.classList.contains('dark');
        
        switch(type) {
            case 'success':
                icon = '<svg class="h-6 w-6 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                bgColor = isDarkMode ? 'bg-green-900' : 'bg-green-50';
                textColor = isDarkMode ? 'text-green-200' : 'text-green-800';
                borderColor = isDarkMode ? 'border-green-800' : 'border-green-200';
                break;
            case 'error':
                icon = '<svg class="h-6 w-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                bgColor = isDarkMode ? 'bg-red-900' : 'bg-red-50';
                textColor = isDarkMode ? 'text-red-200' : 'text-red-800';
                borderColor = isDarkMode ? 'border-red-800' : 'border-red-200';
                break;
            default:
                icon = '<svg class="h-6 w-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                bgColor = isDarkMode ? 'bg-indigo-900' : 'bg-indigo-50';
                textColor = isDarkMode ? 'text-indigo-200' : 'text-indigo-800';
                borderColor = isDarkMode ? 'border-indigo-800' : 'border-indigo-200';
        }
        
        statusContainer.classList.add(bgColor, textColor, 'border', borderColor);
        
        statusContainer.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    ${icon}
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium">${message}</p>
                </div>
            </div>
        `;
        
        statusContainer.classList.add('slide-up');
        
        setTimeout(() => {
            statusContainer.classList.remove('slide-up');
        }, 400);
        
        // 如果是成功或错误消息，5秒后自动隐藏
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusContainer.classList.add('fade-out');
                
                setTimeout(() => {
                    statusContainer.classList.add('hidden');
                    statusContainer.classList.remove('fade-out');
                }, 400);
            }, 5000);
        }
    }
    
    function addUploadToList(file, data) {
        // 隐藏"暂无上传记录"
        noUploads.style.display = 'none';
        
        const item = document.createElement('div');
        item.className = 'file-item bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 opacity-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors';
        
        const orientation = data.orientation === 'landscape' ? '横屏' : '竖屏';
        
        // Create a more compact layout with circular progress
        item.innerHTML = `
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 mr-3">
                <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover" alt="${file.name}">
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-center">
                    <div class="max-w-[160px]">
                        <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${file.name}</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 mr-2">
                                ${orientation}
                            </span>
                            <span>${formatFileSize(file.size)}</span>
                        </p>
                    </div>
                    <div class="flex items-center ml-2">
                        <div class="circular-progress mr-2" style="--progress: 0%; --progress-color: var(--${isDarkMode() ? 'dark' : 'light'}-circular-progress);">
                            <span class="progress-value">0%</span>
                        </div>
                        <div class="conversion-status text-xs font-medium text-yellow-600 dark:text-yellow-400">处理中</div>
                    </div>
                </div>
            </div>
        `;
        
        uploads.insertBefore(item, uploads.firstChild);
        
        // Add CSS variables for progress colors
        document.documentElement.style.setProperty('--light-circular-progress', 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)');
        document.documentElement.style.setProperty('--dark-circular-progress', 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)');
        document.documentElement.style.setProperty('--progress-text', isDarkMode() ? '#e2e8f0' : '#1a202c');
        
        // 添加动画类
        item.classList.add('fade-in');
        
        setTimeout(() => {
            item.classList.remove('fade-in');
            item.style.opacity = 1;
        }, 400);
        
        // 模拟进度圆环和转换完成
        const circularProgress = item.querySelector('.circular-progress');
        const progressValue = item.querySelector('.progress-value');
        const conversionStatus = item.querySelector('.conversion-status');
        
        // 模拟进度增加
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // 转换完成
                setTimeout(() => {
                    conversionStatus.textContent = '已完成';
                    conversionStatus.classList.remove('text-yellow-600', 'dark:text-yellow-400');
                    conversionStatus.classList.add('text-green-600', 'dark:text-green-400');
                    
                    // 添加完成效果
                    const isDarkModeActive = isDarkMode();
                    item.style.backgroundColor = isDarkModeActive ? '#065f46' : '#f0fdf4';
                    setTimeout(() => {
                        item.style.backgroundColor = '';
                    }, 1500);
                }, 500);
            }
            
            // Update circular progress
            circularProgress.style.setProperty('--progress', `${progress}%`);
            progressValue.textContent = `${Math.floor(progress)}%`;
        }, 300);
    }
    
    // Helper function to check dark mode
    function isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
    }
    
    // 点击整个拖放区域也触发文件选择
    dropZone.addEventListener('click', (e) => {
        // 如果点击的是选择按钮，不要再次触发文件选择
        if (e.target === selectBtn || selectBtn.contains(e.target)) {
            return;
        }
        fileInput.click();
    });
}); 