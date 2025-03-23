import { PaginationProps } from '../types'

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          currentPage <= 1
            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        上一页
      </button>

      <span className="text-sm text-gray-700 dark:text-gray-300">
        第 {currentPage} 页，共 {totalPages} 页
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
          currentPage >= totalPages
            ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        下一页
        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
} 