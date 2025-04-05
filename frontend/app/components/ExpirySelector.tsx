'use client'

import { useState } from 'react'

interface ExpirySelectorProps {
  onChange: (minutes: number) => void
}

export default function ExpirySelector({ onChange }: ExpirySelectorProps) {
  const [selectedOption, setSelectedOption] = useState<string>('never')
  const [customValue, setCustomValue] = useState<number>(1)
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes')

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
    <div className="mb-4">
      <label className="block text-sm font-medium mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-base">图片过期时间</span>
      </label>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <button
          type="button"
          onClick={() => handleOptionChange('never')}
          className={`px-3 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${
            selectedOption === 'never'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800 transform scale-[1.02]'
              : 'bg-white dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border-light-border dark:border-dark-border'
          } border`}
        >
          永不过期
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('1h')}
          className={`px-3 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${
            selectedOption === '1h'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800 transform scale-[1.02]'
              : 'bg-white dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border-light-border dark:border-dark-border'
          } border`}
        >
          1小时
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('24h')}
          className={`px-3 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${
            selectedOption === '24h'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800 transform scale-[1.02]'
              : 'bg-white dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border-light-border dark:border-dark-border'
          } border`}
        >
          1天
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('7d')}
          className={`px-3 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${
            selectedOption === '7d'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800 transform scale-[1.02]'
              : 'bg-white dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border-light-border dark:border-dark-border'
          } border`}
        >
          7天
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('30d')}
          className={`px-3 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${
            selectedOption === '30d'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800 transform scale-[1.02]'
              : 'bg-white dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border-light-border dark:border-dark-border'
          } border`}
        >
          30天
        </button>

        <button
          type="button"
          onClick={() => handleOptionChange('custom')}
          className={`px-3 py-3 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 ${
            selectedOption === 'custom'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-800 transform scale-[1.02]'
              : 'bg-white dark:bg-dark-bg-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary border-light-border dark:border-dark-border'
          } border`}
        >
          自定义
        </button>
      </div>

      {selectedOption === 'custom' && (
        <div className="flex items-center mt-3 bg-light-bg-secondary dark:bg-dark-bg-secondary p-3 rounded-lg border border-light-border dark:border-dark-border">
          <div className="flex-1 flex items-center justify-center">
            <input
              type="number"
              min="1"
              value={customValue}
              onChange={handleCustomValueChange}
              className="w-20 px-3 py-2 rounded-md border border-light-border dark:border-dark-border bg-white dark:bg-dark-bg-primary mr-3 text-center font-medium text-lg"
              aria-label="自定义时间值"
            />
            <div className="flex border rounded-md overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => handleTimeUnitChange('minutes')}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${timeUnit === 'minutes'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-r border-indigo-300 dark:border-indigo-700'
                  : 'bg-white dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300 border-r border-light-border dark:border-dark-border'}`}
              >
                分钟
              </button>
              <button
                type="button"
                onClick={() => handleTimeUnitChange('hours')}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${timeUnit === 'hours'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'bg-white dark:bg-dark-bg-primary text-gray-700 dark:text-gray-300'}`}
              >
                小时
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-3 p-3 rounded-lg ${selectedOption === 'never' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
        <p className="text-sm flex items-center">
          {selectedOption === 'never'
            ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-700 dark:text-blue-300">图片将永久保存，不会自动删除</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-amber-700 dark:text-amber-300">
                  图片将在上传后
                  <strong className="font-medium">
                    {selectedOption === 'custom'
                      ? (timeUnit === 'minutes'
                          ? customValue + '分钟'
                          : customValue + '小时')
                      : selectedOption === '1h' ? '1小时' :
                        selectedOption === '24h' ? '1天' :
                        selectedOption === '7d' ? '7天' :
                        '30天'}
                  </strong>
                  后自动删除
                </span>
              </>
            )
          }
        </p>
      </div>
    </div>
  )
}
