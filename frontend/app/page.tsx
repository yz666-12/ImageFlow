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

// 环境变量中的最大上传数量，如果没有则默认为10
const MAX_UPLOAD_COUNT = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_COUNT || '10', 10);

export default function Home() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<StatusMessageType | null>(null)
  const [uploadResults, setUploadResults] = useState<UploadResponse['results']>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [isKeyVerified, setIsKeyVerified] = useState(false)
  const [maxUploadCount, setMaxUploadCount] = useState(10)

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
        setIsKeyVerified(false)
        return
      }

      const isValid = await validateApiKey(apiKey)
      if (!isValid) {
        setShowApiKeyModal(true)
        setIsKeyVerified(false)
        setStatus({
          type: 'error',
          message: 'API Key无效,请重新验证'
        })
      } else {
        setIsKeyVerified(true)
      }
    }

    checkApiKey()
  }, [])

  useEffect(() => {
    // 获取配置
    const fetchConfig = async () => {
      try {
        const response = await api.request<{ maxUploadCount: number }>('/api/config')
        setMaxUploadCount(response.maxUploadCount)
      } catch (error) {
        console.error('Failed to fetch config:', error)
        // 如果获取失败，使用默认值
        setMaxUploadCount(10)
      }
    }

    fetchConfig()
  }, [])

  const handleUpload = async (selectedFiles: File[]) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setStatus(null)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 300)

      const result = await api.upload<UploadResponse>('/api/upload', selectedFiles)

      clearInterval(progressInterval)
      setUploadProgress(100)

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
      let errorMessage = '上传失败，请重试'

      if (error instanceof Error) {
        if (error.message.includes('超过最大上传数量') || error.message.includes('maximum upload')) {
          errorMessage = `上传失败：超过最大上传数量限制（${maxUploadCount}张图片）`
        } else {
          errorMessage = `上传失败：${error.message}`
        }
      }

      setStatus({
        type: 'error',
        message: errorMessage
      })
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleDeleteImage = async (id: string) => {
    try {
      const image = uploadResults.find((img) => img.id === id);
      if (!image) return;

      const response = await api.post<{ success: boolean; message: string }>(
        "/api/delete-image",
        {
          id: image.id
        }
      );

      if (response.success) {
        // 从当前列表中移除已删除的图片
        setUploadResults(prev => prev.filter(item => item.id !== id));

        // 如果删除后没有图片了，关闭侧边栏
        if (uploadResults.length <= 1) {
          setShowSidebar(false);
        }

        setStatus({
          type: 'success',
          message: response.message
        });
      } else {
        setStatus({
          type: 'error',
          message: response.message
        });
      }
    } catch (error) {
      console.error('删除失败:', error);
      setStatus({
        type: 'error',
        message: '删除失败，请重试'
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Header onApiKeyClick={() => setShowApiKeyModal(true)} isKeyVerified={isKeyVerified} />

      <UploadSection
        onUpload={handleUpload}
        isUploading={isUploading}
        maxUploadCount={MAX_UPLOAD_COUNT}
      />

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
          setIsKeyVerified(true)
          setStatus({
            type: 'success',
            message: 'API Key验证成功！'
          })
        }}
      />
    </div>
  )
} 
