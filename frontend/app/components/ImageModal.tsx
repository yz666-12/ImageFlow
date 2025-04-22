"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageFile } from "../types";
import { ImageData } from "../types/image";
import { ImageInfo } from "./ImageInfo";
import { ImageUrls } from "./ImageUrls";
import { DeleteConfirm } from "./DeleteConfirm";
import { Cross1Icon, TrashIcon, InfoCircledIcon, Link1Icon } from "./ui/icons";

// 统一的图片类型，可以接受管理界面和上传界面的两种不同图片对象
type ImageType = ImageFile | (ImageData & { status: 'success' });

interface ImageModalProps {
  image: ImageType | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export default function ImageModal({ image, isOpen, onClose, onDelete }: ImageModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!image || !onDelete || !image.id) return;

    try {
      setIsDeleting(true);
      await onDelete(image.id);
      setShowDeleteConfirm(false);  
      onClose();  
    } catch (err) {
      console.error("删除失败:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!image) return null;

  // 判断是否有可删除的功能
  const canDelete = onDelete && image.id;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] shadow-lg border border-gray-200 dark:border-slate-700"
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">{image.filename}</h3>
              <button
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-md transition-colors"
                onClick={onClose}
              >
                <Cross1Icon className="h-5 w-5" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="overflow-y-auto max-h-[calc(90vh-9rem)] bg-white dark:bg-slate-900 p-6">
              <div className="space-y-6">
                {/* 图片信息 */}
                <div>
                  <div className="flex items-center mb-4">
                    <InfoCircledIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                    <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">图片信息</h4>
                  </div>
                  <div className="space-y-2">
                    <ImageInfo image={image as any} />
                  </div>
                </div>
                
                {/* 可用链接 */}
                <div>
                  <div className="flex items-center mb-4">
                    <Link1Icon className="h-5 w-5 mr-2 text-teal-500 dark:text-teal-400" />
                    <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">可用链接</h4>
                  </div>
                  <div className="space-y-2">
                    <ImageUrls image={image as any} />
                  </div>
                </div>
              </div>
            </div>

            {/* 底部操作区域 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
              {canDelete && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-1.5 rounded-md transition-colors flex items-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100/50 dark:hover:bg-red-500/10 text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  删除图片
                </button>
              )}
              
              {showDeleteConfirm && (
                <div className="flex gap-2">
                  <DeleteConfirm
                    isDeleting={isDeleting}
                    onCancel={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDelete}
                  />
                </div>
              )}
              
              {(!canDelete || !showDeleteConfirm) && (
                <div className="ml-auto">
                  <button
                    onClick={onClose}
                    className="px-5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors font-medium text-slate-700 dark:text-slate-200 text-sm"
                  >
                    关闭
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
