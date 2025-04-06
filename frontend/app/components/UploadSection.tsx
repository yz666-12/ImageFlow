'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import ExpirySelector from './ExpirySelector'
import { api } from '../utils/request'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadSectionProps {
  onUpload: (files: File[], expiryMinutes: number, tags: string[]) => Promise<void>
  isUploading: boolean
  maxUploadCount?: number
}

export default function UploadSection({ onUpload, isUploading, maxUploadCount = 10 }: UploadSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<{ id: string, url: string, file: File }[]>([])
  const [wasUploading, setWasUploading] = useState(false)
  const [exceedsLimit, setExceedsLimit] = useState(false)
  const [expiryMinutes, setExpiryMinutes] = useState<number>(0) // 默认为0，表示永不过期
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [inputTag, setInputTag] = useState('')
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const tagMenuRef = useRef<HTMLDivElement>(null)

  // 可用标签列表
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // 获取可用标签列表
  useEffect(() => {
    // 从后端获取所有可用的标签
    const fetchTags = async () => {
      try {
        const response = await api.get<{ tags: string[] }>('/api/tags')
        if (response.tags && response.tags.length > 0) {
          setAvailableTags(response.tags)
        }
      } catch (error) {
        console.error('获取标签失败:', error)
      }
    }

    fetchTags()
  }, [])

  // 点击外部关闭标签菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setIsTagMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])



  // 监听上传状态变化，当上传完成时清空选择的文件
  useEffect(() => {
    // 检测从"正在上传"变为"上传完成"的状态变化
    if (wasUploading && !isUploading) {
      // 上传已完成，清空文件列表
      setSelectedFiles([])
      setPreviewUrls([])
      setExceedsLimit(false)

      // Reset the file input element
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    }
    // 更新前一个上传状态
    setWasUploading(isUploading)
  }, [isUploading, wasUploading])

  const processFiles = (files: File[]) => {
    // 检查是否超过最大上传数量
    if (files.length > maxUploadCount) {
      // 截取允许的最大数量
      const allowedFiles = files.slice(0, maxUploadCount)
      setSelectedFiles(allowedFiles)
      setExceedsLimit(true)

      // 为允许的文件创建预览
      generatePreviews(allowedFiles)
    } else {
      setSelectedFiles(files)
      setExceedsLimit(false)

      // 为所有文件创建预览
      generatePreviews(files)
    }
  }

  const generatePreviews = (files: File[]) => {
    // 生成多图预览
    const newPreviews = files.map(file => {
      const id = Math.random().toString(36).substring(2, 11)
      return { id, url: '', file }
    })

    // 为每个文件创建预览URL
    newPreviews.forEach((preview, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrls(prev => {
          const updated = [...prev]
          const idx = updated.findIndex(p => p.id === preview.id)
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], url: e.target?.result as string }
          }
          return updated
        })
      }
      reader.readAsDataURL(files[index])
    })

    setPreviewUrls(newPreviews)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('active')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('active')
  }

  const removePreview = (id: string) => {
    const updatedPreviews = previewUrls.filter(preview => preview.id !== id)
    setPreviewUrls(updatedPreviews)

    // 更新选中的文件列表
    const updatedFiles = selectedFiles.filter(file => {
      return updatedPreviews.some(preview => preview.file === file)
    })
    setSelectedFiles(updatedFiles)

    // 检查是否仍然超过限制
    setExceedsLimit(updatedFiles.length >= maxUploadCount)
  }

  const removeAllPreviews = () => {
    setSelectedFiles([])
    setPreviewUrls([])
    setExceedsLimit(false)

    // Reset the file input element
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // 处理标签选择
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      // 如果标签已经选中，则移除它
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      }
      // 否则添加它
      return [...prev, tag]
    })
    setIsTagMenuOpen(false)
  }

  // 处理自定义标签输入
  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTag(e.target.value)
  }

  // 添加自定义标签
  const handleAddTag = () => {
    if (inputTag.trim()) {
      const newTag = inputTag.trim()
      if (!selectedTags.includes(newTag)) {
        setSelectedTags(prev => [...prev, newTag])
      }
      setInputTag('')
      setIsTagMenuOpen(false)
    }
  }

  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // 切换标签菜单
  const toggleTagMenu = () => {
    setIsTagMenuOpen(!isTagMenuOpen)
    setSearchQuery('')
  }

  // 计算过滤后的标签
  const filteredTags = searchQuery.trim() === ''
    ? availableTags.filter(tag => !selectedTags.includes(tag))
    : availableTags.filter(tag =>
        !selectedTags.includes(tag) &&
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return

    await onUpload(selectedFiles, expiryMinutes, selectedTags)
    // 成功上传后，状态清理在父组件进行
  }

  const handleExpiryChange = (minutes: number) => {
    setExpiryMinutes(minutes)
  }

  return (
    <div className="card p-8 mb-8">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        上传图片
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          className="drop-zone mb-6 flex flex-col items-center justify-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="mb-4 bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">拖放多张图片到这里</p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">或者点击选择文件（可多选）</p>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">最多可选择 {maxUploadCount} 张图片</p>
          <input
            type="file"
            id="file-input"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => document.getElementById('file-input')?.click()}
            className="btn-primary px-4 py-2"
          >
            选择图片
          </button>
        </div>

        {/* 过期时间选择器 */}
        <ExpirySelector onChange={handleExpiryChange} />

        {/* 标签选择器 */}
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4 flex items-center text-gray-800 dark:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            添加标签
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            选择或添加标签以分类您的图片，便于后续筛选和管理。
          </p>

          {/* 标签选择器 - 现代化设计 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">图片标签：</p>

            {/* 已选标签展示 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.length > 0 ? (
                selectedTags.map(tag => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center shadow-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="ml-2 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">暂未选择标签</p>
              )}

              {/* 添加标签按钮 */}
              <div className="relative" ref={tagMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTagMenu}
                  className="px-3 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  添加标签
                </motion.button>

                <AnimatePresence>
                  {isTagMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-1 w-64 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="搜索标签..."
                            className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 text-sm"
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>

                      {/* 可选标签列表 */}
                      <div className="p-2">
                        {filteredTags.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1">
                            {filteredTags.map((tag) => (
                              <motion.button
                                key={tag}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTagToggle(tag)}
                                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left truncate hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </motion.button>
                            ))}
                          </div>
                        ) : searchQuery ? (
                          <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            未找到匹配的标签
                          </div>
                        ) : availableTags.length === 0 ? (
                          <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            暂无可用标签
                          </div>
                        ) : (
                          <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            所有标签已选择
                          </div>
                        )}
                      </div>

                      {/* 自定义标签输入 */}
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex">
                          <input
                            type="text"
                            value={inputTag}
                            onChange={handleTagInput}
                            placeholder="添加自定义标签"
                            className="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 text-sm"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag()}
                            className="px-3 py-2 rounded-r-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-colors duration-200 text-sm"
                          >
                            添加
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {exceedsLimit && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>超出上传限制：</strong>一次最多只能上传 {maxUploadCount} 张图片。已自动选择前 {maxUploadCount} 张。
              </span>
            </div>
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">已选择 {previewUrls.length} 张图片</h3>
              <button
                type="button"
                onClick={removeAllPreviews}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                清除全部
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {previewUrls.map(preview => (
                <div key={preview.id} className="relative group rounded-lg overflow-hidden bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
                  {preview.url ? (
                    <div className="aspect-square relative">
                      <Image
                        src={preview.url}
                        alt={preview.file.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200"></div>
                      <button
                        type="button"
                        onClick={() => removePreview(preview.id)}
                        className="absolute top-1 right-1 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 5a2 2 0 10-4 0 2 2 0 004 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-2 text-xs truncate">{preview.file.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3 btn-primary disabled:opacity-50"
          >
            {isUploading ? '上传中...' : '上传图片'}
          </button>
        )}
      </form>
    </div>
  )
}
