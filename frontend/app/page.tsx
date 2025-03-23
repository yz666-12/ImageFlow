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
import ImageResults from './components/ImageResults'
import UsageTips from './components/UsageTips'
import Footer from './components/Footer'

export default function Home() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState<StatusMessageType | null>(null)
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

  const handleUpload = async (selectedFiles: File[]) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResults([])

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
      
      setUploadResults(result.results)
      const successCount = result.results.filter(r => r.status === 'success').length
      const errorCount = result.results.filter(r => r.status === 'error').length
      const totalCount = result.results.length
      
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Header onApiKeyClick={() => setShowApiKeyModal(true)} />
      
      <UploadSection onUpload={handleUpload} isUploading={isUploading} />
      
      {status && <StatusMessage type={status.type} message={status.message} />}
      
      <ImageResults results={uploadResults} />

      {isUploading && <UploadProgress progress={uploadProgress} />}
      
      <UsageTips />
      
      <Footer />

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