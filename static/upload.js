document.addEventListener('DOMContentLoaded', function() {
    // API Key Management
    const apiKeyOverlay = document.getElementById('api-key-overlay');
    const apiKeyForm = document.getElementById('api-key-form');
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKeyError = document.getElementById('api-key-error');
    const manageApiKeyBtn = document.getElementById('manage-api-key');
    
    // Check if API key exists
    function checkApiKey() {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
            showApiKeyOverlay();
        }
    }
    
    // Display API key verification overlay
    function showApiKeyOverlay() {
        apiKeyOverlay.classList.remove('hidden');
        setTimeout(() => {
            apiKeyOverlay.classList.add('visible');
        }, 10);
        apiKeyInput.focus();
    }
    
    // Hide API key verification overlay
    function hideApiKeyOverlay() {
        apiKeyOverlay.classList.remove('visible');
        setTimeout(() => {
            apiKeyOverlay.classList.add('hidden');
        }, 300);
    }
    
    // Validate API key
    function validateApiKey(key) {
        return fetch('/validate-api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                localStorage.setItem('api_key', key);
                return true;
            }
            return false;
        })
        .catch(error => {
            console.error('API key validation error:', error);
            return false;
        });
    }
    
    // Handle API key form submission
    apiKeyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const key = apiKeyInput.value.trim();
        
        if (!key) {
            showApiKeyError('请输入 API 密钥');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>验证中...</span>';
        
        validateApiKey(key)
            .then(valid => {
                if (valid) {
                    hideApiKeyOverlay();
                    showStatus('API 密钥验证成功', 'success');
                    updateApiKeyStatus(true);
                } else {
                    showApiKeyError('无效的 API 密钥');
                }
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
    });
    
    // Show API key error
    function showApiKeyError(message) {
        apiKeyError.textContent = message;
        apiKeyError.classList.remove('hidden');
        apiKeyInput.classList.add('border-red-500', 'dark:border-red-500');
        
        setTimeout(() => {
            apiKeyError.classList.remove('shake');
            void apiKeyError.offsetWidth; // Force reflow
            apiKeyError.classList.add('shake');
        }, 0);
    }
    
    // Update API key status in UI
    function updateApiKeyStatus(isValid) {
        if (isValid) {
            manageApiKeyBtn.innerHTML = `
                <div class="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span class="absolute -top-1 -right-1 flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
            `;
        } else {
            manageApiKeyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            `;
        }
    }
    
    // Manage API key button click handler
    manageApiKeyBtn.addEventListener('click', function() {
        const apiKey = localStorage.getItem('api_key');
        
        if (apiKey) {
            // Show API key management dialog
            if (confirm('您想要管理您的 API 密钥吗？\n\n• 确定: 清除当前 API 密钥并输入新的密钥\n• 取消: 保持当前设置')) {
                localStorage.removeItem('api_key');
                updateApiKeyStatus(false);
                showApiKeyOverlay();
            }
        } else {
            showApiKeyOverlay();
        }
    });
    
    // Check API key on page load
    checkApiKey();
    
    // Update API key status in UI based on stored key
    updateApiKeyStatus(!!localStorage.getItem('api_key'));
    
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
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });
    
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
        handleFiles(dt.files);
    }
    
    function handleFiles(fileList) {
        const validFiles = [];
        const maxFiles = 10; // 最大允许上传10个文件
        
        // 检查文件数量
        if (fileList.length > maxFiles) {
            showStatus(`一次最多只能上传 ${maxFiles} 个文件`, 'error');
            return;
        }
        
        // 将 FileList 转换为数组并验证每个文件
        Array.from(fileList).forEach(file => {
            // 检查文件类型
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                showStatus(`文件 ${file.name} 格式不支持，只支持 JPG 和 PNG`, 'error');
                return;
            }
            
            // 检查文件大小
            if (file.size > 100 * 1024 * 1024) { // 100MB
                showStatus(`文件 ${file.name} 太大，不能超过 100MB`, 'error');
                return;
            }
            
            validFiles.push(file);
        });
        
        if (validFiles.length > 0) {
            displayPreviews(validFiles);
        }
    }
    
    function displayPreviews(files) {
        // 清空预览容器
        previewContainer.innerHTML = '';
        previewContainer.classList.remove('hidden');
        uploadBtnContainer.classList.remove('hidden');
        
        // 创建预览容器的包装器
        const previewsWrapper = document.createElement('div');
        previewsWrapper.className = 'preview-container grid grid-cols-2 sm:grid-cols-3 gap-4';
        previewContainer.appendChild(previewsWrapper);
        
        files.forEach((file, index) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'preview-item relative bg-gray-50 dark:bg-gray-700 rounded-lg transition-all duration-300 ease-in-out overflow-hidden';
            
            // 创建预览图片的 URL
            const previewUrl = URL.createObjectURL(file);
            
            const previewContent = `
                <div class="relative aspect-square">
                    <img src="${previewUrl}" class="w-full h-full object-cover" alt="${file.name}">
                    <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-200"></div>
                    <button type="button" class="remove-preview absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100" data-index="${index}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div class="p-3">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${file.name}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${formatFileSize(file.size)}</p>
                </div>
            `;
            
            previewWrapper.innerHTML = previewContent;
            previewsWrapper.appendChild(previewWrapper);
            
            // 存储文件引用和 URL
            previewWrapper._file = file;
            previewWrapper._previewUrl = previewUrl;
            
            // 添加删除预览的事件处理
            previewWrapper.querySelector('.remove-preview').addEventListener('click', function(e) {
                e.stopPropagation(); // 防止触发父元素的点击事件
                URL.revokeObjectURL(previewUrl); // 释放 URL 对象
                previewWrapper.remove();
                if (previewsWrapper.children.length === 0) {
                    previewContainer.classList.add('hidden');
                    uploadBtnContainer.classList.add('hidden');
                }
            });
        });
    }
    
    // 表单提交
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const previews = previewContainer.querySelectorAll('.preview-item');
        if (previews.length === 0) {
            showStatus('请先选择图片', 'error');
            return;
        }
        
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
            showStatus('请先验证 API 密钥', 'error');
            showApiKeyOverlay();
            return;
        }
        
        const formData = new FormData();
        previews.forEach(preview => {
            // 使用存储的原始文件
            const file = preview._file;
            if (file) {
                formData.append('images[]', file);
            }
        });
        
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>上传中...</span>';
        
        showStatus('正在上传...', 'info');
        
        fetch('/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        })
        .then(response => {
            if (response.status === 401) {
                localStorage.removeItem('api_key');
                updateApiKeyStatus(false);
                showApiKeyOverlay();
                throw new Error('API 密钥无效或已过期');
            }
            return response.json();
        })
        .then(data => {
            let successCount = 0;
            let errorCount = 0;
            
            data.results.forEach(result => {
                if (result.status === 'success') {
                    successCount++;
                    addUploadToList(result);
                } else {
                    errorCount++;
                    showStatus(`文件 ${result.filename} 上传失败: ${result.message}`, 'error');
                }
            });
            
            if (successCount > 0) {
                showStatus(`成功上传 ${successCount} 个文件${errorCount > 0 ? `，${errorCount} 个文件失败` : ''}`, 'success');
                
                // 清理所有预览的 URL 对象
                const previews = previewContainer.querySelectorAll('.preview-item');
                previews.forEach(preview => {
                    if (preview._previewUrl) {
                        URL.revokeObjectURL(preview._previewUrl);
                    }
                });
                
                // 重置表单和预览
                resetUploadForm();
            } else {
                showStatus('所有文件上传失败', 'error');
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
    
    function resetUploadForm() {
        // 重置文件输入
        fileInput.value = '';
        
        // 添加淡出动画
        previewContainer.classList.add('fade-out');
        uploadBtnContainer.classList.add('fade-out');
        
        // 等待动画完成后清理
        setTimeout(() => {
            previewContainer.innerHTML = '';
            previewContainer.classList.add('hidden');
            previewContainer.classList.remove('fade-out');
            
            uploadBtnContainer.classList.add('hidden');
            uploadBtnContainer.classList.remove('fade-out');
        }, 300);
    }
    
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
    
    function addUploadToList(result) {
        // 隐藏"暂无上传记录"
        noUploads.style.display = 'none';
        
        const item = document.createElement('div');
        item.className = 'file-item bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 opacity-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors';
        
        // 使用文件名作为显示名称
        const displayName = result.filename || '未知文件';
        const orientation = result.orientation === 'landscape' ? '横屏' : '竖屏';
        
        item.innerHTML = `
            <div class="flex items-center p-3">
                <div class="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 mr-3">
                    <div class="w-full h-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-center">
                        <div class="max-w-[160px]">
                            <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${displayName}</h3>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 mr-2">
                                    ${orientation}
                                </span>
                                <span class="text-xs text-gray-500">${result.savedAs || ''}</span>
                            </p>
                        </div>
                        <div class="flex items-center ml-2">
                            <div class="text-xs font-medium text-green-600 dark:text-green-400">已完成</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        uploads.insertBefore(item, uploads.firstChild);
        
        // 添加动画类
        item.classList.add('fade-in');
        
        setTimeout(() => {
            item.classList.remove('fade-in');
            item.style.opacity = 1;
        }, 400);
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