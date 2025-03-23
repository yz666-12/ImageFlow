"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ImageFile } from "../types";

// 获取正确的绝对URL
const getAbsoluteUrl = (path: string) => {
  // 移除开头的斜杠以防止路径重复
  const relativePath = path.startsWith("/") ? path.substring(1) : path;
  // 构建完整的URL
  return `${window.location.origin}/${relativePath}`;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

// 获取格式标签
const getFormatLabel = (format: string): string => {
  const formatMap: { [key: string]: string } = {
    png: "PNG",
    jpg: "JPG",
    jpeg: "JPEG",
    webp: "WebP",
    gif: "GIF",
  };
  return formatMap[format.toLowerCase()] || format.toUpperCase();
};

// 获取方向标签
const getOrientationLabel = (orientation: string): string => {
  const orientationMap: { [key: string]: string } = {
    landscape: "横向",
    portrait: "纵向",
    square: "方形",
  };
  return orientationMap[orientation.toLowerCase()] || orientation;
};

interface ImageModalProps {
  image: ImageFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export default function ImageModal({ image, isOpen, onClose, onDelete }: ImageModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      setCopyStatus("idle");
    }
  }, [isOpen]);

  // 复制URL到剪贴板
  const copyToClipboard = async () => {
    if (!image) return;
    
    try {
      const absoluteUrl = getAbsoluteUrl(image.url);
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error("复制失败:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!image) return;
    
    try {
      setIsDeleting(true);
      await onDelete(image.id);
      onClose();
    } catch (err) {
      console.error("删除失败:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!image) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 dark:bg-white/10 rounded-full hover:bg-black/30 dark:hover:bg-white/20 transition-colors"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* 文件名标题 */}
            <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">{image.filename}</h3>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* 图片预览区域 */}
              <div className="relative w-full md:w-3/5 h-64 md:h-[400px] bg-gray-100 dark:bg-gray-800">
                <Image
                  src={image.url}
                  alt={image.filename}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
              </div>
              
              {/* 图片信息区域 */}
              <div className="w-full md:w-2/5 p-6 flex flex-col h-full md:h-[400px] overflow-y-auto">
                {/* 标签组 */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                    {getFormatLabel(image.format)}
                  </div>
                  <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
                    {getOrientationLabel(image.orientation)}
                  </div>
                  <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                    {formatFileSize(image.size)}
                  </div>
                  {(image as any).width && (image as any).height && (
                    <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium">
                      {(image as any).width} x {(image as any).height}
                    </div>
                  )}
                </div>
                
                {/* 图片信息 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">路径</label>
                    <div className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-700 dark:text-gray-300 truncate">
                      {image.path}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">URL</label>
                    <div className="relative">
                      <div className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-2 pr-10 rounded text-gray-700 dark:text-gray-300 truncate">
                        {getAbsoluteUrl(image.url)}
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="复制URL"
                      >
                        {copyStatus === "idle" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        {copyStatus === "copied" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {copyStatus === "error" && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      {copyStatus === "copied" ? "URL已复制到剪贴板" : "点击右侧按钮复制URL"}
                    </div>
                  </div>
                </div>
                
                {/* 底部删除区域 */}
                <div className="mt-auto pt-4">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center justify-center w-full p-2.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除图片
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-center text-sm text-red-600 dark:text-red-400">确定要删除此图片吗？</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                          disabled={isDeleting}
                        >
                          取消
                        </button>
                        <button
                          onClick={handleDelete}
                          className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm flex items-center justify-center"
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
                            "确认删除"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}