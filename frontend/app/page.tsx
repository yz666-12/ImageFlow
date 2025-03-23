'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getApiKey, validateApiKey, setApiKey } from './utils/auth'
import { api } from './utils/request'
import ApiKeyModal from './components/ApiKeyModal'
import { useTheme } from './hooks/useTheme'
import { motion } from 'framer-motion'

interface UploadResponse {
  results: Array<{
    filename: string;
    status: 'success' | 'error';
    message: string;
    format?: string;
    urls?: {
      original: string;
      webp: string;
      avif: string;
    };
  }>;
}

export default function Home() {
  const { isDarkMode, toggleTheme } = useTheme()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)
  const [uploadResults, setUploadResults] = useState<UploadResponse['results']>([])

  useEffect(() => {
    // 检查API Key
    const checkApiKey = async () => {
      const apiKey = getApiKey()
      if (!apiKey) {
        setShowApiKeyModal(true)
        return
      }
      
      const isValid = await validateApiKey(apiKey)
      if (!isValid) {
        setShowApiKeyModal(true)
        setStatus({
          type: 'error',
          message: 'API Key无效,请重新验证'
        })
      }
    }
    
    checkApiKey()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('active')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('active')
  }

  const removePreview = () => {
    setSelectedFiles([])
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) return

    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResults([])

    try {
      const result = await api.upload<UploadResponse>('/upload', selectedFiles)
      
      setUploadResults(result.results)
      const successCount = result.results.filter(r => r.status === 'success').length
      const errorCount = result.results.filter(r => r.status === 'error').length
      
      setStatus({
        type: errorCount === 0 ? 'success' : 'warning',
        message: `上传完成：${successCount}个成功，${errorCount}个失败`
      })
      
      if (errorCount === 0) {
        setSelectedFiles([])
        setPreviewUrl(null)
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: '上传失败，请重试'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <div className="bg-gradient-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-primary">
            ImageFlow
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/manage" className="btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </Link>
          
          <button onClick={() => setShowApiKeyModal(true)} className="btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
          
          <button onClick={toggleTheme} className="btn-icon">
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
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
            <p className="text-lg font-medium mb-2">拖放图片到这里</p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">或者点击选择文件</p>
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
          
          {previewUrl && (
            <div className="mb-6">
              <div className="relative rounded-xl overflow-hidden bg-light-bg-primary dark:bg-dark-bg-primary">
                <Image
                  src={previewUrl}
                  alt="预览"
                  width={400}
                  height={400}
                  className="max-h-80 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={removePreview}
                  className="absolute top-2 right-2 btn-icon"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
      
      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mb-8 p-4 rounded-xl ${
            status.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
              : status.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}
        >
          {status.message}
        </motion.div>
      )}
      
      {uploadResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">上传结果</h3>
          <div className="space-y-2">
            {uploadResults.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg ${
                  result.status === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.filename}</span>
                  <span className="text-sm">{result.message}</span>
                </div>
                {result.status === 'success' && result.urls && (
                  <div className="mt-2 text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">原始格式：</span>
                      <a href={result.urls.original} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300">
                        查看
                      </a>
                    </div>
                    {result.urls.webp && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">WebP：</span>
                        <a href={result.urls.webp} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300">
                          查看
                        </a>
                      </div>
                    )}
                    {result.urls.avif && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">AVIF：</span>
                        <a href={result.urls.avif} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300">
                          查看
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {isUploading && (
        <div>
          <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-xl overflow-hidden mb-4">
            <div
              className="h-2 bg-gradient-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            上传进度: {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      <ApiKeyModal 
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={(apiKey) => {
          setApiKey(apiKey)
          setShowApiKeyModal(false)
          setStatus({
            type: 'success',
            message: 'API Key验证成功！'
          })
        }}
      />
    </div>
  )
} 