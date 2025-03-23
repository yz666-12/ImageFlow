'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
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
  
  const handleCopy = (text: string, type: string) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card p-0 rounded-xl overflow-hidden mb-6 bg-light-bg-secondary dark:bg-slate-800/80 border border-light-border dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {result.status === 'success' && result.urls && (
        <>
          <div className="p-4 flex items-center justify-between border-b border-light-border dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-xl">{result.filename}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  上传成功 · {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="text-sm px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full shadow-sm">
              {result.message}
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-80 p-4 md:border-r border-light-border dark:border-slate-700 bg-light-bg-secondary/50 dark:bg-slate-800/50">
              <div className="overflow-hidden rounded-lg border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
                <div className="aspect-square relative">
                  <Image 
                    src={originalUrl}
                    alt={result.filename}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                  <div className="font-medium text-lg">原始图片</div>
                </div>
                
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                  <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                    {originalUrl || ''}
                  </div>
                  <div className="absolute left-0 -top-10 bg-black/80 text-white text-xs rounded-md p-2 invisible group-hover:visible transition-all duration-200 w-auto max-w-[90%] truncate shadow-lg">
                    {originalUrl || ''}
                  </div>
                  <button 
                    onClick={() => handleCopy(originalUrl || '', 'original')}
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
                
                {webpUrl && (
                  <>
                    <div className="flex items-center gap-3 group mt-6">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="font-medium text-lg">WebP 格式</div>
                    </div>
                    
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                      <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                        {webpUrl || ''}
                      </div>
                      <div className="absolute left-0 -top-10 bg-black/80 text-white text-xs rounded-md p-2 invisible group-hover:visible transition-all duration-200 w-auto max-w-[90%] truncate shadow-lg">
                        {webpUrl || ''}
                      </div>
                      <button 
                        onClick={() => handleCopy(webpUrl || '', 'webp')}
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
                  </>
                )}
                
                {avifUrl && (
                  <>
                    <div className="flex items-center gap-3 group mt-6">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="font-medium text-lg">AVIF 格式</div>
                    </div>
                    
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                      <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                        {avifUrl || ''}
                      </div>
                      <div className="absolute left-0 -top-10 bg-black/80 text-white text-xs rounded-md p-2 invisible group-hover:visible transition-all duration-200 w-auto max-w-[90%] truncate shadow-lg">
                        {avifUrl || ''}
                      </div>
                      <button 
                        onClick={() => handleCopy(avifUrl || '', 'avif')}
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
                  </>
                )}
                
                <div className="flex items-center gap-3 group mt-6">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="font-medium text-lg">Markdown 格式</div>
                </div>
                
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center group relative hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors duration-200">
                  <div className="flex-1 px-4 py-3 text-sm font-mono overflow-hidden text-ellipsis">
                    ![{result.filename}]({originalUrl || ''})
                  </div>
                  <div className="absolute left-0 -top-10 bg-black/80 text-white text-xs rounded-md p-2 invisible group-hover:visible transition-all duration-200 w-auto max-w-[90%] truncate shadow-lg">
                    ![{result.filename}]({originalUrl || ''})
                  </div>
                  <button 
                    onClick={() => handleCopy(`![${result.filename}](${originalUrl || ''})`, 'markdown')}
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
              </div>
            </div>
          </div>
        </>
      )}
      
      {result.status === 'error' && (
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-lg">{result.filename}</h4>
              <p className="text-sm text-red-600 dark:text-red-400">{result.message}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
} 