import { useState } from 'react'
import { ImageFiltersProps } from '../types'

export default function ImageFilters({ onFilterChange }: ImageFiltersProps) {
  const [format, setFormat] = useState('all')
  const [orientation, setOrientation] = useState('all')

  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat)
    onFilterChange(newFormat, orientation)
    console.log(newFormat, orientation)
  }

  const handleOrientationChange = (newOrientation: string) => {
    setOrientation(newOrientation)
    onFilterChange(format, newOrientation)
    console.log(format, newOrientation)
  }

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          格式
        </label>
        <select
          value={format}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          onChange={(e) => handleFormatChange(e.target.value)}
        >
          <option value="all">所有格式</option>
          <option value="original">原始格式</option>
          <option value="webp">WebP</option>
          <option value="avif">AVIF</option>
          <option value="gif">GIF</option>
        </select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          方向
        </label>
        <select
          value={orientation}
          disabled={format === 'gif'}
          className={`w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
            format === 'gif' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onChange={(e) => handleOrientationChange(e.target.value)}
        >
          <option value="all">所有方向</option>
          <option value="landscape">横向</option>
          <option value="portrait">纵向</option>
        </select>
      </div>
    </div>
  )
} 