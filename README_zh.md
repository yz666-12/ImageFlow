# ImageFlow - 现代图像服务系统

<div align="center">

[![English Document](https://img.shields.io/badge/-English%20Document-6366f1?logo=readthedocs&style=flat-square&logoColor=white)](README.md)
|
[![部署说明](https://img.shields.io/badge/-%E9%83%A8%E7%BD%B2%E8%AF%B4%E6%98%8E-6366f1?logo=docker&style=flat-square&logoColor=white)](https://catcat.blog/imageflow-install.html)
|
[![贡献指南](https://img.shields.io/badge/-%E8%B4%A1%E7%8C%AE%E6%8C%87%E5%8D%97-6366f1?logo=github&style=flat-square&logoColor=white)](contributing.md)
|
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Yuri-NagaSaki/ImageFlow)
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/favicon/favicon.svg" alt="ImageFlow Logo" width="120" height="120" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 16px;">
  <h3>高效智能的图像管理和分发系统</h3>
</div>

ImageFlow 是一个为现代网站和应用程序设计的高效图像服务系统。
它能根据设备类型自动提供最合适的图像，自适应提供 WebP 和 AVIF 等图像格式，显著提升网站性能和用户体验。

## ✨ 主要特性

- **API 密钥认证**：安全的 API 密钥验证机制，保护您的图片上传功能
- **自适应图像服务**：根据设备类型（桌面端/移动端）自动提供横向或纵向图片
- **现代格式支持**：自动检测浏览器兼容性并提供 WebP 或 AVIF 格式图片
- **图片过期功能**：支持设置图片过期时间，过期后自动删除（支持本地和S3存储）
- **简单的 API**：通过简单的 API 调用获取随机图片，支持标签过滤
- **用户友好的上传界面**：支持拖拽上传，具有暗黑模式、实时预览和标签管理功能
- **图片管理功能**：通过直观的管理界面查看、筛选和删除图片
- **自动图像处理**：上传后自动检测图像方向并转换为多种格式
- **异步处理**：图像转换在后台进行，不影响主服务
- **高性能**：优化的网络性能以减少加载时间
- **易于部署**：简单的配置和部署流程
- **多存储支持**：支持本地存储和 S3 兼容存储
- **Redis 支持**：可选的 Redis 集成，用于元数据和标签存储，提高性能

## 📸 界面预览

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/image1.webp" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/image2.webp" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/image3.webp" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/image4.webp" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/image5.webp" alt="ImageFlow">
</div>

## 🔧 快速开始

### 前置条件

- Go 1.22 或更高版本
- Node.js 18 或更高版本（用于构建前端）
- libvips 库（用于图片转换）
- Redis（可选，用于元数据和标签存储）
- Docker（可选，用于容器化部署）

### 安装

#### 方法一：直接安装

1. 克隆仓库

```bash
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow
```

2. 构建前端

```bash
cd frontend
bash build.sh
cd ..
```

3. 构建后端

```bash
go mod tidy
go build -o imageflow
```

4. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件进行配置
```

5. 设置系统服务（以 systemd 为例）

```ini
[Unit]
Description=ImageFlow Service
After=network.target

[Service]
ExecStart=/path/to/imageflow
WorkingDirectory=/path/to/imageflow/directory
Restart=always
User=youruser
EnvironmentFile=/path/to/imageflow/.env

[Install]
WantedBy=multi-user.target
```

6. 启用服务

```bash
sudo systemctl enable imageflow
sudo systemctl start imageflow
```

#### 方法二：Docker 部署

##### 前后端分离版本 部署（优化图片的加载，缺点占用大）
1. 使用预构建镜像（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动服务
docker compose -f docker-compose-separate.yaml up -d
```

2. 本地构建部署

```bash
# 1. 克隆仓库
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 构建并启动
docker compose -f docker-compose-separate-build.yaml up --build -d
```
##### 纯后端部署（由于原生html的问题，存在图片加载缓慢的问题）

```bash
# 1. 克隆仓库
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动服务
docker compose -f docker-compose.yaml up -d
```


### 配置说明

通过创建和编辑 `.env` 文件配置系统。以下是主要配置项说明：

```bash
# API 密钥配置
API_KEY=your_api_key_here  # 设置您的 API 密钥

# 存储配置
STORAGE_TYPE=local  # 存储类型：local（本地存储）或 s3（S3 兼容存储）
METADATA_STORE_TYPE=redis # 未来支持
LOCAL_STORAGE_PATH=static/images  # 本地存储路径

# Redis 配置
REDIS_ENABLED=true  # 启用 Redis 存储元数据和标签
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS_ENABLED=false  # 启用 Redis TLS 连接

# S3 存储配置（当 STORAGE_TYPE=s3 时需要）
S3_ENDPOINT=  # S3 端点地址
S3_REGION=    # S3 区域
S3_ACCESS_KEY=  # 访问密钥
S3_SECRET_KEY=  # 访问密钥密文
S3_BUCKET=      # 存储桶名称
CUSTOM_DOMAIN=  # S3自定义域名

# 图像处理配置
MAX_UPLOAD_COUNT=20    # 单次最大上传数量
IMAGE_QUALITY=80      # 图像质量（1-100）
WORKER_THREADS=4      # 并行处理线程数
SPEED=5               # 编码速度（0-8）

# 部署前后端分离才需要的参数
#NEXT_PUBLIC_API_URL=http://localhost:8686 后端地址
NEXT_PUBLIC_API_URL=
# 后端地址和图片域名（如果使用本地存储，则不需要）
NEXT_PUBLIC_REMOTE_PATTERNS=

```

### 元数据迁移

如果您在之前使用基于文件的元数据存储后启用了 Redis，可以将元数据迁移到 Redis：

```bash
# 运行迁移工具
bash migrate.sh

# 强制迁移（即使之前已完成）
bash migrate.sh --force

# 指定自定义 .env 文件
bash migrate.sh --env /path/to/.env
```

## 📝 使用方法

### 获取随机图片

通过 API 获取随机图片（无需 API 密钥）：

```
GET http://localhost:8686/api/random
GET http://localhost:8686/api/random?tag=nature
```

系统会根据请求头中的设备类型和浏览器支持返回最合适的图片。您还可以通过标签筛选随机图片。

### API 参考

| 接口 | 方法 | 描述 | 参数 | 认证 |
|----------|---------|-------------|------------|-------------|
| `/api/random` | GET | 获取随机图片 | `tag`：可选，按标签筛选<br> | 不需要 |
| `/api/upload` | POST | 上传新图片 | Form 数据，字段名 "images[]"<br>可选参数：`expiryMinutes`（过期时间，分钟）<br>可选参数：`tags`（标签数组） | 需要 API 密钥 |
| `/api/delete-image` | POST | 删除图片及其所有格式 | JSON 数据，包含 `id` 和 `storageType` | 需要 API 密钥 |
| `/api/validate-api-key` | POST | 验证 API 密钥 | 请求头中的 API 密钥 | 不需要 |
| `/api/images` | GET | 列出所有已上传的图片 | 可选：`tag`（按标签筛选） | 需要 API 密钥 |
| `/api/config` | GET | 获取系统配置 | 无 | 需要 API 密钥 |
| `/api/trigger-cleanup` | POST | 手动触发清理过期图片 | 无 | 需要 API 密钥 |
| `/api/tags` | GET | 获取所有可用标签 | 无 | 需要 API 密钥 |
| `/api/debug/tags` | GET | 获取详细标签信息 | 无 | 需要 API 密钥 |

### 项目结构

```
ImageFlow/
├── .github/        # GitHub 相关配置
├── cmd/            # 命令行工具
│   └── migrate/    # 元数据迁移工具
├── config/         # 配置相关代码
├── docs/           # 文档和图片
│   └── img/        # 文档图片
├── favicon/        # 网站图标资源
├── frontend/       # Next.js 前端应用
│   ├── app/        # Next.js 应用目录
│   │   ├── components/  # React 组件
│   │   │   ├── ImageDetail/  # 图片详情相关组件
│   │   │   ├── ui/     # UI 通用组件
│   │   │   └── upload/ # 上传相关组件
│   │   ├── hooks/     # React 钩子函数
│   │   ├── manage/    # 管理页面
│   │   ├── types/     # TypeScript 类型定义
│   │   └── utils/     # 前端工具函数
│   ├── public/     # 公共资源
│   ├── next.config.mjs  # Next.js 配置文件
│   ├── package.json    # 前端依赖配置
│   ├── build.sh        # Unix 构建脚本
│   └── build.bat       # Windows 构建脚本
├── handlers/       # HTTP 请求处理器
│   ├── auth.go     # 认证相关处理
│   ├── config.go   # 配置相关处理
│   ├── delete.go   # 删除图片处理
│   ├── image.go    # 图片处理
│   ├── list.go     # 列表处理
│   ├── random.go   # 随机图片处理
│   ├── tags.go     # 标签处理
│   └── upload.go   # 上传处理
├── scripts/        # 实用脚本
│   └── convert.go  # 图片转换脚本
├── static/         # 静态文件和图片存储
│   ├── _next/      # Next.js 静态资源
│   └── images/     # 图片存储目录
│       ├── landscape/  # 横向图片
│       │   ├── avif/   # AVIF 格式
│       │   └── webp/   # WebP 格式
│       ├── portrait/   # 纵向图片
│       │   ├── avif/   # AVIF 格式
│       │   └── webp/   # WebP 格式
│       ├── original/   # 原始图片
│       │   ├── landscape/  # 原始横向图片
│       │   └── portrait/   # 原始纵向图片
│       ├── gif/       # GIF 格式图片
│       └── metadata/  # 图片元数据（包含过期时间信息）
├── utils/          # 后端工具函数
│   ├── cleaner.go  # 清理过期图片
│   ├── converter_bimg.go # 图片转换
│   ├── device.go   # 设备检测
│   ├── helpers.go  # 辅助函数
│   ├── image.go    # 图片处理
│   ├── metadata.go # 元数据处理
│   ├── redis.go    # Redis 客户端和操作
│   ├── s3client.go # S3 存储客户端
│   └── storage.go  # 存储接口
├── .env            # 环境变量
├── .env.example    # 环境配置示例
├── Dockerfile      # 主 Docker 配置
├── Dockerfile.backend # 后端 Docker 配置
├── Dockerfile.frontend # 前端 Docker 配置
├── docker-compose-separate.yaml # 分离式 Docker Compose 配置
├── docker-compose.yaml      # Docker Compose 配置（使用预构建镜像）
├── docker-compose-build.yml # Docker Compose 构建配置
├── migrate.sh     # 元数据迁移脚本
├── go.mod          # Go 模块文件
├── go.sum          # Go 模块校验和
├── main.go         # 主程序入口
├── README.md       # 英文项目文档
└── README_zh.md    # 中文项目文档
```

## 📄 许可证

本项目基于 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 📞 联系方式

Blog - [猫猫博客](https://catcat.blog)

---

## ❤️ Thanks
[YXVM](https://support.nodeget.com/page/promotion?id=80)赞助了本项目

[NodeSupport](https://github.com/NodeSeekDev/NodeSupport)赞助了本项目

<div align="center">
  <p>⭐ 如果您喜欢这个项目，请给它一个星标！⭐</p>
  <p>由 Yuri NagaSaki 用 ❤️ 制作</p>
</div>
