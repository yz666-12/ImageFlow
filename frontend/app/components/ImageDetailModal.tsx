'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getFullUrl } from '../utils/baseUrl'

interface ImageDetailModalProps {
  isOpen: boolean
  onClose: () => void
  image: {
    filename: string
    status: 'success' | 'error'
    message?: string
    format?: string
    urls?: {
      original: string
      webp: string
      avif: string
    }
    id?: string
    path?: string
  } | null
  onDelete?: (id: string) => Promise<void>
}

export default function ImageDetailModal({ isOpen, onClose, image, onDelete }: ImageDetailModalProps) {
  const [copyStatus, setCopyStatus] = useState<{type: string} | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  if (!image || image.status !== 'success' || !image.urls) {
    return null
  }
  
  const handleCopy = (text: string, type: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation() // 阻止冒泡
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({type})
      setTimeout(() => {
        setCopyStatus(null)
      }, 2000)
    })
  }
  
  // 处理URL，确保都是完整路径
  const getProcessedUrl = (url: string | undefined) => {
    if (!url) return ''
    return getFullUrl(url)
  }
  
  const originalUrl = getProcessedUrl(image.urls.original)
  const webpUrl = getProcessedUrl(image.urls.webp)
  const avifUrl = getProcessedUrl(image.urls.avif)

  // 处理删除图片
  const handleDelete = async () => {
    if (!image || !image.id || !onDelete) return
    
    try {
      setIsDeleting(true)
      await onDelete(image.id)
      onClose()
    } catch (err) {
      console.error("删除失败:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold">{image.filename}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-2/5 p-4 md:border-r border-slate-200 dark:border-slate-700">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <Image 
                      src={originalUrl}
                      alt={image.filename}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-contain"
                    />
                  </motion.div>
                  <div className="mt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      上传时间: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <h4 className="text-lg font-medium mb-4">可用格式</h4>
                  
                  <div className="space-y-6">
                    {/* 原始图片链接 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                        <div className="font-medium">原始图片</div>
                      </div>
                      
                      <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                        <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                          {originalUrl}
                        </div>
                        <button 
                          onClick={(e) => handleCopy(originalUrl, 'original', e)}
                          className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r-lg transition-colors duration-200 relative"
                          title="复制链接"
                        >
                          {copyStatus && copyStatus.type === 'original' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {copyStatus && copyStatus.type === 'original' && (
                            <span className="absolute -top-8 right-0 bg-black/70 text-white text-xs rounded px-2 py-1">
                              已复制!
                            </span>
                          )}
                        </button>
                      </div>
                    </motion.div>
                    
                    {/* WebP 格式链接 */}
                    {webpUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="font-medium">WebP 格式</div>
                        </div>
                        
                        <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                          <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                            {webpUrl}
                          </div>
                          <button 
                            onClick={(e) => handleCopy(webpUrl, 'webp', e)}
                            className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r-lg transition-colors duration-200 relative"
                            title="复制链接"
                          >
                            {copyStatus && copyStatus.type === 'webp' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                            {copyStatus && copyStatus.type === 'webp' && (
                              <span className="absolute -top-8 right-0 bg-black/70 text-white text-xs rounded px-2 py-1">
                                已复制!
                              </span>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* AVIF 格式链接 */}
                    {avifUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="font-medium">AVIF 格式</div>
                        </div>
                        
                        <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                          <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                            {avifUrl}
                          </div>
                          <button 
                            onClick={(e) => handleCopy(avifUrl, 'avif', e)}
                            className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r-lg transition-colors duration-200 relative"
                            title="复制链接"
                          >
                            {copyStatus && copyStatus.type === 'avif' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                            {copyStatus && copyStatus.type === 'avif' && (
                              <span className="absolute -top-8 right-0 bg-black/70 text-white text-xs rounded px-2 py-1">
                                已复制!
                              </span>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Markdown 格式链接 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div className="font-medium">Markdown 格式</div>
                      </div>
                      
                      <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                        <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                          ![{image.filename}]({originalUrl})
                        </div>
                        <button 
                          onClick={(e) => handleCopy(`![${image.filename}](${originalUrl})`, 'markdown', e)}
                          className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r-lg transition-colors duration-200 relative"
                          title="复制链接"
                        >
                          {copyStatus && copyStatus.type === 'markdown' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          {copyStatus && copyStatus.type === 'markdown' && (
                            <span className="absolute -top-8 right-0 bg-black/70 text-white text-xs rounded px-2 py-1">
                              已复制!
                            </span>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between"
            >
              {onDelete && (
                <div>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除图片
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm"
                        disabled={isDeleting}
                      >
                        取消
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm flex items-center"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            处理中
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            确认删除
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 