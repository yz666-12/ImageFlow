# ImageFlow 文件大小迁移工具

## 概述

这是一个独立的二进制工具，用于修复ImageFlow中图片文件大小显示为0B的问题。该工具会扫描Redis中的图片元数据，并添加正确的文件大小信息。

## 问题描述

在ImageFlow的早期版本中，图片管理页面显示的文件大小始终为0B，这是因为Redis中的图片元数据缺少文件大小信息。

## 功能特性

- ✅ 自动扫描Redis中的所有图片记录
- ✅ 计算原始、WebP和AVIF格式的文件大小
- ✅ 智能跳过已处理的记录，支持重复运行
- ✅ 详细的进度报告和错误处理
- ✅ 自动清理页面缓存确保更新生效
- ✅ 支持多平台：Linux、macOS、Windows
- ✅ 独立运行，无需Go环境

## 安装与构建

### 方法1：直接构建（推荐给开发者）

```bash
cd migrate-tool/
./build.sh
```

构建完成后，会在 `bin/` 目录生成各平台的二进制文件。

### 方法2：下载预构建版本（推荐给用户）

1. 从项目releases页面下载对应平台的二进制文件
2. 解压到ImageFlow项目根目录
3. 按照下面的使用说明执行

## 使用方法

### 准备工作

1. **停止ImageFlow服务**（推荐）
   ```bash
   # systemd
   sudo systemctl stop imageflow
   
   # Docker
   docker-compose stop
   
   # 直接运行的进程
   kill $(pgrep imageflow)
   ```

2. **确保配置正确**
   - 确保 `.env` 文件存在且配置正确
   - 确保Redis服务正在运行
   - 确保对图片文件有读取权限

### 运行迁移工具

#### Linux系统
```bash
# 方法1：使用自动检测脚本
./bin/run-linux.sh

# 方法2：直接运行对应架构的二进制
# x86_64架构
./bin/migrate-sizes-linux-amd64

# ARM64架构
./bin/migrate-sizes-linux-arm64
```

#### macOS系统
```bash
# 方法1：使用自动检测脚本
./bin/run-macos.sh

# 方法2：直接运行对应架构的二进制
# Intel芯片
./bin/migrate-sizes-darwin-amd64

# Apple Silicon (M1/M2)
./bin/migrate-sizes-darwin-arm64
```

#### Windows系统
```cmd
# 方法1：使用批处理脚本
bin\run-windows.bat

# 方法2：直接运行二进制文件
bin\migrate-sizes-windows-amd64.exe
```

### 验证结果

迁移完成后：

1. **重启ImageFlow服务**
   ```bash
   # systemd
   sudo systemctl start imageflow
   
   # Docker
   docker-compose start
   
   # 直接运行
   ./imageflow
   ```

2. **检查结果**
   - 访问ImageFlow的图片管理页面
   - 确认图片卡片显示正确的文件大小（不再是0B）
   - 检查不同格式（Original/WebP/AVIF）都有对应的文件大小

## 配置要求

工具会自动从以下位置加载配置：
- 当前目录的 `.env` 文件
- 父目录的 `.env` 文件
- 系统环境变量

### 必需配置项

```bash
# Redis连接配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 可选
REDIS_DB=0
REDIS_ENABLED=true
METADATA_STORE_TYPE=redis

# 存储配置
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=static/images
```

### 可选配置项

```bash
REDIS_TLS_ENABLED=false
REDIS_PREFIX=imageflow:
```

## 日志文件

运行过程中会生成详细的日志文件：
- `migrate_sizes.log` - 包含详细的迁移过程和错误信息
- 控制台同时显示简化的进度信息

## 故障排除

### 常见错误

1. **连接Redis失败**
   ```
   failed to connect to Redis: dial tcp [::1]:6379: connect: connection refused
   ```
   - 检查Redis服务是否运行
   - 检查Redis连接配置

2. **找不到图片文件**
   ```
   No files found for image: xxx
   ```
   - 检查 `LOCAL_STORAGE_PATH` 配置是否正确
   - 检查图片文件权限

3. **Redis未启用**
   ```
   Redis metadata store is not enabled
   ```
   - 检查 `REDIS_ENABLED=true`
   - 检查 `METADATA_STORE_TYPE=redis`

### 安全运行

- 工具只读取文件信息，不会修改或删除图片文件
- 支持重复运行，已处理的记录会被自动跳过
- 建议在低峰时段运行以减少对服务的影响

## 性能说明

- 大型图片库的迁移可能需要几分钟时间
- 工具每处理10张图片会输出一次进度报告
- 内存占用很小，主要时间消耗在文件系统I/O操作

## 技术细节

- 使用Redis Pipeline批量操作提升性能
- 支持GIF文件的特殊处理
- 兼容现有的路径存储格式
- 自动清理页面缓存确保更新生效

## 支持的平台

- Linux x86_64
- Linux ARM64
- macOS x86_64 (Intel)
- macOS ARM64 (Apple Silicon)
- Windows x86_64

如果您的平台未列出，可以从源码自行构建。