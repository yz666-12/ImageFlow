# ImageFlow API 使用指南

ImageFlow 是一个现代化的图片服务系统，提供完整的图片管理和分发功能。本文档详细介绍所有API接口的使用方法和实际案例。

## 📋 目录

- [认证机制](#认证机制)
- [公开接口](#公开接口)
- [认证接口](#认证接口)
- [实际使用案例](#实际使用案例)
- [SDK示例](#sdk示例)
- [错误处理](#错误处理)

## 🔐 认证机制

ImageFlow 使用 Bearer Token 认证。所有需要认证的接口都需要在请求头中包含：

```http
Authorization: Bearer your-api-key-here
```

### 获取API Key
API Key 通过环境变量 `API_KEY` 配置，联系管理员获取。

---

## 🌐 公开接口

### 1. 随机图片接口

**接口地址**: `GET /api/random`

**功能**: 获取随机图片，支持高级过滤和智能格式选择

#### 基础用法

```http
GET /api/random
```

#### 高级过滤参数

| 参数 | 类型 | 描述 | 示例 |
|------|------|------|------|
| `tag` | string | 单个标签过滤 | `?tag=nature` |
| `tags` | string | 多标签过滤(AND逻辑) | `?tags=nature,sunset,mountain` |
| `exclude` | string | 排除标签 | `?exclude=nsfw,private` |
| `orientation` | string | 强制方向 | `?orientation=landscape` |
| `format` | string | 偏好格式 | `?format=webp` |

#### 实际案例

```bash
# 1. 获取风景类横屏图片，排除NSFW内容
curl "https://your-domain.com/api/random?tag=landscape&exclude=nsfw&orientation=landscape"

# 2. 获取同时有"自然"和"日落"标签的图片
curl "https://your-domain.com/api/random?tags=nature,sunset"

# 3. 移动端优化：强制WebP格式的竖屏图片
curl "https://your-domain.com/api/random?orientation=portrait&format=webp"

# 4. 复杂过滤：自然风光，排除人像和NSFW，偏好AVIF格式
curl "https://your-domain.com/api/random?tags=nature,landscape&exclude=portrait,nsfw&format=avif"
```

#### 响应说明
- **成功**: 直接返回图片文件(二进制数据)
- **失败**: 返回HTTP错误状态码和错误信息

#### 智能特性
- 🧠 **设备检测**: 移动设备自动返回竖屏图片，桌面设备返回横屏图片
- 🎨 **格式优化**: 根据浏览器支持自动选择最优格式 (AVIF > WebP > 原格式)
- 🛡️ **PNG保护**: PNG图片保持原格式以保护透明度
- ⚡ **缓存友好**: 支持HTTP缓存头优化传输

### 2. API Key验证

**接口地址**: `POST /api/validate-api-key`

**功能**: 验证API密钥的有效性

```bash
curl -X POST "https://your-domain.com/api/validate-api-key" \
  -H "Authorization: Bearer your-api-key"
```

**响应格式**:
```json
{
  "valid": true,
  "error": null
}
```

---

## 🔒 认证接口

以下接口都需要在请求头中包含有效的API Key。

### 1. 图片上传

**接口地址**: `POST /api/upload`

**功能**: 上传图片，支持批量上传和自动格式转换

#### 基础上传

```bash
curl -X POST "https://your-domain.com/api/upload" \
  -H "Authorization: Bearer your-api-key" \
  -F "images[]=@/path/to/image1.jpg" \
  -F "images[]=@/path/to/image2.png"
```

#### 带标签和过期时间的上传

```bash
curl -X POST "https://your-domain.com/api/upload" \
  -H "Authorization: Bearer your-api-key" \
  -F "images[]=@/path/to/photo.jpg" \
  -F "tags=nature,landscape,sunset" \
  -F "expiryMinutes=1440"
```

#### 响应格式

```json
{
  "results": [
    {
      "filename": "DSC_0001.jpg",
      "status": "success",
      "message": "图片上传成功",
      "orientation": "landscape",
      "format": "jpeg",
      "expiryTime": "2024-01-02T10:00:00Z",
      "tags": ["nature", "landscape", "sunset"],
      "urls": {
        "original": "https://example.com/images/original/landscape/uuid.jpg",
        "webp": "https://example.com/images/landscape/webp/uuid.webp",
        "avif": "https://example.com/images/landscape/avif/uuid.avif"
      }
    }
  ]
}
```

#### 上传限制
- **文件数量**: 最多20个文件 (可配置)
- **支持格式**: JPEG, PNG, GIF, WebP, AVIF
- **自动转换**: 除GIF外，所有图片都会生成WebP和AVIF版本

### 2. 图片列表

**接口地址**: `GET /api/images`

**功能**: 获取图片列表，支持分页和多种过滤条件

#### 基础列表

```bash
curl "https://your-domain.com/api/images" \
  -H "Authorization: Bearer your-api-key"
```

#### 高级过滤

```bash
# 分页查询横屏图片
curl "https://your-domain.com/api/images?page=2&limit=24&orientation=landscape" \
  -H "Authorization: Bearer your-api-key"

# 按标签过滤
curl "https://your-domain.com/api/images?tag=nature&format=webp" \
  -H "Authorization: Bearer your-api-key"
```

#### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `page` | int | 1 | 页码 |
| `limit` | int | 12 | 每页数量(最大50) |
| `orientation` | string | all | 图片方向过滤 |
| `format` | string | original | 返回格式 |
| `tag` | string | - | 标签过滤 |

#### 响应格式

```json
{
  "success": true,
  "images": [
    {
      "id": "uuid-string",
      "fileName": "DSC_0001.jpg",
      "url": "https://example.com/images/uuid.jpg",
      "urls": {
        "original": "原始格式URL",
        "webp": "WebP格式URL",
        "avif": "AVIF格式URL"
      },
      "size": 2048576,
      "orientation": "landscape",
      "format": "jpeg",
      "storageType": "s3",
      "tags": ["nature", "landscape"]
    }
  ],
  "page": 1,
  "limit": 12,
  "totalPages": 8,
  "total": 96
}
```

### 3. 删除图片

**接口地址**: `POST /api/delete-image`

**功能**: 删除指定图片及其所有格式版本

```bash
curl -X POST "https://your-domain.com/api/delete-image" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"id": "image-uuid"}'
```

**响应格式**:
```json
{
  "success": true,
  "message": "图片及相关文件删除成功"
}
```

### 4. 标签管理

**接口地址**: `GET /api/tags`

**功能**: 获取系统中所有唯一标签

```bash
curl "https://your-domain.com/api/tags" \
  -H "Authorization: Bearer your-api-key"
```

**响应格式**:
```json
{
  "tags": ["architecture", "landscape", "nature", "portrait", "street", "sunset"]
}
```

### 5. 系统配置

**接口地址**: `GET /api/config`

**功能**: 获取客户端安全配置信息

```bash
curl "https://your-domain.com/api/config" \
  -H "Authorization: Bearer your-api-key"
```

**响应格式**:
```json
{
  "maxUploadCount": 20,
  "storageType": "s3",
  "baseUrl": "https://your-domain.com"
}
```

### 6. 手动清理

**接口地址**: `POST /api/trigger-cleanup`

**功能**: 立即触发过期图片清理任务

```bash
curl -X POST "https://your-domain.com/api/trigger-cleanup" \
  -H "Authorization: Bearer your-api-key"
```

**响应格式**:
```json
{
  "status": "success",
  "message": "清理任务已启动"
}
```

---

## 🚀 实际使用案例

### 案例1: 博客随机配图

为博客文章自动获取合适的配图：

```javascript
// 获取科技类横屏配图
const getTechImage = async () => {
  const response = await fetch('/api/random?tags=technology,computer&orientation=landscape&format=webp');
  return response.url; // 返回图片URL
};

// 获取自然风光，排除人像
const getNatureWallpaper = async () => {
  const response = await fetch('/api/random?tag=nature&exclude=portrait,people&orientation=landscape');
  return response.blob();
};
```

### 案例2: 移动应用头像系统

为移动应用提供头像和背景图片：

```swift
// iOS Swift 示例
func getRandomAvatar() async {
    let url = URL(string: "https://your-api.com/api/random?tags=avatar,profile&orientation=portrait&format=webp")!
    let (data, _) = try await URLSession.shared.data(from: url)
    let image = UIImage(data: data)
    // 使用图片
}
```

### 案例3: 内容管理系统

完整的图片管理流程：

```javascript
class ImageManager {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`
    };
  }

  // 批量上传图片
  async uploadImages(files, tags = [], expiryMinutes = null) {
    const formData = new FormData();
    files.forEach(file => formData.append('images[]', file));
    if (tags.length > 0) formData.append('tags', tags.join(','));
    if (expiryMinutes) formData.append('expiryMinutes', expiryMinutes);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      headers: this.headers,
      body: formData
    });
    return response.json();
  }

  // 获取图片列表
  async getImages(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await fetch(`${this.baseUrl}/api/images?${params}`, {
      headers: this.headers
    });
    return response.json();
  }

  // 删除图片
  async deleteImage(imageId) {
    const response = await fetch(`${this.baseUrl}/api/delete-image`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: imageId })
    });
    return response.json();
  }

  // 获取随机图片URL
  async getRandomImageUrl(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}/api/random?${params}`);
    return response.url;
  }
}

// 使用示例
const imageManager = new ImageManager('your-api-key', 'https://your-domain.com');

// 上传带标签的图片，24小时后过期
const uploadResult = await imageManager.uploadImages(
  selectedFiles,
  ['product', 'featured'],
  1440
);

// 获取自然风光图片列表
const landscapes = await imageManager.getImages(1, {
  tag: 'landscape',
  orientation: 'landscape'
});
```

### 案例4: 微信小程序集成

```javascript
// 微信小程序示例
const ImageService = {
  baseUrl: 'https://your-domain.com',
  
  // 获取随机壁纸
  getRandomWallpaper() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseUrl}/api/random`,
        data: {
          tags: 'wallpaper,hd',
          orientation: 'portrait',
          format: 'webp'
        },
        responseType: 'arraybuffer',
        success: (res) => {
          // 将ArrayBuffer转换为临时文件
          const fs = wx.getFileSystemManager();
          const fileName = `${wx.env.USER_DATA_PATH}/temp_wallpaper.webp`;
          fs.writeFile({
            filePath: fileName,
            data: res.data,
            success: () => resolve(fileName),
            fail: reject
          });
        },
        fail: reject
      });
    });
  }
};
```

### 案例5: Python 自动化脚本

```python
import requests
import json
from typing import List, Optional

class ImageFlowClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {'Authorization': f'Bearer {api_key}'}
    
    def upload_images(self, file_paths: List[str], tags: Optional[List[str]] = None, 
                     expiry_minutes: Optional[int] = None) -> dict:
        """批量上传图片"""
        files = [('images[]', open(path, 'rb')) for path in file_paths]
        data = {}
        if tags:
            data['tags'] = ','.join(tags)
        if expiry_minutes:
            data['expiryMinutes'] = expiry_minutes
        
        response = requests.post(
            f'{self.base_url}/api/upload',
            headers=self.headers,
            files=files,
            data=data
        )
        
        # 关闭文件句柄
        for _, file in files:
            file.close()
            
        return response.json()
    
    def get_random_image(self, **filters) -> bytes:
        """获取随机图片的二进制数据"""
        response = requests.get(
            f'{self.base_url}/api/random',
            params=filters
        )
        return response.content
    
    def save_random_image(self, output_path: str, **filters):
        """保存随机图片到本地"""
        image_data = self.get_random_image(**filters)
        with open(output_path, 'wb') as f:
            f.write(image_data)

# 使用示例
client = ImageFlowClient('https://your-domain.com', 'your-api-key')

# 批量上传本地图片
result = client.upload_images(
    ['photo1.jpg', 'photo2.png'],
    tags=['portfolio', 'photography'],
    expiry_minutes=7200
)

# 下载随机自然风光图片
client.save_random_image(
    'wallpaper.webp',
    tags='nature,landscape',
    orientation='landscape',
    format='webp'
)
```

---

## 📚 SDK示例

### JavaScript/Node.js SDK

```javascript
class ImageFlowSDK {
  constructor(options) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response;
  }

  // 随机图片 - 支持所有高级过滤
  async random(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = `/api/random${params ? '?' + params : ''}`;
    return this.request(endpoint, { headers: {} }); // 随机接口不需要认证
  }

  // 上传图片
  async upload(files, options = {}) {
    const formData = new FormData();
    
    // 添加文件
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('images[]', file));
    } else {
      formData.append('images[]', files);
    }
    
    // 添加选项
    if (options.tags) {
      const tags = Array.isArray(options.tags) ? options.tags.join(',') : options.tags;
      formData.append('tags', tags);
    }
    if (options.expiryMinutes) {
      formData.append('expiryMinutes', options.expiryMinutes);
    }

    return this.request('/api/upload', {
      method: 'POST',
      body: formData
    });
  }

  // 获取图片列表
  async list(options = {}) {
    const params = new URLSearchParams(options).toString();
    const endpoint = `/api/images${params ? '?' + params : ''}`;
    return this.request(endpoint);
  }

  // 删除图片
  async delete(imageId) {
    return this.request('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId })
    });
  }

  // 获取标签列表
  async tags() {
    return this.request('/api/tags');
  }

  // 获取配置信息
  async config() {
    return this.request('/api/config');
  }

  // 触发清理
  async cleanup() {
    return this.request('/api/trigger-cleanup', { method: 'POST' });
  }

  // 验证API Key
  async validate() {
    return this.request('/api/validate-api-key', { method: 'POST' });
  }
}

// 使用示例
const sdk = new ImageFlowSDK({
  baseUrl: 'https://your-domain.com',
  apiKey: 'your-api-key'
});

// 获取随机自然风光图片
const randomImage = await sdk.random({
  tags: 'nature,landscape',
  exclude: 'people',
  orientation: 'landscape',
  format: 'webp'
});

// 上传图片并设置标签
const uploadResult = await sdk.upload(fileInput.files, {
  tags: ['portfolio', 'photography'],
  expiryMinutes: 1440
});
```

---

## ⚠️ 错误处理

### HTTP状态码

| 状态码 | 含义 | 处理方式 |
|--------|------|----------|
| 200 | 成功 | 正常处理响应 |
| 400 | 请求参数错误 | 检查请求参数格式 |
| 401 | 认证失败 | 检查API Key是否正确 |
| 404 | 资源不存在 | 检查图片ID或路径 |
| 413 | 文件过大 | 压缩图片或分批上传 |
| 429 | 请求频率限制 | 实施退避重试策略 |
| 500 | 服务器内部错误 | 稍后重试或联系管理员 |

### 错误响应格式

```json
{
  "success": false,
  "error": "详细错误信息",
  "code": "ERROR_CODE"
}
```

### 错误处理最佳实践

```javascript
async function safeApiCall(apiFunction, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      console.log(`第${i + 1}次尝试失败:`, error.message);
      
      if (i === retries - 1) throw error; // 最后一次尝试，抛出错误
      
      // 根据错误类型决定是否重试
      if (error.status === 401) {
        throw new Error('API Key无效，请检查认证信息');
      }
      
      if (error.status === 429) {
        // 频率限制，等待更长时间
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
      } else {
        // 其他错误，短暂等待
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

// 使用示例
try {
  const result = await safeApiCall(() => 
    imageFlowSDK.upload(files, { tags: ['important'] })
  );
  console.log('上传成功:', result);
} catch (error) {
  console.error('上传失败:', error.message);
  // 显示用户友好的错误提示
}
```

---

## 🔄 API版本兼容

当前API版本：**v1**

- 所有接口都向前兼容
- 新功能通过可选参数添加
- 废弃功能会提前通知

## 📞 技术支持

如有问题，请：
1. 检查API Key是否正确配置
2. 确认请求格式和参数
3. 查看服务器日志获取详细错误信息
4. 联系系统管理员获取技术支持

---
