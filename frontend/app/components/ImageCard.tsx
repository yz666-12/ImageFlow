"use client";

import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ImageFile } from '../types'

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

export default function ImageCard({ image, onClick }: { image: ImageFile; onClick: () => void }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [isHovered, setIsHovered] = useState(false);
  
  // 根据方向确定高度类
  const getHeightClass = (orientation: string) => {
    return "h-56"; // 统一所有卡片高度
  };

  // 复制URL到剪贴板
  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden group cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative ${getHeightClass(image.orientation)} overflow-hidden bg-gray-100 dark:bg-gray-900`}>
        <Image
          src={image.url}
          alt={image.filename}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent text-white">
          <div className="flex space-x-1">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/70 backdrop-blur-sm">
              {getFormatLabel(image.format)}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/70 backdrop-blur-sm">
              {getOrientationLabel(image.orientation)}
            </span>
          </div>
          
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            onClick={copyToClipboard}
            className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
            title="复制URL"
          >
            {copyStatus === "idle" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {copyStatus === "copied" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {copyStatus === "error" && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>

      <div className="p-4 flex-grow">
        <div className="truncate text-sm font-medium text-gray-900 dark:text-white">{image.filename}</div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(image.size)}</span>
          {(image as any).width && (image as any).height ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            >
              {(image as any).width} x {(image as any).height}
            </motion.div>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
} 