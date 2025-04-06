'use client'

import { useState } from 'react'
import { ImageData } from '../../types/image'

interface DeleteButtonProps {
  image: ImageData
  onDelete: (id: string) => Promise<void>
}

export function DeleteButton({ image, onDelete }: DeleteButtonProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)

      let imageId = image.id

      // If the ID is not available or not reliable, extract it from the URL
      if (!imageId && image.urls?.original) {
        const urlParts = image.urls.original.split('/')
        const filename = urlParts[urlParts.length - 1]
        imageId = filename.split('.')[0] // Remove file extension to get ID
      }

      if (!imageId) {
        throw new Error("无法获取图像ID")
      }

      await onDelete(imageId)
    } catch (err) {
      console.error("删除失败:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!showDeleteConfirm) {
    return (
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        删除图片
      </button>
    )
  }

  return (
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
  )
} 