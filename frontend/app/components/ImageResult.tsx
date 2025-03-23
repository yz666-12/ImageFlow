'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getFullUrl } from '../utils/baseUrl'

interface ImageResultProps {
  result: {
    filename: string;
    status: 'success' | 'error';
    message: string;
    format?: string;
    urls?: {
      original: string;
      webp: string;
      avif: string;
    };
  }
  index: number;
}

export default function ImageResult({ result, index }: ImageResultProps) {
  const [copyStatus, setCopyStatus] = useState<{type: string} | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  const handleCopy = (text: string, type: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation(); // 阻止冒泡
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({type})
      setTimeout(() => {
        setCopyStatus(null)
      }, 2000)
    })
  }
  
  // 处理URL，确保都是完整路径
  const getProcessedUrl = (url: string | undefined) => {
    if (!url) return '';
    return getFullUrl(url);
  }
  
  const originalUrl = getProcessedUrl(result.urls?.original);
  const webpUrl = getProcessedUrl(result.urls?.webp);
  const avifUrl = getProcessedUrl(result.urls?.avif);

  // 判断失败还是成功状态
  if (result.status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm"
      >
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">{result.filename}</p>
            <p className="text-sm">{result.message}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // 成功状态下的卡片
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="h-full flex flex-col">
          <div className="relative aspect-square w-full flex-shrink-0 bg-slate-50 dark:bg-slate-900 overflow-hidden group">
            <Image 
              src={originalUrl}
              alt={result.filename}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white text-sm font-medium truncate">{result.filename}</p>
            </div>
            <div className="absolute top-2 right-2">
              <span className="text-xs px-2 py-1 bg-green-500/90 text-white rounded-full">
                完成
              </span>
            </div>
          </div>
          <div className="p-3 text-center">
            <button className="w-full py-2 px-3 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
              查看详情
            </button>
          </div>
        </div>
      </motion.div>

      {/* 模态框 */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowModal(false)}
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
                <h3 className="text-xl font-semibold">{result.filename}</h3>
                <button 
                  onClick={() => setShowModal(false)}
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
                        alt={result.filename}
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
                            ![{result.filename}]({originalUrl})
                          </div>
                          <button 
                            onClick={(e) => handleCopy(`![${result.filename}](${originalUrl})`, 'markdown', e)}
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
                className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end"
              >
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
                >
                  关闭
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 