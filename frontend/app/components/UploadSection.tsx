'use client'

import { useState, useEffect } from 'react'
import UploadDropzone from './upload/UploadDropzone'
import ExpirySelector from './ExpirySelector'
import TagSelector from './upload/TagSelector'
import ImagePreviewGrid from './upload/ImagePreviewGrid'
import { api } from '../utils/request'

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
  const [expiryMinutes, setExpiryMinutes] = useState<number>(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // 获取可用标签列表
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

  // 首次加载时获取标签
  useEffect(() => {
    fetchTags()
  }, [])

  // 监听上传状态变化，当上传完成时清空选择的文件
  useEffect(() => {
    if (wasUploading && !isUploading) {
      setSelectedFiles([])
      setPreviewUrls([])
      setExceedsLimit(false)
    }
    setWasUploading(isUploading)
  }, [isUploading, wasUploading])

  const handleFilesSelected = (files: File[]) => {
    if (files.length > maxUploadCount) {
      const allowedFiles = files.slice(0, maxUploadCount)
      setSelectedFiles(allowedFiles)
      setExceedsLimit(true)
      generatePreviews(allowedFiles)
    } else {
      setSelectedFiles(files)
      setExceedsLimit(false)
      generatePreviews(files)
    }
  }

  const generatePreviews = (files: File[]) => {
    const newPreviews = files.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      url: '',
      file
    }))

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

  const handleRemoveFile = (id: string) => {
    const updatedPreviews = previewUrls.filter(preview => preview.id !== id)
    setPreviewUrls(updatedPreviews)
    const updatedFiles = selectedFiles.filter(file => {
      return updatedPreviews.some(preview => preview.file === file)
    })
    setSelectedFiles(updatedFiles)
    setExceedsLimit(updatedFiles.length >= maxUploadCount)
  }

  const handleRemoveAllFiles = () => {
    setSelectedFiles([])
    setPreviewUrls([])
    setExceedsLimit(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return
    await onUpload(selectedFiles, expiryMinutes, selectedTags)
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
        <UploadDropzone
          onFilesSelected={handleFilesSelected}
          maxUploadCount={maxUploadCount}
        />

        <ExpirySelector onChange={setExpiryMinutes} />

        <TagSelector
          selectedTags={selectedTags}
          availableTags={availableTags}
          onTagsChange={setSelectedTags}
          onNewTagCreated={fetchTags}
        />

        {exceedsLimit && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 shadow-sm">
            <div className="flex items-start">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">超出上传限制</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  一次最多只能上传 <span className="font-medium">{maxUploadCount}</span> 张图片。已自动选择前 {maxUploadCount} 张。
                </p>
              </div>
            </div>
          </div>
        )}

        {previewUrls.length > 0 && (
          <ImagePreviewGrid
            previews={previewUrls}
            onRemoveFile={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
          />
        )}

        {selectedFiles.length > 0 && (
          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl shadow-md transition-all duration-200 font-medium text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在上传...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                开始上传
              </>
            )}
          </button>
        )}
      </form>
    </div>
  )
}
