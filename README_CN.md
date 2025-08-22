# ImageFlow

<div align="center">

[![中文文档](https://img.shields.io/badge/-%E4%B8%AD%E6%96%87%E6%96%87%E6%A1%A3-6366f1?logo=readthedocs&style=flat-square&logoColor=white)](README_CN.md)
|
[![部署说明](https://img.shields.io/badge/-%E9%83%A8%E7%BD%B2%E8%AF%B4%E6%98%8E-6366f1?logo=docker&style=flat-square&logoColor=white)](https://catcat.blog/imageflow-install.html)
|
[![贡献指南](https://img.shields.io/badge/-%E8%B4%A1%E7%8C%AE%E6%8C%87%E5%8D%97-6366f1?logo=github&style=flat-square&logoColor=white)](contributing.md)
|
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Yuri-NagaSaki/ImageFlow)
</div>

[English](README.md) | [中文文档](README_CN.md)

ImageFlow 是一个全栈图片管理平台，能够自动为不同设备和浏览器优化图片，同时提供强大的过滤和分发功能。

## ✨ 功能特性

### 🚀 **核心能力**
- **智能图片转换**: 使用 libvips 自动生成 WebP/AVIF 格式，性能卓越
- **设备感知服务**: 智能方向检测（移动设备竖屏，桌面设备横屏）
- **高级随机API**: 多标签过滤、排除规则和格式偏好
- **双重存储支持**: 本地文件系统或 S3 兼容存储
- **实时处理**: 后台工作池异步图片转换

### 🎯 **高级过滤**
- **多标签组合**: AND 逻辑精确内容选择
- **排除过滤器**: 防止 NSFW 或私密内容出现在公开 API 中
- **方向控制**: 强制横屏/竖屏，无视设备类型
- **格式协商**: 客户端感知格式选择（AVIF > WebP > 原格式）

### 🛡️ **安全与隐私**
- **API Key 认证**: 安全的上传和管理端点
- **智能默认值**: 随机 API 自动排除敏感内容
- **过期管理**: 自动清理过期图片
- **元数据保护**: 基于 Redis 的元数据，文件备份

### 🎨 **现代化前端**
- **Next.js 14**: App Router 配合 TypeScript 和 Tailwind CSS
- **拖拽上传**: 直观的文件上传，支持批量处理
- **深色模式**: 适应用户偏好的精美 UI
- **响应式设计**: 在所有设备尺寸上完美工作

## 🏃‍♂️ 快速开始

### 使用 Docker（推荐）

```bash
# 克隆仓库
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow

# 使用 Docker Compose 启动
docker-compose up -d

# 你的 ImageFlow 实例现在运行在 http://localhost:8080
```

### 手动安装

#### 环境要求
- **Go 1.22+**
- **Node.js 18+**
- **libvips**（用于图片处理）
- **Redis**（可选但推荐）

#### 后端设置

```bash
# 安装 Go 依赖
go mod tidy

# 配置环境
cp .env.example .env
# 编辑 .env 文件设置你的配置

# 构建并运行
go build -o imageflow
./imageflow
```

#### 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

## 🔧 配置说明

在项目根目录创建 `.env` 文件：

```bash
# 必需设置
API_KEY=your-secure-api-key-here
STORAGE_TYPE=local  # 或 's3'
LOCAL_STORAGE_PATH=static/images

# Redis 配置（可选但推荐）
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# S3 配置（当 STORAGE_TYPE=s3 时）
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
CUSTOM_DOMAIN=https://cdn.yourdomain.com

# 图片处理
MAX_UPLOAD_COUNT=20
IMAGE_QUALITY=80
WORKER_THREADS=4
SPEED=5
```

## 📚 API 使用

### 随机图片 API

ImageFlow 的核心功能 - 获得完美过滤的随机图片：

```bash
# 基础随机图片
GET /api/random?tag=nature

# 高级过滤
GET /api/random?tags=nature,landscape&exclude=nsfw&orientation=landscape&format=webp

# 移动端优化
GET /api/random?tag=wallpaper&orientation=portrait
```

### 上传 API

```bash
curl -X POST "https://your-domain.com/api/upload" \
  -H "Authorization: Bearer your-api-key" \
  -F "images[]=@photo1.jpg" \
  -F "images[]=@photo2.png" \
  -F "tags=nature,landscape" \
  -F "expiryMinutes=1440"
```

### 管理 API

```bash
# 带过滤的图片列表
GET /api/images?page=1&tag=nature&orientation=landscape

# 删除图片
POST /api/delete-image
Content-Type: application/json
{"id": "image-uuid"}

# 获取所有标签
GET /api/tags
```

完整的 API 文档请参考 [API_USAGE_GUIDE.md](API_USAGE_GUIDE.md)。

## 🏗️ 系统架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js 14   │    │    Go 后端       │    │    存储层       │
│                 │    │                  │    │                 │
│ • TypeScript    │◄──►│ • Fiber HTTP     │◄──►│ • 本地文件      │
│ • Tailwind CSS  │    │ • libvips        │    │ • S3 兼容       │
│ • App Router    │    │ • 工作池         │    │ • Redis 缓存    │
│ • 静态导出      │    │ • 自动格式转换   │    │ • 元数据        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 核心组件

- **图片处理器**: libvips 驱动的转换引擎
- **工作池**: 异步处理优化性能
- **元数据管理器**: Redis + 文件双重存储
- **智能路由**: 设备感知内容分发
- **安全层**: API key 认证 + 智能过滤

## 🚀 部署

### 单容器（推荐）

```bash
docker-compose up -d
```

### 分离式服务

```bash
# 前后端分离容器
docker-compose -f docker-compose-separate.yaml up -d
```

## 🔨 开发指南

### 项目结构

```
ImageFlow/
├── main.go                 # 应用入口
├── config/                 # 配置管理
├── handlers/               # HTTP 请求处理器
│   ├── random.go          # 高级随机图片 API
│   ├── upload.go          # 多文件上传处理器
│   └── *.go               # 其他 API 端点
├── utils/                  # 核心工具
│   ├── converter_bimg.go  # libvips 图片处理
│   ├── redis.go           # 元数据和缓存
│   ├── worker_pool.go     # 异步处理
│   └── *.go               # 存储、认证等
├── frontend/              # Next.js 应用
│   ├── app/               # App Router 结构
│   │   ├── components/    # React 组件
│   │   ├── hooks/         # 自定义 hooks
│   │   └── utils/         # 前端工具
│   └── package.json       # 依赖项
├── static/                # 生成的资源
└── docker-compose*.yaml   # 部署配置
```

## 📄 许可证

本项目基于 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- **libvips** - 高性能图片处理
- **Redis** - 闪电般快速的元数据存储
- **Next.js** - 出色的 React 框架
- **Fiber** - 受 Express 启发的 Go Web 框架
- **Tailwind CSS** - 实用优先的 CSS 框架

## 📞 支持

- 📖 [文档](API_USAGE_GUIDE.md)
- 🐛 [报告问题](https://github.com/Yuri-NagaSaki/ImageFlow/issues)
- 💬 [讨论](https://github.com/Yuri-NagaSaki/ImageFlow/discussions)

---

**由 catcat.blog 团队用 ❤️ 制作**

*立即转换你的图片工作流程！*
