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
            className="relative bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 图片预览区域 */}
            <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700/20 dark:border-white/10">
              <Image
                src={image.url}
                alt={image.filename}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              <button
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/40 transition-colors"
                onClick={onClose}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 图片信息区域 */}
            <div className="w-full md:w-1/2 p-6 flex flex-col h-full overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate">{image.filename}</h3>
              
              <div className="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4 my-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {getFormatLabel(image.format)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                    {getOrientationLabel(image.orientation)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                    {formatFileSize(image.size)}
                  </span>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-20">路径:</span>
                    <span className="font-mono text-gray-900 dark:text-gray-200 truncate">{image.path}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="text-gray-500 dark:text-gray-400 w-20">URL:</span>
                    <div className="flex-1">
                      <div className="relative">
                        <div className="font-mono bg-gray-100 dark:bg-slate-800 rounded-lg p-2 pr-10 text-gray-900 dark:text-gray-200 truncate text-xs">
                          {getAbsoluteUrl(image.url)}
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                          title="复制URL"
                        >
                          {copyStatus === "idle" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                </div>
              </div>
              
              <div className="mt-auto">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center justify-center w-full p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除图片
                  </button>
                ) : (
                  <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 text-center text-red-600 dark:text-red-300 font-medium">
                      确定要删除此图片吗？
                    </div>
                    <div className="flex border-t border-red-200 dark:border-red-800">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 p-3 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        disabled={isDeleting}
                      >
                        取消
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center justify-center"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            删除中...
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}