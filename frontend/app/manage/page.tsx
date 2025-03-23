"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiKey, validateApiKey, setApiKey } from "../utils/auth";
import { api } from "../utils/request";
import ApiKeyModal from "../components/ApiKeyModal";
import ImageFilters from "../components/ImageFilters";
import ImageCard from "../components/ImageCard";
import ImageModal from "../components/ImageModal";
import Pagination from "../components/Pagination";
import { useTheme } from "../hooks/useTheme";
import { ImageFile, ImageListResponse, StatusMessage, ImageFilterState } from "../types";

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
  const [filters, setFilters] = useState<ImageFilterState>({ format: "all", orientation: "all" });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 检查API Key
    const checkApiKey = async () => {
      const apiKey = getApiKey();
      if (!apiKey) {
        setShowApiKeyModal(true);
        return;
      }

      const isValid = await validateApiKey(apiKey);
      if (!isValid) {
        setShowApiKeyModal(true);
        setStatus({
          type: "error",
          message: "API Key无效,请重新验证",
        });
        return;
      }

      // API Key有效,加载图片列表
      fetchImages();
    };

    checkApiKey();
  }, []);

  const fetchImages = async (page = currentPage) => {
    try {
      setIsLoading(true);
      // 获取图片列表
      const data = await api.get<ImageListResponse>("/api/images", {
        page: page.toString(),
        limit: "16", // 修改为每页16张图片 (4行4列)
        format: filters.format,
        orientation: filters.orientation,
      });
      
      setImages(data.images);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalImages(data.total);
      setStatus(null);
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
          storageType: image.storageType,
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
    setCurrentPage(1);
    fetchImages(1);
  }, [filters]);

  const handleFilterChange = (format: string, orientation: string) => {
    setFilters({ format, orientation });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchImages(currentPage);
  }, [currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <div className="bg-gradient-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </Link>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-primary">
            图片管理
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setShowApiKeyModal(true)} className="btn-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </button>

          <button onClick={toggleTheme} className="btn-icon">
            {isDarkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {status && (
        <div
          className={`mb-8 p-4 rounded-xl ${
            status.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {status.message}
        </div>
      )}

      <ImageFilters onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {images.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {images.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    onClick={() => {
                      setSelectedImage(image);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {totalImages} 张图片
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
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
        onSuccess={(apiKey) => {
          setApiKey(apiKey);
          setShowApiKeyModal(false);
          setStatus({
            type: "success",
            message: "API Key验证成功！",
          });
          fetchImages();
        }}
      />
    </div>
  );
}
