

# ImageFlow

ImageFlow 是一个高效的图片服务系统，专为现代网站和应用程序设计。它能够根据设备类型自动提供最适合的图片，并支持现代图片格式如 WebP 和 AVIF，大幅提升网站性能和用户体验。

## 主要特性

- **自适应图片服务**：根据设备类型（桌面/移动）自动提供横屏或竖屏图片
- **现代格式支持**：自动检测浏览器兼容性，提供 WebP 或 AVIF 格式的图片
- **简单的 API**：通过简单的 API 调用获取随机图片
- **用户友好的上传界面**：拖放式上传界面，方便管理图片资源
- **自动图片处理**：上传后自动检测图片方向并转换为多种格式
- **异步处理**：图片转换在后台进行，不影响主服务
- **高性能**：针对网络性能优化，减少加载时间
- **易于部署**：简单的配置和部署流程

## 技术优势

1. **格式转换**：自动将上传的图片转换为 WebP 和 AVIF 格式，减少文件大小高达 30-50%
2. **设备适配**：为不同设备提供最合适的图片方向，提升用户体验
3. **热重载**：上传的图片立即可用，无需重启服务
4. **并发处理**：利用 Go 的并发特性高效处理图片转换
5. **可扩展性**：模块化设计，易于扩展和定制

## 快速开始

### 前置条件

- Go 1.16 或更高版本
- WebP 工具 (`cwebp`)
- AVIF 工具 (`avifenc`)

### 安装

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

### 配置

默认配置已经包含在代码中，但您可以通过创建 `config.json` 文件来自定义配置：

```json
{
  "server_addr": "0.0.0.0:8686",
  "image_base_path": "./static",
  "avif_support": true
}
```

### 运行

```bash
./imageflow
```

或者直接使用 Go 运行：

```bash
go run main.go
```

服务将在 `http://localhost:8686` 启动。

## 使用方法

### 上传图片

访问 `http://localhost:8686/upload` 打开上传界面，您可以：

1. 拖放图片到上传区域
2. 点击选择图片按钮上传
3. 系统会自动检测图片是横屏还是竖屏
4. 上传成功后，图片会自动转换为 WebP 和 AVIF 格式

### 获取随机图片

通过 API 获取随机图片：

```
GET http://localhost:8686/api/random
```

系统会根据请求头中的设备类型和浏览器支持情况，返回最合适的图片。

## 部署

### 服务器部署

1. 构建项目

```bash
go build -o imageflow
```

2. 设置系统服务（以 systemd 为例）

```
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

3. 启用服务

```bash
sudo systemctl enable imageflow
sudo systemctl start imageflow
```

## 项目结构

```
ImageFlow/
├── config/         # 配置相关代码
├── handlers/       # HTTP 处理器
├── scripts/        # 实用脚本
├── static/         # 静态文件和图片存储
│   ├── landscape/  # 横屏图片
│   │   ├── avif/   # AVIF 格式
│   │   └── webp/   # WebP 格式
│   └── portrait/   # 竖屏图片
│       ├── avif/   # AVIF 格式
│       └── webp/   # WebP 格式
├── utils/          # 工具函数
├── main.go         # 主程序入口
└── README.md       # 项目文档
```

## 贡献

欢迎贡献代码、报告问题或提出改进建议！


