import { useState, useEffect, useRef } from 'react'
import { ImageFiltersProps } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../utils/request'

export default function ImageFilters({ onFilterChange }: ImageFiltersProps) {
  const [format, setFormat] = useState('all')
  const [orientation, setOrientation] = useState('all')
  const [tag, setTag] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [inputTag, setInputTag] = useState('')
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const tagMenuRef = useRef<HTMLDivElement>(null)

  // 获取可用标签列表
  useEffect(() => {
    // 从后端获取所有可用的标签
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

    fetchTags()
  }, [])

  // 点击外部关闭标签菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setIsTagMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 过滤标签
  const filteredTags = searchQuery.trim() === ''
    ? availableTags
    : availableTags.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat)
    onFilterChange(newFormat, orientation, tag)
  }

  const handleOrientationChange = (newOrientation: string) => {
    setOrientation(newOrientation)
    onFilterChange(format, newOrientation, tag)
  }

  const handleTagChange = (newTag: string) => {
    setTag(newTag)
    onFilterChange(format, orientation, newTag)
  }

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTag(e.target.value)
  }

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputTag.trim()) {
      handleTagChange(inputTag.trim())
      setInputTag('')
      setIsTagMenuOpen(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const toggleTagMenu = () => {
    setIsTagMenuOpen(!isTagMenuOpen)
    setSearchQuery('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <h2 className="text-lg font-semibold mb-5 flex items-center text-gray-800 dark:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        筛选图片
      </h2>

      <div className="flex flex-wrap gap-6">
        {/* 文件格式选择器 */}
        <div className="w-full md:w-[calc(50%-0.75rem)]">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            文件格式
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {['all', 'original', 'webp', 'avif', 'gif'].map((item) => (
              <motion.button
                key={item}
                onClick={() => handleFormatChange(item)}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${format === item
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {item === 'all' ? '全部' : item === 'original' ? '原始' : item.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 图片方向选择器 */}
        <div className="w-full md:w-[calc(50%-0.75rem)]">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            图片方向
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['all', 'landscape', 'portrait'].map((item) => (
              <motion.button
                key={item}
                disabled={format === 'gif'}
                onClick={() => handleOrientationChange(item)}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${format === 'gif'
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  : orientation === item
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {item === 'all' ? '全部' : item === 'landscape' ? '横向' : '纵向'}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 标签选择器 - 现代化设计 */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            标签分类
          </label>

          {/* 当前选中的标签显示 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTagChange('')}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center ${
                  tag === ''
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                全部
              </motion.button>

              {tag && tag !== '' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full text-sm font-medium flex items-center shadow-sm"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleTagChange('')}
                    className="ml-2 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}

              <div className="relative" ref={tagMenuRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTagMenu}
                  className="px-3 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  选择标签
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isTagMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {isTagMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-1 w-64 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="搜索标签..."
                            className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 text-sm"
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>

                      <div className="p-2">
                        {filteredTags.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1">
                            {filteredTags.map((tagItem) => (
                              <motion.button
                                key={tagItem}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleTagChange(tagItem)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left truncate ${
                                  tag === tagItem
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {tagItem}
                              </motion.button>
                            ))}
                          </div>
                        ) : searchQuery ? (
                          <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            未找到匹配的标签
                          </div>
                        ) : (
                          <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            暂无可用标签
                          </div>
                        )}
                      </div>

                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <form onSubmit={handleTagSubmit} className="flex">
                          <input
                            type="text"
                            value={inputTag}
                            onChange={handleTagInput}
                            placeholder="添加自定义标签"
                            className="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 text-sm"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 rounded-r-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-colors duration-200 text-sm"
                          >
                            添加
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
