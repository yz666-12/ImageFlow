# ImageFlow - 现代图片服务系统

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/static/images/favicon.svg" alt="ImageFlow Logo" width="120" height="120" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 16px;">
  <h3>高效、智能的图片管理与分发系统</h3>
</div>

ImageFlow 是一个高效的图片服务系统，专为现代网站和应用程序设计。它能够根据设备类型自动提供最适合的图片，并支持现代图片格式如 WebP 和 AVIF，大幅提升网站性能和用户体验。

## ✨ 主要特性

- **自适应图片服务**：根据设备类型（桌面/移动）自动提供横屏或竖屏图片
- **现代格式支持**：自动检测浏览器兼容性，提供 WebP 或 AVIF 格式的图片
- **简单的 API**：通过简单的 API 调用获取随机图片
- **用户友好的上传界面**：拖放式上传界面，支持暗黑模式，方便管理图片资源
- **自动图片处理**：上传后自动检测图片方向并转换为多种格式
- **异步处理**：图片转换在后台进行，不影响主服务
- **高性能**：针对网络性能优化，减少加载时间
- **易于部署**：简单的配置和部署流程

## 🚀 技术优势

1. **格式转换**：自动将上传的图片转换为 WebP 和 AVIF 格式，减少文件大小高达 30-50%
2. **设备适配**：为不同设备提供最合适的图片方向，提升用户体验
3. **热重载**：上传的图片立即可用，无需重启服务
4. **并发处理**：利用 Go 的并发特性高效处理图片转换
5. **可扩展性**：模块化设计，易于扩展和定制
6. **响应式设计**：完美适配桌面和移动设备
7. **暗黑模式支持**：自动适应系统主题，也可手动切换

## 📸 界面预览

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/static/images/imageflow.png" alt="ImageFlow">
</div>

## 🔧 快速开始

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

## 📝 使用方法

### 上传图片

访问 `http://localhost:8686/` 打开上传界面，您可以：

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

### API 参考

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/api/random` | GET | 获取随机图片 | `orientation`: 可选，指定 "landscape" 或 "portrait" |
| `/api/images` | GET | 获取图片列表 | `limit`: 可选，限制返回数量 |
| `/upload` | POST | 上传新图片 | 表单数据，字段名 "image" |

## 🌐 前端功能

ImageFlow 提供了一个现代化的用户界面，具有以下特点：

- **响应式设计**：完美适配各种屏幕尺寸
- **暗黑模式**：支持系统主题自动切换，也可手动切换
- **拖放上传**：简单直观的文件上传体验
- **实时预览**：上传前预览图片
- **上传进度**：显示上传和处理进度
- **动态背景**：美观的动态背景效果
- **无刷新操作**：所有操作无需刷新页面

## 🛠️ 部署

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

### Docker 部署

```bash
# 构建镜像
docker build -t imageflow .

# 运行容器
docker run -d -p 8686:8686 -v /path/to/images:/app/static imageflow
```

## 📁 项目结构

```
ImageFlow/
├── config/         # 配置相关代码
├── handlers/       # HTTP 处理器
├── scripts/        # 实用脚本
├── static/         # 静态文件和图片存储
│   ├── images/     # 图标和界面图片
│   ├── styles.css  # 样式表
│   ├── upload.js   # 上传功能脚本
│   ├── landscape/  # 横屏图片
│   │   ├── avif/   # AVIF 格式
│   │   └── webp/   # WebP 格式
│   └── portrait/   # 竖屏图片
│       ├── avif/   # AVIF 格式
│       └── webp/   # WebP 格式
├── utils/          # 工具函数
├── main.go         # 主程序入口
├── Dockerfile      # Docker 构建文件
└── README.md       # 项目文档
```

## 🔄 未来计划

- [ ] 图片编辑功能
- [ ] 图片分类和标签
- [ ] 用户认证系统
- [ ] 图片压缩质量选项
- [ ] CDN 集成
- [ ] 批量上传功能
- [ ] 图片分析和统计

## 🤝 贡献

欢迎贡献代码、报告问题或提出改进建议！

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 📞 联系方式

Yuri NagaSaki - [@YuriNagaSaki](https://twitter.com/YuriNagaSaki) - yuri@example.com

项目链接: [https://github.com/Yuri-NagaSaki/ImageFlow](https://github.com/Yuri-NagaSaki/ImageFlow)

---

<div align="center">
  <p>⭐ 如果您喜欢这个项目，请给它一个星星！ ⭐</p>
  <p>Made with ❤️ by Yuri NagaSaki</p>
</div>



