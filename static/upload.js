document.addEventListener('DOMContentLoaded', function () {
	// API Key Management
	const apiKeyOverlay = document.getElementById('api-key-overlay')
	const apiKeyForm = document.getElementById('api-key-form')
	const apiKeyInput = document.getElementById('api-key-input')
	const apiKeyError = document.getElementById('api-key-error')
	const manageApiKeyBtn = document.getElementById('manage-api-key')

	// Check if API key exists
	function checkApiKey() {
		const apiKey = localStorage.getItem('api_key')
		if (!apiKey) {
			showApiKeyOverlay()
		}
	}

	// Display API key verification overlay
	function showApiKeyOverlay() {
		apiKeyOverlay.classList.remove('hidden')
		setTimeout(() => {
			apiKeyOverlay.classList.add('visible')
		}, 10)
		apiKeyInput.focus()
	}

	// Hide API key verification overlay
	function hideApiKeyOverlay() {
		apiKeyOverlay.classList.remove('visible')
		setTimeout(() => {
			apiKeyOverlay.classList.add('hidden')
		}, 300)
	}

	// Validate API key
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

	// Handle API key form submission
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
				} else {
					showApiKeyError('无效的 API 密钥')
				}
			})
			.finally(() => {
				submitBtn.disabled = false
				submitBtn.textContent = originalText
			})
	})

	// Show API key error
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
            `
		} else {
			manageApiKeyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            `
		}
	}

	// Manage API key button click handler
	manageApiKeyBtn.addEventListener('click', function () {
		const apiKey = localStorage.getItem('api_key')

		if (apiKey) {
			// Show API key management dialog
			if (confirm('您想要管理您的 API 密钥吗？\n\n• 确定: 清除当前 API 密钥并输入新的密钥\n• 取消: 保持当前设置')) {
				localStorage.removeItem('api_key')
				updateApiKeyStatus(false)
				showApiKeyOverlay()
			}
		} else {
			showApiKeyOverlay()
		}
	})

	// Check API key on page load
	checkApiKey()

	// Update API key status in UI based on stored key
	updateApiKeyStatus(!!localStorage.getItem('api_key'))

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
		if (theme === 'dark' || (theme === 'system' && getSystemPreference())) {
			htmlElement.classList.add('dark')
			document.body.classList.add('dark-mode')
			document.body.classList.remove('light-mode')
		} else {
			htmlElement.classList.remove('dark')
			document.body.classList.remove('dark-mode')
			document.body.classList.add('light-mode')
		}

		// 保存用户选择
		if (theme !== 'system') {
			localStorage.setItem('theme', theme)
		}
	}

	// 初始化主题
	function initTheme() {
		const savedTheme = getUserPreference()

		if (savedTheme) {
			setTheme(savedTheme)
		} else {
			// 如果没有保存的偏好，使用系统偏好
			setTheme(getSystemPreference() ? 'dark' : 'light')
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

	// 监听系统主题变化
	if (window.matchMedia) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
			// 只有当用户没有明确设置主题时才跟随系统
			if (!getUserPreference()) {
				setTheme(e.matches ? 'dark' : 'light')
			}
		})
	}

	// 初始化主题
	initTheme()

	// 添加过渡效果
	document.body.classList.add('theme-transition')

	// 只为关键元素添加过渡效果，而不是所有元素，以提高性能
	const transitionElements = document.querySelectorAll('.page-bg, .animated-bg, .drop-zone, .bg-white, .text-gray-800, .text-gray-700, .text-gray-500, .bg-gray-50, .bg-gray-100, .bg-indigo-100')
	transitionElements.forEach((element) => {
		element.classList.add('theme-transition')
	})

	// 原有代码
	const dropZone = document.getElementById('drop-zone')
	const fileInput = document.getElementById('file-input')
	const selectBtn = document.getElementById('select-btn')
	const uploadBtn = document.getElementById('upload-btn')
	const uploadBtnContainer = document.getElementById('upload-btn-container')
	const preview = document.getElementById('preview')
	const previewContainer = document.getElementById('preview-container')
	const removeBtn = document.getElementById('remove-btn')
	const statusContainer = document.getElementById('status-container')
	const uploads = document.getElementById('uploads')
	const noUploads = document.getElementById('no-uploads')
	const uploadForm = document.getElementById('upload-form')

	let selectedFile = null

	// 点击选择按钮
	selectBtn.addEventListener('click', () => {
		fileInput.click()
	})

	// 文件选择变化
	fileInput.addEventListener('change', function (e) {
		handleFiles(e.target.files)
	})

	// 拖放事件
	;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
		dropZone.addEventListener(eventName, preventDefaults, false)
	})

	function preventDefaults(e) {
		e.preventDefault()
		e.stopPropagation()
	}

	// 拖放视觉反馈
	;['dragenter', 'dragover'].forEach((eventName) => {
		dropZone.addEventListener(eventName, highlight, false)
	})

	;['dragleave', 'drop'].forEach((eventName) => {
		dropZone.addEventListener(eventName, unhighlight, false)
	})

	function highlight() {
		dropZone.classList.add('active')
	}

	function unhighlight() {
		dropZone.classList.remove('active')
	}

	// 处理拖放
	dropZone.addEventListener('drop', handleDrop, false)

	function handleDrop(e) {
		const dt = e.dataTransfer
		handleFiles(dt.files)
	}

	function handleFiles(fileList) {
		const validFiles = []
		const maxFiles = 10 // 最大允许上传10个文件

		// 检查文件数量
		if (fileList.length > maxFiles) {
			showStatus(`一次最多只能上传 ${maxFiles} 个文件`, 'error')
			return
		}

		// 将 FileList 转换为数组并验证每个文件
		Array.from(fileList).forEach((file) => {
			// 检查文件类型
			const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
			if (!validTypes.includes(file.type)) {
				showStatus(`文件 ${file.name} 格式不支持，只支持 JPG 和 PNG`, 'error')
				return
			}

			// 检查文件大小
			if (file.size > 100 * 1024 * 1024) {
				// 100MB
				showStatus(`文件 ${file.name} 太大，不能超过 100MB`, 'error')
				return
			}

			validFiles.push(file)
		})

		if (validFiles.length > 0) {
			displayPreviews(validFiles)
		}
	}

	function displayPreviews(files) {
		// 清空预览容器
		previewContainer.innerHTML = ''
		previewContainer.classList.remove('hidden')
		uploadBtnContainer.classList.remove('hidden')

		// 创建预览容器的包装器
		const previewsWrapper = document.createElement('div')
		previewsWrapper.className = 'preview-container grid grid-cols-1 gap-3'
		previewContainer.appendChild(previewsWrapper)

		files.forEach((file, index) => {
			const previewWrapper = document.createElement('div')
			previewWrapper.className = 'file-item bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 opacity-0 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors'

			// 创建预览图片的 URL
			const previewUrl = URL.createObjectURL(file)

			const previewContent = `
                <div class="flex items-center p-3">
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 mr-3">
                        <img src="${previewUrl}" class="w-full h-full object-cover" alt="${file.name}">
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-center">
                            <div class="max-w-[160px]">
                                <h3 class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">${file.name}</h3>
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span class="text-xs text-gray-500">${formatFileSize(file.size)}</span>
                                </p>
                            </div>
                            <button type="button" class="remove-preview p-1.5 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-index="${index}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `

			previewWrapper.innerHTML = previewContent
			previewsWrapper.appendChild(previewWrapper)

			// 存储文件引用和 URL
			previewWrapper._file = file
			previewWrapper._previewUrl = previewUrl

			// 添加删除预览的事件处理
			previewWrapper.querySelector('.remove-preview').addEventListener('click', function (e) {
				e.stopPropagation() // 防止触发父元素的点击事件
				URL.revokeObjectURL(previewUrl) // 释放 URL 对象
				previewWrapper.remove()
				if (previewsWrapper.children.length === 0) {
					previewContainer.classList.add('hidden')
					uploadBtnContainer.classList.add('hidden')
				}
			})

			// 添加淡入动画
			previewWrapper.classList.add('fade-in')
			setTimeout(() => {
				previewWrapper.classList.remove('fade-in')
				previewWrapper.style.opacity = 1
			}, 400)
		})
	}

	// 表单提交
	function updateProgress(progress) {
	    const progressBar = document.getElementById('progress-bar');
	    const progressText = document.getElementById('progress-text');
	    const uploadProgress = document.getElementById('upload-progress');
	
	    if (progress === 0) {
	        uploadProgress.classList.remove('hidden');
	    }
	
	    progressBar.style.width = `${progress}%`;
	    progressText.textContent = `上传进度：${progress}%`;
	
	    if (progress === 100) {
	        setTimeout(() => {
	            uploadProgress.classList.add('hidden');
	        }, 1000);
	    }
	}
	
	// 修改表单提交部分
	uploadForm.addEventListener('submit', function (e) {
	    e.preventDefault();
	
	    const previews = previewContainer.querySelectorAll('.file-item');
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
	    previews.forEach((preview) => {
	        const file = preview._file;
	        if (file) {
	            formData.append('images[]', file);
	        }
	    });
	
	    uploadBtn.disabled = true;
	    uploadBtn.innerHTML = '<span class="flex items-center justify-center"><svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>上传中...</span>';
	
	    // 重置并显示进度条
	    updateProgress(0);
	
	    const xhr = new XMLHttpRequest();
	    xhr.open('POST', '/upload', true);
	    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
	
	    xhr.upload.onprogress = function(e) {
	        if (e.lengthComputable) {
	            const progress = Math.round((e.loaded / e.total) * 100);
	            updateProgress(progress);
	        }
	    };
	
	    xhr.onload = function() {
	        if (xhr.status === 401) {
	            localStorage.removeItem('api_key');
	            updateApiKeyStatus(false);
	            showApiKeyOverlay();
	            showStatus('API 密钥无效或已过期', 'error');
	        } else if (xhr.status === 200) {
	            const response = JSON.parse(xhr.responseText);
	            let successCount = 0;
	            let errorCount = 0;
	
	            response.results.forEach((result) => {
	                if (result.status === 'success') {
	                    successCount++;
	                } else {
	                    errorCount++;
	                    showStatus(`文件 ${result.filename} 上传失败: ${result.message}`, 'error');
	                }
	            });
	
	            if (successCount > 0) {
	                showStatus(`成功上传 ${successCount} 个文件${errorCount > 0 ? `，${errorCount} 个文件失败` : ''}`, 'success');
	                resetUploadForm();
	            } else {
	                showStatus('所有文件上传失败', 'error');
	            }
	        } else {
	            showStatus('上传出错: ' + xhr.statusText, 'error');
	        }
	
	        uploadBtn.disabled = false;
	        uploadBtn.innerHTML = '上传图片';
	    };
	
	    xhr.onerror = function() {
	        showStatus('上传出错: 网络错误', 'error');
	        uploadBtn.disabled = false;
	        uploadBtn.innerHTML = '上传图片';
	    };
	
	    xhr.send(formData);
	});

	function resetUploadForm() {
		// 重置文件输入
		fileInput.value = ''

		// 添加淡出动画
		previewContainer.classList.add('fade-out')
		uploadBtnContainer.classList.add('fade-out')

		// 等待动画完成后清理
		setTimeout(() => {
			previewContainer.innerHTML = ''
			previewContainer.classList.add('hidden')
			previewContainer.classList.remove('fade-out')

			uploadBtnContainer.classList.add('hidden')
			uploadBtnContainer.classList.remove('fade-out')
		}, 300)
	}

	let statusTimeout

	function showStatus(message, type) {
		    // 清除之前的计时器
		    if (statusTimeout) {
		        clearTimeout(statusTimeout)
		    }
	
		    statusContainer.classList.remove('hidden', 'bg-green-50', 'bg-red-50', 'bg-indigo-50', 'bg-green-900', 'bg-red-900', 'bg-indigo-900')
		    statusContainer.innerHTML = ''
	
		    let icon, bgColor, textColor, borderColor
		    const isDarkMode = htmlElement.classList.contains('dark')
	
		    switch (type) {
		        case 'success':
		            icon = '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
		            bgColor = isDarkMode ? 'bg-green-900' : 'bg-green-50'
		            textColor = isDarkMode ? 'text-green-200' : 'text-green-800'
		            borderColor = isDarkMode ? 'border-green-800' : 'border-green-200'
		            break
		        case 'error':
		            icon = '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>'
		            bgColor = isDarkMode ? 'bg-red-900' : 'bg-red-50'
		            textColor = isDarkMode ? 'text-red-200' : 'text-red-800'
		            borderColor = isDarkMode ? 'border-red-800' : 'border-red-200'
		            break
		        case 'info':
		            icon = '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
		            bgColor = isDarkMode ? 'bg-indigo-900' : 'bg-indigo-50'
		            textColor = isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
		            borderColor = isDarkMode ? 'border-indigo-800' : 'border-indigo-200'
		            break
		    }
	
		    statusContainer.classList.add(bgColor, textColor, borderColor, 'border', 'rounded-lg', 'p-4', 'mb-4')
		    statusContainer.innerHTML = `
		        <div class="flex items-center">
		            <div class="flex-shrink-0">${icon}</div>
		            <div class="ml-3">
		                <p class="text-sm font-medium">${message}</p>
		            </div>
		        </div>
		    `
	
		    // 设置3秒后自动隐藏
		    statusTimeout = setTimeout(() => {
		        statusContainer.classList.add('hidden')
		    }, 3000)
		}

	

	// Helper function to check dark mode
	function isDarkMode() {
		return document.documentElement.classList.contains('dark')
	}

	function formatFileSize(bytes) {
		if (bytes < 1024) return bytes + ' B'
		else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB'
		else return (bytes / 1048576).toFixed(2) + ' MB'
	}

	// 点击整个拖放区域也触发文件选择
	dropZone.addEventListener('click', (e) => {
		// 如果点击的是选择按钮，不要再次触发文件选择
		if (e.target === selectBtn || selectBtn.contains(e.target)) {
			return
		}
		fileInput.click()
	})
})
