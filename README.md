# ImageFlow - Modern Image Service System

<div align="center">

[中文文档](README_zh.md)
|
[部署说明](https://catcat.blog/imageflow-install.html)
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/Yuri-NagaSaki/ImageFlow/main/favicon/favicon.svg" alt="ImageFlow Logo" width="120" height="120" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 16px;">
  <h3>Efficient and Intelligent Image Management and Distribution System</h3>

</div>

ImageFlow is an efficient image service system designed for modern websites and applications. It automatically provides the most suitable images based on device type and supports modern image formats like WebP and AVIF, significantly improving website performance and user experience.

## ✨ Key Features

- **API Key Authentication**: Secure API key verification mechanism to protect your image upload functionality
- **Adaptive Image Service**: Automatically provides landscape or portrait images based on device type (desktop/mobile)
- **Modern Format Support**: Automatically detects browser compatibility and serves WebP or AVIF format images
- **Image Expiration**: Set expiration times for images with automatic deletion when expired (works with both local and S3 storage)
- **Simple API**: Get random images through simple API calls with tag filtering support
- **User-Friendly Upload Interface**: Drag-and-drop upload interface with dark mode support, real-time preview, and tag management
- **Image Management**: View, filter, and delete images with an intuitive management interface
- **Automatic Image Processing**: Automatically detects image orientation and converts to multiple formats after upload
- **Asynchronous Processing**: Image conversion happens in the background without affecting the main service
- **High Performance**: Optimized for network performance to reduce loading time
- **Easy Deployment**: Simple configuration and deployment process
- **Multiple Storage Support**: Supports local storage and S3-compatible storage (like R2)
- **Redis Support**: Optional Redis integration for metadata and tags storage with improved performance

## 🚀 Technical Advantages

1. **Security**: API key verification mechanism ensures secure access to image upload and management functionality
2. **Format Conversion**: Automatically converts uploaded images to WebP and AVIF formats, reducing file size by 30-50%
3. **Device Adaptation**: Provides the most suitable image orientation for different devices
4. **Image Lifecycle Management**: Set expiration times for images with automatic cleanup when expired across all storage types
5. **Hot Reload**: Uploaded images are immediately available without service restart
6. **Concurrent Processing**: Efficiently handles image conversion using Go's concurrency features
7. **Consistent Management**: When deleting an image, all related formats (original, WebP, AVIF) are removed simultaneously
8. **Scalability**: Modular design for easy extension and customization
9. **Responsive Design**: Perfect adaptation for desktop and mobile devices
10. **Dark Mode Support**: Automatically adapts to system theme with manual toggle option
11. **Flexible Storage**: Supports local and S3-compatible storage, easily configured via .env file
12. **High-Performance Metadata**: Optional Redis integration for faster metadata and tag operations

## 📸 Interface Preview

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

## 🔧 Quick Start

### Prerequisites

- Go 1.22 or higher
- Node.js 18 or higher (for frontend build)
- WebP tools (`libwebp-tools`)
- AVIF tools (`libavif-apps`)
- Redis (optional, for metadata and tags storage)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

#### Method 1: Direct Installation

1. Clone the repository

```bash
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow
```

2. Build frontend

```bash
cd frontend
bash build.sh
```

3. Build backend

```bash
go mod tidy
go build -o imageflow
```

4. Configure environment variables

```bash
cp .env.example .env
# Edit the .env file with your configuration
```

5. Set up system service (example using systemd)

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

6. Enable the service

```bash
sudo systemctl enable imageflow
sudo systemctl start imageflow
```

#### Method 2: Docker Deployment

1. Using pre-built image (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow

# 2. Configure environment
cp .env.example .env
# Edit the .env file

# 3. Start service
docker compose up -d
```

2. Local build deployment

```bash
# 1. Clone the repository
git clone https://github.com/Yuri-NagaSaki/ImageFlow.git
cd ImageFlow

# 2. Configure environment
cp .env.example .env
# Edit the .env file

# 3. Build and start
docker compose -f docker-compose-build.yml up --build -d
```

### Configuration Guide

Configure the system by creating and editing the `.env` file. Here are the main configuration options:

```bash
# API Key Configuration
API_KEY=your_api_key_here  # Set your API key

# Storage Configuration
STORAGE_TYPE=local  # Storage type: local or s3 (S3-compatible storage)
LOCAL_STORAGE_PATH=static/images  # Local storage path

# Redis Configuration
REDIS_ENABLED=true  # Enable Redis for metadata and tags storage
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=imageflow:
REDIS_TLS_ENABLED=false  # Enable TLS for Redis connection

# S3 Storage Configuration (required when STORAGE_TYPE=s3)
S3_ENDPOINT=  # S3 endpoint address
S3_REGION=    # S3 region
S3_ACCESS_KEY=  # Access key
S3_SECRET_KEY=  # Secret key
S3_BUCKET=      # Bucket name
CUSTOM_DOMAIN=  # Custom domain

# Image Processing Configuration
MAX_UPLOAD_COUNT=20    # Maximum upload count per request
IMAGE_QUALITY=80      # Image quality (1-100)
WORKER_THREADS=4      # Number of parallel processing threads
COMPRESSION_EFFORT=6  # Compression level (1-10)
FORCE_LOSSLESS=false  # Force lossless compression
```

### Metadata Migration

If you enable Redis after previously using file-based metadata storage, you can migrate your metadata to Redis:

```bash
# Run the migration tool
bash migrate.sh

# Force migration even if it was already completed
bash migrate.sh --force

# Specify a custom .env file
bash migrate.sh --env /path/to/.env
```

## 📝 Usage

### API Key Authentication

Image upload functionality requires API key authentication. You can:

1. Set the API key in the `.env` file
2. Enter the API key through the web interface
3. The API key will be saved after successful verification

### Uploading Images

Access the upload interface at `http://localhost:8686/`. You can:

1. Drag and drop images to the upload area
2. Click to select images for upload
3. Set an expiration time for images (optional)
4. Add tags to categorize your images (optional)
4. Preview selected images in real-time
5. System automatically detects if images are landscape or portrait
6. After upload, images are automatically converted to WebP and AVIF formats
7. If an expiration time is set, images will be automatically deleted after expiration

### Managing Images

Access the management interface at `http://localhost:8686/manage.html`. You can:

1. View all uploaded images with filtering options by format, orientation, and tags
2. Click on any image to view detailed information
3. Copy the direct URL to the image for easy sharing
4. Delete images when no longer needed (requires API key authentication)
5. When an image is deleted, all associated formats (original, WebP, AVIF) are removed simultaneously

### Getting Random Images

Get random images through the API (no API key required):

```
GET http://localhost:8686/api/random
GET http://localhost:8686/api/random?tag=nature
```

The system returns the most suitable image based on the device type and browser support in request headers. You can also filter random images by tags.

### API Reference

| Endpoint | Method | Description | Parameters | Authentication |
|----------|---------|-------------|------------|-------------|
| `/api/random` | GET | Get a random image | `tag`: Optional, filter by tag<br> | Not required |
| `/api/upload` | POST | Upload new images | Form data, field name "images[]"<br>Optional: `expiryMinutes` (expiration time in minutes)<br>Optional: `tags` (array of tags) | API key required |
| `/api/delete-image` | POST | Delete an image and all its formats | JSON with `id` and `storageType` | API key required |
| `/api/validate-api-key` | POST | Validate API key | API key in request header | Not required |
| `/api/images` | GET | List all uploaded images | Optional: `tag` (filter by tag) | API key required |
| `/api/config` | GET | Get system configuration | None | API key required |
| `/api/trigger-cleanup` | POST | Manually trigger cleanup of expired images | None | API key required |
| `/api/tags` | GET | Get all available tags | None | API key required |
| `/api/debug/tags` | GET | Get detailed tag information | None | API key required |

### Project Structure

```
ImageFlow/
├── .github/        # GitHub related configurations
├── cmd/            # Command-line tools
│   └── migrate/    # Metadata migration tool
├── config/         # Configuration related code
├── docs/           # Documentation and images
│   └── img/        # Documentation images
├── favicon/        # Favicon assets
├── frontend/       # Next.js frontend application
│   ├── app/        # Next.js app directory
│   │   ├── components/  # React components
│   │   │   ├── ImageDetail/  # Image detail components
│   │   │   ├── ui/     # UI common components
│   │   │   └── upload/ # Upload related components
│   │   ├── hooks/     # React hooks
│   │   ├── manage/    # Management page
│   │   ├── types/     # TypeScript type definitions
│   │   └── utils/     # Frontend utility functions
│   ├── public/     # Public assets
│   ├── next.config.mjs  # Next.js configuration file
│   ├── package.json    # Frontend dependencies
│   ├── build.sh        # Unix build script
│   └── build.bat       # Windows build script
├── handlers/       # HTTP request handlers
│   ├── auth.go     # Authentication handlers
│   ├── config.go   # Configuration handlers
│   ├── delete.go   # Image deletion handlers
│   ├── image.go    # Image handlers
│   ├── list.go     # Listing handlers
│   ├── random.go   # Random image handlers
│   ├── tags.go     # Tag handlers
│   └── upload.go   # Upload handlers
├── scripts/        # Utility scripts
│   └── convert.go  # Image conversion script
├── static/         # Static files and image storage
│   ├── _next/      # Next.js static assets
│   └── images/     # Image storage directory
│       ├── landscape/  # Landscape images
│       │   ├── avif/   # AVIF format
│       │   └── webp/   # WebP format
│       ├── portrait/   # Portrait images
│       │   ├── avif/   # AVIF format
│       │   └── webp/   # WebP format
│       ├── original/   # Original images
│       │   ├── landscape/  # Original landscape
│       │   └── portrait/   # Original portrait
│       ├── gif/       # GIF format images
│       └── metadata/  # Image metadata (including expiration information)
├── utils/          # Backend utility functions
│   ├── cleaner.go  # Expired image cleanup
│   ├── converter.go # Image conversion
│   ├── device.go   # Device detection
│   ├── helpers.go  # Helper functions
│   ├── image.go    # Image processing
│   ├── metadata.go # Metadata handling
│   ├── redis.go    # Redis client and operations
│   ├── s3client.go # S3 storage client
│   └── storage.go  # Storage interface
├── .env            # Environment variables
├── .env.example    # Example environment configuration
├── Dockerfile      # Main Docker configuration
├── Dockerfile.backend # Backend Docker configuration
├── Dockerfile.frontend # Frontend Docker configuration
├── docker-compose.yaml      # Docker Compose configuration (using pre-built image)
├── docker-compose-build.yml # Docker Compose build configuration
├── docker-compose-separate.yaml # Separate Docker Compose configuration
├── migrate.sh     # Metadata migration script
├── go.mod          # Go module file
├── go.sum          # Go module checksum
├── main.go         # Main application entry
├── README.md       # English project documentation
└── README_zh.md    # Chinese project documentation
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

Blog - [猫猫博客](https://catcat.blog)

Project Link: [https://github.com/Yuri-NagaSaki/ImageFlow](https://github.com/Yuri-NagaSaki/ImageFlow)

---
## ❤️ Thanks
[YXVM](https://support.nodeget.com/page/promotion?id=80)赞助了本项目

[NodeSupport](https://github.com/NodeSeekDev/NodeSupport)赞助了本项目

<div align="center">
  <p>⭐ If you like this project, please give it a star! ⭐</p>
  <p>Made with ❤️ by Yuri NagaSaki</p>
</div>



