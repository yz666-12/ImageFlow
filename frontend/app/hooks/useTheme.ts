import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    // 从localStorage获取主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    
    // 保存主题设置
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    
    // 切换主题类
    document.documentElement.classList.toggle('dark', newTheme)
  }

  return { isDarkMode, toggleTheme }
} 