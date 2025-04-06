'use client'

import { useState, useEffect } from 'react'

interface ExpirySelectorProps {
  onChange: (minutes: number) => void
}

export default function ExpirySelector({ onChange }: ExpirySelectorProps) {
  const [selectedOption, setSelectedOption] = useState<string>('1h')
  const [customValue, setCustomValue] = useState<number>(1)
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('hours')

  // 组件初始化时设置默认值
  useEffect(() => {
    // 默认为1小时 (60分钟)
    onChange(60)
  }, [onChange])

  // 处理选项变更
  const handleOptionChange = (option: string) => {
    setSelectedOption(option)

    let minutes = 0
    switch (option) {
      case 'never':
        minutes = 0
        break
      case '1h':
        minutes = 60
        break
      case '24h':
        minutes = 24 * 60
        break
      case '7d':
        minutes = 7 * 24 * 60
        break
      case '30d':
        minutes = 30 * 24 * 60
        break
      case 'custom':
        // 根据当前选择的时间单位计算分钟数
        minutes = timeUnit === 'minutes' ? customValue : customValue * 60
        break
    }

    onChange(minutes)
  }

  // 处理自定义值变更
  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setCustomValue(value)
      if (selectedOption === 'custom') {
        // 根据当前选择的时间单位计算分钟数
        const minutes = timeUnit === 'minutes' ? value : value * 60
        onChange(minutes)
      }
    }
  }

  // 处理时间单位变更
  const handleTimeUnitChange = (unit: 'minutes' | 'hours') => {
    setTimeUnit(unit)
    if (selectedOption === 'custom') {
      // 根据新的时间单位计算分钟数
      const minutes = unit === 'minutes' ? customValue : customValue * 60
      onChange(minutes)
    }
  }

  return (
    <div className="mb-6 bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center text-gray-800 dark:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          图片过期时间
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        设置图片的自动过期时间，过期后图片将被自动删除。
      </p>

      {/* 选项卡片设计 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleOptionChange('never')}
          className={`relative px-3 py-3 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${selectedOption === 'never'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          } border`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
            永不过期
          </div>
          {selectedOption === 'never' && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 dark:opacity-40"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('1h')}
          className={`relative px-3 py-3 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${selectedOption === '1h'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          } border`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            1小时
          </div>
          {selectedOption === '1h' && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 dark:opacity-40"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('24h')}
          className={`relative px-3 py-3 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${selectedOption === '24h'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          } border`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            1天
          </div>
          {selectedOption === '24h' && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 dark:opacity-40"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('7d')}
          className={`relative px-3 py-3 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${selectedOption === '7d'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          } border`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            7天
          </div>
          {selectedOption === '7d' && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 dark:opacity-40"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('30d')}
          className={`relative px-3 py-3 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${selectedOption === '30d'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          } border`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            30天
          </div>
          {selectedOption === '30d' && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 dark:opacity-40"></div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('custom')}
          className={`relative px-3 py-3 text-sm font-medium rounded-xl shadow-sm transition-all duration-200 overflow-hidden ${selectedOption === 'custom'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
            : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          } border`}
        >
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            自定义
          </div>
          {selectedOption === 'custom' && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 dark:opacity-40"></div>
          )}
        </button>
      </div>

      {/* 自定义时间输入 - 优化设计 */}
      {selectedOption === 'custom' && (
        <div className="mt-4 mb-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">请设置自定义过期时间：</p>
          <div className="flex items-center justify-center">
            <div className="relative">
              <input
                type="number"
                min="1"
                value={customValue}
                onChange={handleCustomValueChange}
                className="w-24 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-center font-medium text-lg shadow-sm"
                aria-label="自定义时间值"
              />
            </div>
            <div className="flex border rounded-lg overflow-hidden shadow-sm ml-3">
              <button
                type="button"
                onClick={() => handleTimeUnitChange('minutes')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${timeUnit === 'minutes'
                  ? 'bg-indigo-500 text-white border-r border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600'}`}
              >
                分钟
              </button>
              <button
                type="button"
                onClick={() => handleTimeUnitChange('hours')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${timeUnit === 'hours'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300'}`}
              >
                小时
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 状态提示 - 优化设计 */}
      <div className={`p-4 rounded-xl ${selectedOption === 'never'
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800'}`}>
        <div className="flex items-start">
          {selectedOption === 'never' ? (
            <>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">永久保存</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">图片将永久保存在服务器上，不会自动删除。</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">自动过期</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  图片将在上传后
                  <strong className="font-medium">
                    {selectedOption === 'custom'
                      ? (timeUnit === 'minutes'
                          ? ` ${customValue} 分钟 `
                          : ` ${customValue} 小时 `)
                      : selectedOption === '1h' ? ' 1 小时 ' :
                        selectedOption === '24h' ? ' 1 天 ' :
                        selectedOption === '7d' ? ' 7 天 ' :
                        ' 30 天 '}
                  </strong>
                  后自动删除。
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
