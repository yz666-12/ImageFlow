"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ImageFile } from "../types";
import { ImageData } from "../types/image";
import { ImageInfo } from "./ImageInfo";
import { ImageUrls } from "./ImageUrls";
import { DeleteConfirm } from "./DeleteConfirm";
import { Cross1Icon, TrashIcon, InfoCircledIcon, Link1Icon, ImageIcon } from "./ui/icons";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
      setIsDeleting(false);
      setImageLoaded(false);
      setImageError(false);
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

  // 获取图片URL和判断方向
  const imageData = image as any;
  const webpUrl = imageData.urls?.webp || imageData.url || '';
  const displayUrl = webpUrl.startsWith('http') ? webpUrl : `/images${webpUrl}`;
  const isPortrait = image.orientation === 'portrait';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          >
            <div
              className="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden w-full max-w-6xl max-h-[95vh] shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{image.filename}</h3>
                </div>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-4"
                  onClick={onClose}
                >
                  <Cross1Icon className="h-5 w-5" />
                </button>
              </div>

              {/* 内容区域 */}
              <div className="flex flex-col lg:flex-row max-h-[calc(95vh-8rem)] overflow-hidden">
                {/* 左侧：图片预览 */}
                <div className={`${isPortrait ? 'lg:w-2/5' : 'lg:w-3/5'} bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-6`}>
                  <div className="relative max-w-full max-h-full">
                    {displayUrl && !imageError ? (
                      <div className="relative">
                        <img
                          src={displayUrl}
                          alt={image.filename}
                          className={`max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                          onLoad={() => setImageLoaded(true)}
                          onError={() => {
                            setImageError(true);
                            setImageLoaded(false);
                          }}
                        />
                        {!imageLoaded && !imageError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-96 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="text-center text-gray-400">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                          <p>图片预览不可用</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右侧：信息面板 */}
                <div className={`${isPortrait ? 'lg:w-3/5' : 'lg:w-2/5'} overflow-y-auto bg-white dark:bg-gray-900`}>
                  <div className="p-6 space-y-6">
                    {/* 图片信息 */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <InfoCircledIcon className="h-5 w-5 text-blue-500" />
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">图片信息</h4>
                      </div>
                      <ImageInfo image={image as any} />
                    </div>

                    {/* 可用链接 */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Link1Icon className="h-5 w-5 text-green-500" />
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">可用链接</h4>
                      </div>
                      <ImageUrls image={image as any} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部操作区域 */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {canDelete && !showDeleteConfirm && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4 mr-2 inline" />
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
                
                {(!canDelete || !showDeleteConfirm) && <div />}
                
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}