'use client'

import { useState, useEffect } from 'react'
import { getApiKey, validateApiKey, setApiKey } from './utils/auth'
import { api } from './utils/request'
import ApiKeyModal from './components/ApiKeyModal'
import { UploadResponse, StatusMessage as StatusMessageType } from './types'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import StatusMessage from './components/StatusMessage'
import UploadProgress from './components/UploadProgress'
import ImageSidebar from './components/ImageSidebar'
import UsageTips from './components/UsageTips'
import { motion } from 'framer-motion'

export default function Home() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<StatusMessageType | null>(null)
  const [uploadResults, setUploadResults] = useState<UploadResponse['results']>([])
  const [showSidebar, setShowSidebar] = useState(false)

  // 监听上传结果变化，当有新上传结果时自动打开侧边栏
  useEffect(() => {
    if (uploadResults.length > 0 && !showSidebar) {
      setShowSidebar(true)
    }
  }, [uploadResults])

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

  const handleUpload = async (selectedFiles: File[]) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 模拟进度条
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 300)
      
      const result = await api.upload<UploadResponse>('/upload', selectedFiles)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // 为每个结果添加唯一ID和路径，以兼容侧边栏组件
      const resultsWithIds = result.results.map(item => ({
        ...item,
        id: Math.random().toString(36).substring(2),
        path: item.urls?.original || ''
      }))
      
      setUploadResults(resultsWithIds)
      const successCount = resultsWithIds.filter(r => r.status === 'success').length
      const errorCount = resultsWithIds.filter(r => r.status === 'error').length
      const totalCount = resultsWithIds.length
      
      setStatus({
        type: errorCount === 0 ? 'success' : 'warning',
        message: `上传完成：共${totalCount}张，${successCount}张成功，${errorCount}张失败`
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message: '上传失败，请重试'
      })
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000) // 延迟清除进度条
    }
  }

  const handleDeleteImage = async (id: string) => {
    try {
      // 这里添加实际的删除API调用
      // await api.delete(`/images/${id}`);
      
      // 更新本地状态，移除已删除的图片
      setUploadResults(prev => prev.filter(item => item.id !== id))
      
      // 如果删除后没有图片了，关闭侧边栏
      if (uploadResults.length <= 1) {
        setShowSidebar(false)
      }
      
      setStatus({
        type: 'success',
        message: '图片已成功删除'
      })
      
      return Promise.resolve()
    } catch (error) {
      setStatus({
        type: 'error',
        message: '删除图片失败，请重试'
      })
      return Promise.reject()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Header onApiKeyClick={() => setShowApiKeyModal(true)} />
      
      <UploadSection onUpload={handleUpload} isUploading={isUploading} />
      
      {status && <StatusMessage type={status.type} message={status.message} />}
      
      {/* 添加一个查看图片按钮，只有在有上传结果且侧边栏关闭时显示 */}
      {uploadResults.length > 0 && !showSidebar && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowSidebar(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-20 flex items-center justify-center"
          title="查看已上传图片"
        >
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{uploadResults.length}</span>
          </div>
        </motion.button>
      )}

      {isUploading && <UploadProgress progress={uploadProgress} />}

      {/* 图片侧边栏 */}
      <ImageSidebar 
        isOpen={showSidebar}
        results={uploadResults}
        onClose={() => setShowSidebar(false)}
        onDelete={handleDeleteImage}
      />

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