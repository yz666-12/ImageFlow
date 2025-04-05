# ImageFlow - 现代图像服务系统

<div align="center">

[中文文档](README_zh.md)
|
[部署说明](https://catcat.blog/imageflow-install.html)
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/favicon/favicon.svg" alt="ImageFlow Logo" width="120" height="120" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 16px;">
  <h3>高效智能的图像管理和分发系统</h3>
</div>

ImageFlow 是一个为现代网站和应用程序设计的高效图像服务系统。它能根据设备类型自动提供最合适的图像，并支持 WebP 和 AVIF 等现代图像格式，显著提升网站性能和用户体验。

## ✨ 主要特性

- **API 密钥认证**：安全的 API 密钥验证机制，保护您的图片上传功能
- **自适应图像服务**：根据设备类型（桌面端/移动端）自动提供横向或纵向图片
- **现代格式支持**：自动检测浏览器兼容性并提供 WebP 或 AVIF 格式图片
- **图片过期功能**：支持设置图片过期时间，过期后自动删除
- **简单的 API**：通过简单的 API 调用获取随机图片
- **用户友好的上传界面**：支持拖拽上传，具有暗黑模式和实时预览功能
- **图片管理功能**：通过直观的管理界面查看、筛选和删除图片
- **自动图像处理**：上传后自动检测图像方向并转换为多种格式
- **异步处理**：图像转换在后台进行，不影响主服务
- **高性能**：优化的网络性能以减少加载时间
- **易于部署**：简单的配置和部署流程
- **多存储支持**：支持本地存储和 S3 兼容存储（如 R2）

## 🚀 技术优势

1. **安全性**：API 密钥验证机制确保图片上传和管理功能的安全访问
2. **格式转换**：自动将上传的图片转换为 WebP 和 AVIF 格式，减少 30-50% 的文件大小
3. **设备适配**：为不同设备提供最合适的图片方向
4. **图片生命周期管理**：支持设置图片过期时间，自动清理过期图片
5. **热重载**：上传的图片无需重启服务即可立即可用
6. **并发处理**：使用 Go 的并发特性高效处理图像转换
7. **一致性管理**：删除图片时，所有相关格式（原始、WebP、AVIF）会同时被移除
8. **可扩展性**：模块化设计便于扩展和定制
9. **响应式设计**：完美适配桌面端和移动端设备
10. **暗黑模式支持**：自动适应系统主题，支持手动切换
11. **灵活存储**：支持本地和 S3 兼容存储，通过 .env 文件轻松配置

## 📸 界面预览

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow1.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow2.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow3.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow4.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow5.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow6.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow7.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow8.png" alt="ImageFlow">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/docs/img/imageflow9.png" alt="ImageFlow">
</div>

## 🔧 快速开始

### 前置条件

- Go 1.16 或更高版本
- WebP 工具（`cwebp`）
- AVIF 工具（`avifenc`）
- Docker 和 Docker Compose（可选，用于容器化部署）

### 安装

#### 方法一：直接安装

1. 克隆仓库

```bash
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow
```

2. 初始化 Go 模块

```bash
go mod init github.com/Yuri-NagaSaki/ImageFlow
go mod tidy
```

3. 构建项目

```bash
go build -o imageflow
```

4. 设置系统服务（以 systemd 为例）

```ini
[Unit]
Description=ImageFlow Service
After=network.target

[Service]
ExecStart=/path/to/imageflow
WorkingDirectory=/path/to/imageflow/directory
Restart=always
User=youruser

[Install]
WantedBy=multi-user.target
```

5. 启用服务

```bash
sudo systemctl enable imageflow
sudo systemctl start imageflow
```

#### 方法二：Docker 部署

1. 克隆仓库并进入目录

```bash
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow
```

2. 配置 `.env` 文件

```bash
cp .env.example .env
# 编辑 .env 文件进行配置
```

3. 使用 Docker Compose 启动服务

```bash
docker compose up -d
```

服务将在 `http://localhost:8686` 启动。

### 配置

通过创建和编辑 `.env` 文件配置系统：

```bash
# API 密钥
API_KEY=your_api_key_here

# 存储配置
STORAGE_TYPE=local  # 选项：local, s3
LOCAL_STORAGE_PATH=static/images

# S3 配置（当 STORAGE_TYPE=s3 时需要）
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=

# 自定义域名（可选）
CUSTOM_DOMAIN=

# 图片过期设置
# 图片可以在上传时设置过期时间
# 系统将自动清理过期图片
```

#### 部署说明

- 服务默认运行在 8686 端口
- 图片文件通过卷持久化
- `.env` 文件通过卷挂载用于系统配置
- 自动包含 WebP 和 AVIF 转换工具
- 支持健康检查
- 存储类型（本地或 s3）通过 `.env` 文件中的 `STORAGE_TYPE` 配置

## 📝 使用方法

### API 密钥认证

图片上传功能需要 API 密钥认证。您可以：

1. 在 `.env` 文件中设置 API 密钥
2. 通过网页界面输入 API 密钥
3. API 密钥在验证成功后将被保存

### 上传图片

访问 `http://localhost:8686/` 的上传界面。您可以：

1. 将图片拖拽到上传区域
2. 点击选择要上传的图片
3. 选择图片的过期时间（可选）
4. 实时预览选中的图片
5. 系统自动检测图片是横向还是纵向
6. 上传后，图片会自动转换为 WebP 和 AVIF 格式
7. 如果设置了过期时间，图片将在过期后自动删除

### 管理图片

访问 `http://localhost:8686/manage.html` 的管理界面。您可以：

1. 查看所有已上传的图片，并可按格式和方向进行筛选
2. 点击任意图片查看详细信息
3. 复制图片的直接URL以方便分享
4. 删除不再需要的图片（需要API密钥认证）
5. 当删除图片时，所有相关格式（原始、WebP、AVIF）将同时被移除

### 获取随机图片

通过 API 获取随机图片（无需 API 密钥）：

```
GET http://localhost:8686/api/random
```

系统会根据请求头中的设备类型和浏览器支持返回最合适的图片。

### API 参考

| 接口 | 方法 | 描述 | 参数 | 认证 |
|----------|---------|-------------|------------|-------------|
| `/api/random` | GET | 获取随机图片 | `orientation`：可选，指定 "landscape" 或 "portrait" | 不需要 |
| `/api/upload` | POST | 上传新图片 | Form 数据，字段名 "images[]"<br>可选参数：`expiryMinutes`（过期时间，分钟） | 需要 API 密钥 |
| `/api/delete-image` | POST | 删除图片及其所有格式 | JSON 数据，包含 `id` 和 `storageType` | 需要 API 密钥 |
| `/api/validate-api-key` | POST | 验证 API 密钥 | 请求头中的 API 密钥 | 不需要 |
| `/api/images` | GET | 列出所有已上传的图片 | 无 | 需要 API 密钥 |
| `/api/config` | GET | 获取系统配置 | 无 | 需要 API 密钥 |
| `/api/trigger-cleanup` | POST | 手动触发清理过期图片 | 无 | 需要 API 密钥 |

### 项目结构

```
ImageFlow/
├── .github/        # GitHub 相关配置
├── config/         # 配置相关代码
├── docs/          # 文档和图片
├── favicon/       # 网站图标资源
├── frontend/      # Next.js 前端应用
│   ├── app/       # Next.js 应用目录
│   ├── public/    # 公共资源
│   ├── .next/     # Next.js 构建输出
│   ├── out/       # 静态导出输出
│   ├── build.sh   # Unix 构建脚本
│   └── build.bat  # Windows 构建脚本
├── handlers/      # HTTP 请求处理器
├── scripts/       # 实用脚本
├── static/        # 静态文件和图片存储
│   └── images/    # 图片存储目录
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
├── utils/         # 实用函数
├── .env          # 环境变量
├── .env.example  # 环境配置示例
├── Dockerfile    # Docker 配置
├── docker-compose.yaml      # Docker Compose 配置
├── docker-compose-build.yml # Docker Compose 构建配置
├── go.mod        # Go 模块文件
├── go.sum        # Go 模块校验和
├── main.go       # 主程序入口
└── README.md     # 项目文档
```

## 🤝 贡献

欢迎贡献！随时提交代码、报告问题或提出改进建议！

## 📄 许可证

本项目基于 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 📞 联系方式

Blog - [猫猫博客](https://catcat.blog)

项目链接：[https://github.com/Yuri-NagaSaki/ImageFlow](https://github.com/Yuri-NagaSaki/ImageFlow)

---

## ❤️ Thanks
[YXVM](https://support.nodeget.com/page/promotion?id=80)赞助了本项目

[NodeSupport](https://github.com/NodeSeekDev/NodeSupport)赞助了本项目

<div align="center">
  <p>⭐ 如果您喜欢这个项目，请给它一个星标！⭐</p>
  <p>由 Yuri NagaSaki 用 ❤️ 制作</p>
</div>
