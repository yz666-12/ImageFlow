import { useState } from 'react'
import { ImageFiltersProps } from '../types'
import { motion } from 'framer-motion'

export default function ImageFilters({ onFilterChange }: ImageFiltersProps) {
  const [format, setFormat] = useState('all')
  const [orientation, setOrientation] = useState('all')

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat)
    onFilterChange(newFormat, orientation)
  }

  const handleOrientationChange = (newOrientation: string) => {
    setOrientation(newOrientation)
    onFilterChange(format, newOrientation)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        筛选图片
      </h2>
      
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-[calc(50%-0.5rem)]">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            文件格式
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {['all', 'original', 'webp', 'avif', 'gif'].map((item) => (
              <button
                key={item}
                onClick={() => handleFormatChange(item)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  format === item
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {item === 'all' ? '全部' : item === 'original' ? '原始' : item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full md:w-[calc(50%-0.5rem)]">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            图片方向
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['all', 'landscape', 'portrait'].map((item) => (
              <button
                key={item}
                disabled={format === 'gif'}
                onClick={() => handleOrientationChange(item)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  format === 'gif'
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    : orientation === item
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {item === 'all' ? '全部' : item === 'landscape' ? '横向' : '纵向'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 