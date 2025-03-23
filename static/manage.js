document.addEventListener('DOMContentLoaded', function () {
    // API Key Management
    const apiKeyOverlay = document.getElementById('api-key-overlay')
    const apiKeyForm = document.getElementById('api-key-form')
    const apiKeyInput = document.getElementById('api-key-input')
    const apiKeyError = document.getElementById('api-key-error')
    const manageApiKeyBtn = document.getElementById('manage-api-key')
    
    // 图片管理相关元素
    const imageGrid = document.getElementById('image-grid')
    const loadingIndicator = document.getElementById('loading-indicator')
    const noImagesMessage = document.getElementById('no-images')
    const formatFilter = document.getElementById('format-filter')
    const orientationFilter = document.getElementById('orientation-filter')
    const paginationContainer = document.getElementById('pagination-container')
    const prevPageBtn = document.getElementById('prev-page')
    const nextPageBtn = document.getElementById('next-page')
    const pageIndicator = document.getElementById('page-indicator')
    const totalImagesCount = document.getElementById('total-images-count')
    
    // 模态框元素
    const imageModal = document.getElementById('image-modal')
    const modalImage = document.getElementById('modal-image')
    const modalTitle = document.getElementById('modal-title')
    const modalFilename = document.getElementById('modal-filename')
    const modalPath = document.getElementById('modal-path')
    const modalSize = document.getElementById('modal-size')
    const modalFormat = document.getElementById('modal-format')
    const modalOrientation = document.getElementById('modal-orientation')
    const modalUrl = document.getElementById('modal-url')
    const copyUrlBtn = document.getElementById('copy-url')
    const closeModalBtn = document.getElementById('close-modal')
    const modalCloseBtn = document.getElementById('modal-close-btn')
    const deleteImageBtn = document.getElementById('delete-image')
    
    let currentImages = [] // 保存当前显示的图片数据
    let currentPage = 1 // 当前页码
    let totalPages = 1 // 总页数
    let imagesPerPage = 12 // 每页图片数量
    let totalImages = 0 // 图片总数

    // 检查API密钥并加载图片
    function init() {
        checkApiKey()
        updateApiKeyStatus(!!localStorage.getItem('api_key'))
        initTheme()
    }

    // 检查API密钥
    function checkApiKey() {
        const apiKey = localStorage.getItem('api_key')
        if (!apiKey) {
            showApiKeyOverlay()
        } else {
            loadImages()
        }
    }

    // 显示API密钥验证遮罩
    function showApiKeyOverlay() {
        apiKeyOverlay.classList.remove('hidden')
        setTimeout(() => {
            apiKeyOverlay.classList.add('visible')
        }, 10)
        apiKeyInput.focus()
    }

    // 隐藏API密钥验证遮罩
    function hideApiKeyOverlay() {
        apiKeyOverlay.classList.remove('visible')
        setTimeout(() => {
            apiKeyOverlay.classList.add('hidden')
        }, 300)
    }

    // 验证API密钥
    function validateApiKey(key) {
        return fetch('/validate-api-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.valid) {
                    localStorage.setItem('api_key', key)
                    return true
                }
                return false
            })
            .catch((error) => {
                console.error('API key validation error:', error)
                return false
            })
    }

    // 处理API密钥表单提交
    apiKeyForm.addEventListener('submit', function (e) {
        e.preventDefault()
        const key = apiKeyInput.value.trim()

        if (!key) {
            showApiKeyError('请输入 API 密钥')
            return
        }

        const submitBtn = this.querySelector('button[type="submit"]')
        const originalText = submitBtn.textContent

        submitBtn.disabled = true
        submitBtn.innerHTML =
            '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>验证中...</span>'

        validateApiKey(key)
            .then((valid) => {
                if (valid) {
                    hideApiKeyOverlay()
                    showStatus('API 密钥验证成功', 'success')
                    updateApiKeyStatus(true)
                    loadImages() // 验证成功后加载图片
                } else {
                    showApiKeyError('无效的 API 密钥')
                }
            })
            .finally(() => {
                submitBtn.disabled = false
                submitBtn.textContent = originalText
            })
    })

    // 显示API密钥错误
    function showApiKeyError(message) {
        apiKeyError.textContent = message
        apiKeyError.classList.remove('hidden')
        apiKeyInput.classList.add('border-red-500', 'dark:border-red-500')

        setTimeout(() => {
            apiKeyError.classList.remove('shake')
            void apiKeyError.offsetWidth // Force reflow
            apiKeyError.classList.add('shake')
        }, 0)
    }

    // 更新API密钥状态UI
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
            `
        } else {
            manageApiKeyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            `
        }
    }

    // 管理API密钥按钮点击处理
    manageApiKeyBtn.addEventListener('click', function () {
        const apiKey = localStorage.getItem('api_key')

        if (apiKey) {
            // 显示API密钥管理对话框
            if (confirm('您想要管理您的 API 密钥吗？\n\n• 确定: 清除当前 API 密钥并输入新的密钥\n• 取消: 保持当前设置')) {
                localStorage.removeItem('api_key')
                updateApiKeyStatus(false)
                showApiKeyOverlay()
            }
        } else {
            showApiKeyOverlay()
        }
    })

    // 暗黑模式处理
    const themeToggleBtn = document.getElementById('theme-toggle')
    const htmlElement = document.documentElement

    // 检查系统偏好
    function getSystemPreference() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // 检查本地存储的主题偏好
    function getUserPreference() {
        return localStorage.getItem('theme')
    }

    // 设置主题
    function setTheme(theme) {
        if (theme === 'dark') {
            htmlElement.classList.add('dark')
            document.body.classList.add('dark-mode')
            document.body.classList.remove('light-mode')
        } else {
            htmlElement.classList.remove('dark')
            document.body.classList.remove('dark-mode')
            document.body.classList.add('light-mode')
        }
        localStorage.setItem('theme', theme)
    }

    // 初始化主题
    function initTheme() {
        const userPreference = getUserPreference()
        if (userPreference) {
            setTheme(userPreference)
        } else {
            const systemPreference = getSystemPreference() ? 'dark' : 'light'
            setTheme(systemPreference)
        }
    }

    // 切换主题
    themeToggleBtn.addEventListener('click', function () {
        if (htmlElement.classList.contains('dark')) {
            setTheme('light')
        } else {
            setTheme('dark')
        }
    })

    // 处理格式选择变化
    formatFilter.addEventListener('change', function() {
        // 当选择GIF格式时，自动将方向设置为“所有方向”并禁用方向选择
        if (this.value === 'gif') {
            orientationFilter.value = 'all'
            orientationFilter.disabled = true
            orientationFilter.classList.add('opacity-50', 'cursor-not-allowed')
        } else {
            orientationFilter.disabled = false
            orientationFilter.classList.remove('opacity-50', 'cursor-not-allowed')
        }
        
        // 重新加载图片
        loadImages(1) // 返回第一页
    })
    
    // 加载图片
    function loadImages(page = 1) {
        const format = formatFilter.value
        const orientation = format === 'gif' ? 'all' : orientationFilter.value
        const apiKey = localStorage.getItem('api_key')
        const limit = imagesPerPage

        if (!apiKey) {
            showApiKeyOverlay()
            return
        }

        // 显示加载指示器
        loadingIndicator.classList.remove('hidden')
        imageGrid.classList.add('hidden')
        noImagesMessage.classList.add('hidden')
        paginationContainer.classList.add('hidden')

        // 构建API URL，加入分页参数
        const apiUrl = `/api/images?format=${format}&orientation=${orientation}&page=${page}&limit=${limit}`

        // 发送请求
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            return response.json()
        })
        .then(data => {
            // 隐藏加载指示器
            loadingIndicator.classList.add('hidden')
            
            if (data.success && data.images && data.images.length > 0) {
                // 保存当前图片数据
                currentImages = data.images
                currentPage = data.page
                totalPages = data.totalPages
                totalImages = data.total
                
                // 显示图片网格
                imageGrid.classList.remove('hidden')
                
                // 渲染图片网格
                renderImageGrid(data.images)
                
                // 更新分页控件
                updatePagination()
                
                // 显示总数量
                if (totalImagesCount) {
                    totalImagesCount.textContent = `共 ${totalImages} 张图片`
                    totalImagesCount.classList.remove('hidden')
                }
            } else {
                // 显示无图片消息
                noImagesMessage.classList.remove('hidden')
                
                // 隐藏分页控件
                paginationContainer.classList.add('hidden')
                
                // 隐藏总数量
                if (totalImagesCount) {
                    totalImagesCount.classList.add('hidden')
                }
            }
        })
        .catch(error => {
            console.error('Error loading images:', error)
            loadingIndicator.classList.add('hidden')
            noImagesMessage.classList.remove('hidden')
            paginationContainer.classList.add('hidden')
            if (totalImagesCount) {
                totalImagesCount.classList.add('hidden')
            }
            showStatus('获取图片列表失败', 'error')
        })
    }
    
    // 更新分页控件
    function updatePagination() {
        if (totalPages <= 1) {
            paginationContainer.classList.add('hidden')
            return
        }
        
        paginationContainer.classList.remove('hidden')
        
        // 更新页码显示
        pageIndicator.textContent = `${currentPage} / ${totalPages}`
        
        // 更新按钮状态
        prevPageBtn.disabled = currentPage <= 1
        nextPageBtn.disabled = currentPage >= totalPages
        
        prevPageBtn.classList.toggle('opacity-50', currentPage <= 1)
        nextPageBtn.classList.toggle('opacity-50', currentPage >= totalPages)
    }

    // 渲染图片网格
    function renderImageGrid(images) {
        // 清空现有内容
        imageGrid.innerHTML = ''
        
        // 创建每个图片的卡片
        images.forEach((image, index) => {
            const card = document.createElement('div')
            card.className = 'bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1'
            card.setAttribute('data-index', index)
            
            const formatLabel = getFormatLabel(image.format)
            const orientationLabel = getOrientationLabel(image.orientation)
            
            // 根据图片方向设置不同的宽高比
            const aspectRatioClass = image.orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-video'
            
            card.innerHTML = `
                <div class="relative ${aspectRatioClass} bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center">
                    <img src="${image.url}" alt="${image.fileName}" class="object-cover w-full h-full">
                    <div class="absolute top-2 right-2 flex gap-1">
                        <span class="px-2 py-1 bg-indigo-500 bg-opacity-80 text-white text-xs rounded-md">
                            ${formatLabel}
                        </span>
                        <span class="px-2 py-1 bg-purple-500 bg-opacity-80 text-white text-xs rounded-md">
                            ${orientationLabel}
                        </span>
                    </div>
                </div>
                <div class="p-3">
                    <div class="truncate text-gray-800 dark:text-gray-200 font-medium">${image.fileName}</div>
                    <div class="text-gray-500 dark:text-gray-400 text-sm">${formatFileSize(image.size)}</div>
                </div>
            `
            
            // 点击卡片打开详情模态框
            card.addEventListener('click', () => {
                openImageModal(index)
            })
            
            imageGrid.appendChild(card)
        })
    }

    // 打开图片详情模态框
    function openImageModal(index) {
        const image = currentImages[index]
        if (!image) return
        
        // 设置模态框内容
        modalImage.src = image.url
        modalTitle.textContent = `图片详情 - ${image.fileName}`
        modalFilename.textContent = image.fileName
        
        // 设置路径显示
        modalPath.textContent = image.path
        modalSize.textContent = formatFileSize(image.size)
        modalFormat.textContent = getFormatLabel(image.format)
        modalOrientation.textContent = getOrientationLabel(image.orientation)
        
        // 确保URL显示为完整链接
        let fullUrl = image.url
        if (fullUrl.startsWith('/images/')) {
            // 对于本地模式，构建完整URL
            const protocol = window.location.protocol
            const host = window.location.host
            fullUrl = `${protocol}//${host}${fullUrl}`
        }
        modalUrl.value = fullUrl
        
        // 重置删除按钮状态
        deleteImageBtn.disabled = false
        deleteImageBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="3 6 5 6 21 6"></polyline>' +
            '<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>' +
            '<line x1="10" y1="11" x2="10" y2="17"></line>' +
            '<line x1="14" y1="11" x2="14" y2="17"></line>' +
            '</svg>删除图片'
        
        // 显示模态框
        imageModal.classList.remove('hidden')
    }

    // 关闭图片详情模态框
    function closeImageModal() {
        imageModal.classList.add('hidden')
    }

    // 复制URL到剪贴板
    copyUrlBtn.addEventListener('click', function() {
        const url = modalUrl.value
        copyToClipboard(url, this)
    })
    
    // 关闭模态框按钮
    closeModalBtn.addEventListener('click', closeImageModal)
    modalCloseBtn.addEventListener('click', closeImageModal)
    
    // 点击模态框背景时关闭
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeImageModal()
        }
    })
    
    // 删除图片按钮点击事件
    deleteImageBtn.addEventListener('click', function() {
        // 获取当前显示的图片ID
        const currentImage = currentImages.find(img => modalUrl.value.includes(img.id) || modalPath.textContent.includes(img.id))
        if (!currentImage) {
            showMessage('找不到要删除的图片', 'error')
            return
        }
        
        // 确认删除
        if (!confirm(`确定要删除图片 ${currentImage.fileName} 吗？这将删除该图片的所有格式（原始、WebP和AVIF）。`)) {
            return
        }
        
        // 获取存储类型
        const storageType = currentImage.url.startsWith('/images/') ? 'local' : 's3'
        
        // 调用删除API
        deleteImage(currentImage.id, storageType)
    })

    // 删除图片功能
    async function deleteImage(id, storageType) {
        try {
            const apiKey = localStorage.getItem('api_key')
            if (!apiKey) {
                showStatus('请先验证API密钥', 'error')
                return
            }
            
            // 显示加载状态
            deleteImageBtn.disabled = true
            deleteImageBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">' +
                '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
                '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>' +
                '</svg>正在删除...'
            
            const response = await fetch('/api/delete-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    id: id,
                    storageType: storageType
                })
            })
            
            const result = await response.json()
            
            if (response.ok && result.success) {
                showStatus(`成功删除图片: ${result.message}`, 'success')
                closeImageModal()
                loadImages() // 重新加载图片列表
            } else {
                showStatus(`删除失败: ${result.message || '未知错误'}`, 'error')
                // 恢复按钮状态
                resetDeleteButton()
            }
        } catch (error) {
            console.error('Error deleting image:', error)
            showStatus('删除图片时发生错误: ' + error.message, 'error')
            resetDeleteButton()
        }
    }
    
    function resetDeleteButton() {
        deleteImageBtn.disabled = false
        deleteImageBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="3 6 5 6 21 6"></polyline>' +
            '<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>' +
            '<line x1="10" y1="11" x2="10" y2="17"></line>' +
            '<line x1="14" y1="11" x2="14" y2="17"></line>' +
            '</svg>删除图片'
    }
    
    // 复制到剪贴板辅助函数
    function copyToClipboard(text, button) {
        const originalHTML = button.innerHTML
        
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        let successful = false
        
        try {
            successful = document.execCommand('copy')
        } catch (e) {
            console.error('execCommand failed:', e)
        }
        
        document.body.removeChild(textArea)
        
        if (successful) {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            `
        } else {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            `
        }
        
        setTimeout(() => {
            button.innerHTML = originalHTML
        }, 1500)
    }

    // 获取格式标签
    function getFormatLabel(format) {
        switch (format) {
            case 'original': return '原始格式'
            case 'webp': return 'WebP'
            case 'avif': return 'AVIF'
            default: return format
        }
    }

    // 获取方向标签
    function getOrientationLabel(orientation) {
        switch (orientation) {
            case 'landscape': return '横向'
            case 'portrait': return '纵向'
            default: return orientation
        }
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    let statusTimeout
    
    // 显示状态消息
    function showStatus(message, type) {
        const statusContainer = document.getElementById('status-container')
        
        // 清除之前的超时和类
        if (statusTimeout) {
            clearTimeout(statusTimeout)
        }
        
        // 移除之前的类
        statusContainer.classList.remove(
            'bg-green-100', 'text-green-800', 'border-green-200',
            'bg-red-100', 'text-red-800', 'border-red-200',
            'bg-yellow-100', 'text-yellow-800', 'border-yellow-200',
            'bg-blue-100', 'text-blue-800', 'border-blue-200',
            'dark:bg-green-900', 'dark:text-green-300', 'dark:border-green-800',
            'dark:bg-red-900', 'dark:text-red-300', 'dark:border-red-800',
            'dark:bg-yellow-900', 'dark:text-yellow-300', 'dark:border-yellow-800',
            'dark:bg-blue-900', 'dark:text-blue-300', 'dark:border-blue-800'
        )
        
        // 设置图标和颜色
        let icon = ''
        
        if (type === 'success') {
            statusContainer.classList.add('bg-green-100', 'text-green-800', 'border-green-200', 'dark:bg-green-900', 'dark:text-green-300', 'dark:border-green-800')
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>`
        } else if (type === 'error') {
            statusContainer.classList.add('bg-red-100', 'text-red-800', 'border-red-200', 'dark:bg-red-900', 'dark:text-red-300', 'dark:border-red-800')
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>`
        } else if (type === 'warning') {
            statusContainer.classList.add('bg-yellow-100', 'text-yellow-800', 'border-yellow-200', 'dark:bg-yellow-900', 'dark:text-yellow-300', 'dark:border-yellow-800')
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>`
        } else {
            statusContainer.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-200', 'dark:bg-blue-900', 'dark:text-blue-300', 'dark:border-blue-800')
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>`
        }
        
        // 设置内容和显示
        statusContainer.innerHTML = `
            <div class="flex items-center">
                ${icon}
                <span>${message}</span>
            </div>
        `
        
        statusContainer.classList.remove('hidden')
        
        // 设置自动隐藏
        statusTimeout = setTimeout(() => {
            statusContainer.classList.add('hidden')
        }, 3000)
    }

    // 图片加载优化
    let page = 1;
    const pageSize = 20;
    let loading = false;
    let hasMore = true;

    // 创建Intersection Observer来实现无限滚动
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !loading && hasMore) {
                loadImages();
            }
        });
    }, {
        rootMargin: '100px'
    });

    // 监听筛选器变化事件
    formatFilter.addEventListener('change', () => {
        page = 1;
        hasMore = true;
        loadImages();
    });

    orientationFilter.addEventListener('change', () => {
        page = 1;
        hasMore = true;
        loadImages();
    });

    // 初始化时观察sentinel元素
    if (document.getElementById('sentinel')) {
        observer.observe(document.getElementById('sentinel'));
    }
    
    // 分页按钮事件处理
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                loadImages(currentPage - 1)
            }
        })
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                loadImages(currentPage + 1)
            }
        })
    }

    // 初始化
    init()
});
