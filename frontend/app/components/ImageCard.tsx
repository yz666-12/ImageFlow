"use client";

import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ImageFile } from "../types";
import { getFullUrl } from "../utils/baseUrl";
import { LoadingSpinner } from "./LoadingSpinner";
import { getFormatLabel, getOrientationLabel } from "../utils/imageUtils";
import ContextMenu, { ContextMenuGroup } from "./ContextMenu";
import { showToast } from "./ToastContainer";
import {
  copyOriginalUrl,
  copyWebpUrl,
  copyAvifUrl,
  copyMarkdownLink,
  copyHtmlImgTag,
  copyToClipboard,
} from "../utils/copyImageUtils";

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
};

export default function ImageCard({
  image,
  onClick,
  onDelete,
}: {
  image: ImageFile;
  onClick: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isGif = image.format.toLowerCase() === "gif";
  const cardRef = useRef<HTMLDivElement>(null);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 根据方向确定高度类和比例
  const getHeightAndAspectRatio = (orientation: string) => {
    switch (orientation.toLowerCase()) {
      case "portrait":
        return {
          heightClass: "h-auto",
          aspectRatio: "aspect-[3/4]",
        };
      case "landscape":
        return {
          heightClass: "h-auto",
          aspectRatio: "aspect-[4/3]",
        };
      case "square":
        return {
          heightClass: "h-auto",
          aspectRatio: "aspect-square",
        };
      default:
        return {
          heightClass: "h-auto",
          aspectRatio: "aspect-auto",
        };
    }
  };

  const { heightClass, aspectRatio } = getHeightAndAspectRatio(
    image.orientation
  );

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu({
      ...contextMenu,
      isOpen: false,
    });
  };

  // 复制回调
  const handleCopy = async (type: string) => {
    try {
      let success = false;

      switch (type) {
        case "original":
          success = await copyOriginalUrl(image);
          break;
        case "webp":
          success = await copyWebpUrl(image);
          break;
        case "avif":
          success = await copyAvifUrl(image);
          break;
        case "markdown":
          success = await copyMarkdownLink(image);
          break;
        case "html":
          success = await copyHtmlImgTag(image);
          break;
      }

      if (success) {
        showToast("复制成功", "success");
      } else {
        showToast("复制失败", "error");
      }
    } catch (error) {
      showToast("复制失败", "error");
      console.error("复制错误:", error);
    }
  };

  // 删除图片
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onDelete(image.id);
      showToast("图片已删除", "success");
    } catch (error) {
      showToast("删除失败", "error");
      console.error("删除失败:", error);
    }
  };

  // 右键菜单项
  const menuGroups: ContextMenuGroup[] = [
    {
      id: "copy",
      items: [
        {
          id: "copy-original",
          label: `复制原始链接 (${image.format.toUpperCase()})`,
          onClick: () => handleCopy("original"),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          ),
        },
        {
          id: "copy-webp",
          label: "复制WebP链接",
          onClick: () => handleCopy("webp"),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          ),
          disabled: !image.urls?.webp,
        },
        {
          id: "copy-avif",
          label: "复制AVIF链接",
          onClick: () => handleCopy("avif"),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
          ),
          disabled: !image.urls?.avif,
        },
      ],
    },
    {
      id: "format",
      items: [
        {
          id: "copy-markdown",
          label: "复制Markdown标签",
          onClick: () => handleCopy("markdown"),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          ),
        },
        {
          id: "copy-html",
          label: "复制HTML标签",
          onClick: () => handleCopy("html"),
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          ),
        },
      ],
    },
    {
      id: "actions",
      items: [
        {
          id: "preview",
          label: "预览图片",
          onClick: onClick,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          ),
        },
        {
          id: "delete",
          label: "删除图片",
          onClick: handleDelete,
          danger: true,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="rounded-xl shadow-lg overflow-hidden group cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 h-full"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
      >
        <div
          className={`relative ${heightClass} ${aspectRatio} overflow-hidden bg-gray-100 dark:bg-gray-900 w-full`}
        >
          {isGif ? (
            // Use img tag for GIFs to ensure animation plays
            <img
              src={getFullUrl(image.url)}
              alt={image.filename}
              onLoad={handleImageLoad}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isLoading ? "opacity-0" : "opacity-100 group-hover:scale-105"
              }`}
            />
          ) : (
            // Use Next.js Image for non-GIF images with optimizations
            <Image
              src={getFullUrl(image.urls?.webp || image.url)}
              alt={image.filename}
              fill
              loading="lazy"
              onLoad={handleImageLoad}
              className={`object-cover w-full h-full transition-all duration-500 ${
                isLoading ? "opacity-0" : "opacity-100 group-hover:scale-105"
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={75}
            />
          )}

          {isLoading && <LoadingSpinner />}

          {/* Image info overlay */}
          <div
            className={`absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent text-white transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex space-x-1">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm ${
                  isGif ? "bg-green-500/70" : "bg-blue-500/70"
                }`}
              >
                {getFormatLabel(image.format)}
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/70 backdrop-blur-sm">
                {getOrientationLabel(image.orientation)}
              </span>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(getFullUrl(image.urls?.webp || image.url));
              }}
              className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors"
              title="复制URL"
            >
              {copyStatus === "idle" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
              {copyStatus === "copied" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {copyStatus === "error" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 右键菜单 */}
      <ContextMenu
        items={menuGroups}
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={closeContextMenu}
      />
    </>
  );
}
