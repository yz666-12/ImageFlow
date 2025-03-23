import { getApiKey } from './auth'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

// 从环境变量获取后端地址,默认为相对路径
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('未设置API Key')
  }

  const { params, ...restOptions } = options
  
  // 构建URL
  let url: URL
  try {
    url = new URL(endpoint, window.location.origin)
  } catch {
    url = new URL(endpoint, BASE_URL || window.location.origin)
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  // 添加认证头
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    ...options.headers,
  }

  const response = await fetch(url.toString(), {
    ...restOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '请求失败')
  }

  return response.json()
}

// 获取静态文件目录列表
export async function fetchDirectoryListing(path: string = '/images/'): Promise<string[]> {
  const response = await api.get<{ files: string[] }>('/directory', { path })
  return response.files
}

// 封装常用请求方法
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) => 
    request<T>(endpoint, { method: 'GET', params }),
    
  post: <T>(endpoint: string, data?: any) => 
    request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
    
  delete: <T>(endpoint: string) => 
    request<T>(endpoint, { method: 'DELETE' }),
    
  upload: <T>(endpoint: string, files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images[]', file)
    })
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
    })
  }
} 