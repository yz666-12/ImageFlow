"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ImageFile } from "../types";
import { getFullUrl } from "../utils/baseUrl";
import { copyToClipboard as copyTextToClipboard } from "../utils/clipboard";

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
    avif: "AVIF",
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

// 构建URL
const buildUrl = (path: string, format: string): string => {
  if (format === "original") {
    return path;
  }

  const originalPath = path;
  const pathParts = originalPath.split('.');
  const extension = pathParts.pop();

  // 根据路径构建WebP和AVIF的路径
  if (format === "webp") {
    // 替换路径中的 /original/ 为 format 路径，并改变扩展名
    return originalPath.replace("/original/", "/webp/").replace(`.${extension}`, ".webp");
  } else if (format === "avif") {
    return originalPath.replace("/original/", "/avif/").replace(`.${extension}`, ".avif");
  }

  return originalPath;
};

// 构建Markdown链接格式
const buildMarkdownLink = (url: string, filename: string): string => {
  return `![${filename}](${url})`;
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
  const [copyStatus, setCopyStatus] = useState<{ type: string } | null>(null);

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      setCopyStatus(null);
    }
  }, [isOpen]);

  // 复制URL到剪贴板
  const handleCopy = (text: string, type: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.stopPropagation();

    copyTextToClipboard(text)
      .then(success => {
        if (success) {
          setCopyStatus({ type });
          setTimeout(() => {
            setCopyStatus(null);
          }, 2000);
        } else {
          console.error("复制失败");
        }
      })
      .catch(err => {
        console.error("复制失败:", err);
      });
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

  // 构建不同格式的URL
  const originalUrl = getFullUrl(image.url);
  const webpUrl = getFullUrl(buildUrl(image.url, "webp"));
  const avifUrl = getFullUrl(buildUrl(image.url, "avif"));
  const markdownLink = buildMarkdownLink(originalUrl, image.filename);

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
              <div className="relative w-full md:w-1/2 bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
                <div className="relative w-full" style={{ height: '380px' }}>
                  {image.format.toLowerCase() === 'gif' ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="max-h-full max-w-full object-contain"
                      />
                      <a
                        href={image.url}
                        download={image.filename}
                        className="absolute bottom-4 right-4 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg transition-colors duration-300"
                        onClick={(e) => e.stopPropagation()}
                        title="下载GIF"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  ) : (
                    <Image
                      src={image.url}
                      alt={image.filename}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                </div>
              </div>

              {/* 图片信息区域 */}
              <div className="w-full md:w-1/2 p-4 flex flex-col h-full md:h-[380px]">
                <div className="flex flex-col h-full">
                  {/* 标签组 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${image.format.toLowerCase() === 'gif'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
                      }`}>
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
                  <div className="space-y-1 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">路径</label>
                      <div className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded text-gray-700 dark:text-gray-300 truncate">
                        {image.path}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">可用格式</label>
                      </div>

                      {/* 原始格式链接 */}
                      <div className="mb-1">
                        <div className="flex items-center gap-1 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                          <div className="text-xs font-medium">{image.format.toLowerCase() === 'gif' ? 'GIF 动图' : '原始格式'}</div>
                        </div>

                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center relative">
                          <div className="flex-1 px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis">
                            {originalUrl}
                          </div>
                          <button
                            onClick={(e) => handleCopy(originalUrl, 'original', e)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg transition-colors relative"
                            title="复制链接"
                          >
                            {copyStatus && copyStatus.type === 'original' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 隐藏 WebP 和 AVIF 链接部分仅用于 GIF 格式 */}
                      {image.format.toLowerCase() !== 'gif' && (
                        <>
                          {/* WebP格式链接 - 显示于非GIF图片*/}
                          <div className="mb-1">
                            <div className="flex items-center gap-1 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="text-xs font-medium">WebP格式</div>
                            </div>

                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center relative">
                              <div className="flex-1 px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis">
                                {webpUrl}
                              </div>
                              <button
                                onClick={(e) => handleCopy(webpUrl, 'webp', e)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg transition-colors relative"
                                title="复制链接"
                              >
                                {copyStatus && copyStatus.type === 'webp' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* AVIF格式链接 - 显示于非GIF图片 */}
                          <div className="mb-1">
                            <div className="flex items-center gap-1 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="text-xs font-medium">AVIF格式</div>
                            </div>

                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center relative">
                              <div className="flex-1 px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis">
                                {avifUrl}
                              </div>
                              <button
                                onClick={(e) => handleCopy(avifUrl, 'avif', e)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg transition-colors relative"
                                title="复制链接"
                              >
                                {copyStatus && copyStatus.type === 'avif' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Markdown格式链接 */}
                      <div className="mb-1">
                        <div className="flex items-center gap-1 mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <div className="text-xs font-medium">Markdown格式</div>
                        </div>

                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center relative">
                          <div className="flex-1 px-2 py-1 text-xs font-mono overflow-hidden text-ellipsis">
                            {markdownLink}
                          </div>
                          <button
                            onClick={(e) => handleCopy(markdownLink, 'markdown', e)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-lg transition-colors relative"
                            title="复制链接"
                          >
                            {copyStatus && copyStatus.type === 'markdown' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 底部删除区域 */}
                <div className="pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center justify-center w-full p-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除图片
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-center text-xs text-red-600 dark:text-red-400">确定要删除此图片吗？（将同时删除所有相关格式）</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-1 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs"
                          disabled={isDeleting}
                        >
                          取消
                        </button>
                        <button
                          onClick={handleDelete}
                          className="flex-1 py-1 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-xs flex items-center justify-center"
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
