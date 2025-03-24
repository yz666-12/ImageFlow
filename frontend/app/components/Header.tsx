'use client'

import Link from 'next/link'
import { useTheme } from '../hooks/useTheme'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

interface HeaderProps {
  onApiKeyClick: () => void
  title?: string
  isKeyVerified?: boolean
}

export default function Header({ onApiKeyClick, title, isKeyVerified = false }: HeaderProps) {
  const { isDarkMode, toggleTheme } = useTheme()
  const pathname = usePathname()

  // 根据路径判断当前页面，或使用传入的自定义标题
  const getTitle = () => {
    if (title) return title;
    if (pathname === '/manage') return '图片管理';
    return 'ImageFlow';
  }

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center">
        <Link href="/" className="mr-4">
          <div className="bg-gradient-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </Link>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-primary">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {pathname !== '/manage' && (
          <Link href="/manage" className="btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </Link>
        )}

        <button onClick={onApiKeyClick} className="btn-icon relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>

          {isKeyVerified && (
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0.4)", "0 0 0 8px rgba(34, 197, 94, 0)", "0 0 0 0 rgba(34, 197, 94, 0)"]
              }}
              transition={{
                scale: { duration: 0.3, ease: "easeOut" },
                opacity: { duration: 0.3, ease: "easeOut" },
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.2 }}
                className="w-2 h-2 bg-white rounded-full"
              />
            </motion.div>
          )}
        </button>

        <button onClick={toggleTheme} className="btn-icon">
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
} 
