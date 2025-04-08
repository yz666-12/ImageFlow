"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import Masonry from "react-masonry-css";
import { getApiKey, validateApiKey } from "../utils/auth";
import { api } from "../utils/request";
import ApiKeyModal from "../components/ApiKeyModal";
import ImageFilters from "../components/ImageFilters";
import ImageCard from "../components/ImageCard";
import ImageModal from "../components/ImageModal";
import { useTheme } from "../hooks/useTheme";
import {
  ImageFile,
  ImageListResponse,
  StatusMessage,
  ImageFilterState,
} from "../types";
import Header from "../components/Header";

export default function Manage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [filters, setFilters] = useState<ImageFilterState>({
    format: "original",
    orientation: "all",
    tag: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKeyVerified, setIsKeyVerified] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Infinite scroll setup
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    delay: 100,
  });
  /*
  // Preload images for next page
  const preloadImages = useCallback((imageUrls: string[]) => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = getFullUrl(url);
    });
  }, []);
*/
  // Check API key
  useEffect(() => {
    checkApiKey();
  }, []);

  // Load more images when scrolling
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      fetchNextPage();
    }
  }, [inView, hasMore]);

  const fetchNextPage = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = Math.floor(images.length / 24) + 1;
      const data = await api.get<ImageListResponse>("/api/images", {
        page: nextPage.toString(),
        limit: "24",
        format: filters.format,
        orientation: filters.orientation,
        tag: filters.tag,
      });

      if (data.images.length === 0) {
        setHasMore(false);
      } else {
        setImages((prev) => [...prev, ...data.images]);
        setTotalPages(data.totalPages);
        setTotalImages(data.total);

        // Preload next page images
        const nextPageUrls = data.images.map((img) => img.url);
        // preloadImages(nextPageUrls);
      }
    } catch (error) {
      console.error("加载更多图片失败:", error);
      setStatus({
        type: "error",
        message: "加载更多图片失败",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const checkApiKey = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setShowApiKeyModal(true);
      setIsKeyVerified(false);
      return;
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      setShowApiKeyModal(true);
      setIsKeyVerified(false);
      setStatus({
        type: "error",
        message: "API Key无效,请重新验证",
      });
      return;
    }

    setIsKeyVerified(true);
    fetchImages();
  };

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      setImages([]);
      setHasMore(true);
      setCurrentPage(1);

      const data = await api.get<ImageListResponse>("/api/images", {
        page: "1",
        limit: "24",
        format: filters.format,
        orientation: filters.orientation,
        tag: filters.tag,
      });

      setImages(data.images);
      setTotalPages(data.totalPages);
      setTotalImages(data.total);
      setStatus(null);

      // Preload next page
      if (data.images.length === 24) {
        const nextPageUrls = data.images.map((img) => img.url);
        // preloadImages(nextPageUrls);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("加载图片列表失败:", error);
      setStatus({
        type: "error",
        message: "加载图片列表失败",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const image = images.find((img) => img.id === id);
      if (!image) return;

      const response = await api.post<{ success: boolean; message: string }>(
        "/api/delete-image",
        {
          id: image.id,
        }
      );

      if (response.success) {
        setImages(images.filter((img) => img.id !== id));
        setStatus({
          type: "success",
          message: response.message,
        });
      } else {
        setStatus({
          type: "error",
          message: response.message,
        });
      }
    } catch (error) {
      console.error("删除失败:", error);
      setStatus({
        type: "error",
        message: "删除失败",
      });
    }
  };

  useEffect(() => {
    fetchImages();
  }, [filters]);

  const handleFilterChange = (
    format: string,
    orientation: string,
    tag: string
  ) => {
    setFilters({ format, orientation, tag });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Header
        onApiKeyClick={() => setShowApiKeyModal(true)}
        title="ImageFlow"
        isKeyVerified={isKeyVerified}
      />

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mb-8 p-4 rounded-xl ${
            status.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {status.message}
        </motion.div>
      )}

      <ImageFilters onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {images.length > 0 ? (
            <div className="space-y-8">
              <div
                className={
                  filters.orientation === "all"
                    ? ""
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                }
              >
                {filters.orientation === "all" ? (
                  <Masonry
                    breakpointCols={{
                      default: 4,
                      1280: 4,
                      1024: 3,
                      768: 2,
                      640: 1,
                    }}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                  >
                    {images.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: (index % 24) * 0.05,
                        }}
                      >
                        <ImageCard
                          image={image}
                          onClick={() => {
                            setSelectedImage(image);
                            setIsModalOpen(true);
                          }}
                        />
                      </motion.div>
                    ))}
                  </Masonry>
                ) : (
                  images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: (index % 24) * 0.05 }}
                    >
                      <ImageCard
                        image={image}
                        onClick={() => {
                          setSelectedImage(image);
                          setIsModalOpen(true);
                        }}
                      />
                    </motion.div>
                  ))
                )}
              </div>

              {/* Load more trigger */}
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex justify-center items-center py-8"
                >
                  {isLoadingMore ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">
                      向下滚动加载更多
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {totalImages}
                  </span>{" "}
                  张图片
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
              <svg
                className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium">暂无图片</p>
              <p className="mt-2 text-sm">请上传图片或调整筛选条件</p>
            </div>
          )}
        </>
      )}

      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedImage(null);
          setIsModalOpen(false);
        }}
        onDelete={handleDelete}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={() => {
          setIsKeyVerified(true);
          fetchImages();
        }}
      />
    </div>
  );
}
