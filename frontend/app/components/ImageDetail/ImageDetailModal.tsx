'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ImageData } from '../../types/image'
import { ImagePreview } from './ImagePreview'
import { ImageInfo } from './ImageInfo'
import { ImageUrls } from './ImageUrls'
import { DeleteButton } from './DeleteButton'
import { Cross1Icon } from '../ui/icons'

interface ImageDetailModalProps {
  isOpen: boolean
  onClose: () => void
  image: ImageData | null
  onDelete?: (id: string) => Promise<void>
}

export default function ImageDetailModal({ isOpen, onClose, image, onDelete }: ImageDetailModalProps) {
  const handleDelete = async (imageId: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(imageId);
      onClose();  
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  if (!image || image.status !== 'success' || !image.urls) {
    return null
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
                <Cross1Icon className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
              <div className="flex flex-col md:flex-row">
                <ImagePreview image={image} />

                <div className="flex-1 p-4">
                  <h4 className="text-lg font-medium mb-4">图片信息</h4>
                  <ImageInfo image={image} />

                  <h4 className="text-lg font-medium mb-4">可用格式</h4>
                  <ImageUrls image={image} />
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
                <DeleteButton image={image} onDelete={handleDelete} />
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