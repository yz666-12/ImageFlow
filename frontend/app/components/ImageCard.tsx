import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { copyToClipboard } from '../utils/clipboard'
import { ImageCardProps } from '../types'

const getFormatLabel = (format: string) => {
  switch (format) {
    case 'original':
      return '原始'
    case 'webp':
      return 'WebP'
    case 'avif':
      return 'AVIF'
    case 'gif':
      return 'GIF'
    default:
      return format
  }
}

const getOrientationLabel = (orientation: string) => {
  switch (orientation) {
    case 'landscape':
      return '横向'
    case 'portrait':
      return '纵向'
    case 'gif':
      return 'GIF'
    default:
      return orientation
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ImageCard({ image, onClick }: ImageCardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const aspectRatioClass = image.orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-video'
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await copyToClipboard(image.url)
    if (success) {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }
  
  return (
    <motion.div 
      className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all transform cursor-pointer"
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`relative ${aspectRatioClass} bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center`}>
        <motion.div
          className="w-full h-full"
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={image.url}
            alt={image.filename}
            fill
            className="object-cover"
          />
        </motion.div>
        <motion.div 
          className="absolute top-2 right-2 flex gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="px-2 py-1 bg-indigo-500 bg-opacity-80 text-white text-xs rounded-md">
            {getFormatLabel(image.format)}
          </span>
          <span className="px-2 py-1 bg-purple-500 bg-opacity-80 text-white text-xs rounded-md">
            {getOrientationLabel(image.orientation)}
          </span>
        </motion.div>
        
        <motion.button
          onClick={handleCopy}
          className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCopied ? (
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-green-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </motion.svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
          )}
        </motion.button>
      </div>
      <motion.div 
        className="p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="truncate text-gray-800 dark:text-gray-200 font-medium">
          {image.filename}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {formatFileSize(image.size)}
        </div>
      </motion.div>
    </motion.div>
  )
} 