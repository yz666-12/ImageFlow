'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TagSelectorProps {
  selectedTags: string[]
  availableTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function TagSelector({ selectedTags, availableTags, onTagsChange }: TagSelectorProps) {
  const [inputTag, setInputTag] = useState('')
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const tagMenuRef = useRef<HTMLDivElement>(null)

  const handleTagToggle = (tag: string) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    )
    setIsTagMenuOpen(false)
  }

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTag(e.target.value)
  }

  const handleAddTag = () => {
    if (inputTag.trim()) {
      const newTag = inputTag.trim()
      if (!selectedTags.includes(newTag)) {
        onTagsChange([...selectedTags, newTag])
      }
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

  const filteredTags = searchQuery.trim() === ''
    ? availableTags.filter(tag => !selectedTags.includes(tag))
    : availableTags.filter(tag =>
        !selectedTags.includes(tag) &&
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )

  return (
    <div className="mb-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center text-gray-800 dark:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          添加标签
        </h3>

        <div className="relative" ref={tagMenuRef}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={toggleTagMenu}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-1 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            添加标签
          </motion.button>

          <AnimatePresence>
            {isTagMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
              >
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <h4 className="font-medium">选择或创建标签</h4>
                </div>

                <div className="p-3 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="搜索标签..."
                      className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="p-3 max-h-48 overflow-y-auto">
                  <h5 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 font-medium">可用标签</h5>
                  {filteredTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredTags.map((tag) => (
                        <motion.button
                          type="button"
                          key={tag}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleTagToggle(tag)}
                          className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                        >
                          {tag}
                        </motion.button>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                      未找到匹配的标签
                    </div>
                  ) : availableTags.length === 0 ? (
                    <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                      暂无可用标签
                    </div>
                  ) : (
                    <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                      所有标签已选择
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                  <h5 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 font-medium">创建新标签</h5>
                  <div className="flex">
                    <input
                      type="text"
                      value={inputTag}
                      onChange={handleTagInput}
                      placeholder="输入新标签名称"
                      className="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 rounded-r-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium transition-colors duration-200 text-sm flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      添加
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">已选标签：</p>

        <div className="flex flex-wrap gap-2">
          {selectedTags.length > 0 ? (
            selectedTags.map(tag => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center shadow-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1.5 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">暂未选择标签</p>
          )}
        </div>
      </div>
    </div>
  )
} 