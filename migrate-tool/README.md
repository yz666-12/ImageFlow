# ImageFlow 文件大小迁移工具

## 概述

这是一个独立的二进制工具，用于修复ImageFlow中图片文件大小显示为0B的问题。该工具会扫描Redis中的图片元数据，并添加正确的文件大小信息。

## 问题描述

在ImageFlow的早期版本中，图片管理页面显示的文件大小始终为0B，这是因为Redis中的图片元数据缺少文件大小信息。

## 功能特性

- ✅ 自动扫描Redis中的所有图片记录
- ✅ 计算原始、WebP和AVIF格式的文件大小
- ✅ 支持S3和本地存储两种模式
- ✅ 智能跳过已处理的记录，支持重复运行
- ✅ 详细的进度报告和错误处理
- ✅ 自动清理页面缓存确保更新生效
- ✅ 支持Linux平台：x86_64和ARM64架构
- ✅ 独立运行，无需Go环境
- ✅ 自动清理幽灵条目（孤立的Redis索引项）

## 工具套件

### 1. 迁移工具 (`migrate-sizes`)
修复现有图片的文件大小信息

### 2. 清理工具 (`cleanup-orphaned`)
清理Redis中的孤立图片索引项

## 安装与构建

### 方法1：直接构建（推荐给开发者）

```bash
cd migrate-tool/

# 构建迁移工具
./build.sh

# 构建清理工具
./build-cleanup.sh
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
   - 确保对图片文件有读取权限（本地存储）或S3访问权限

### 步骤1：运行迁移工具

```bash
# 方法1：使用自动检测脚本
./bin/run-linux.sh

# 方法2：直接运行对应架构的二进制
# x86_64架构
./bin/migrate-sizes-linux-amd64

# ARM64架构
./bin/migrate-sizes-linux-arm64
```

### 步骤2：运行清理工具（推荐）

清理Redis中的孤立图片索引项：

```bash
# 方法1：使用自动检测脚本
./bin/run-cleanup.sh

# 方法2：直接运行对应架构的二进制
# x86_64架构
./bin/cleanup-orphaned-linux-amd64

# ARM64架构
./bin/cleanup-orphaned-linux-arm64
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
   - 确认不会出现"幽灵"图片条目

## 配置要求

工具会自动从以下位置加载配置：
- 当前目录的 `.env` 文件
- 父目录的 `.env` 文件
- 系统环境变量

### 必需配置项

```bash
# Redis连接配置
REDIS_HOST=localhost                    # 或 mighty-mole-22151.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_password            # Upstash Redis需要
REDIS_DB=0
REDIS_TLS_ENABLED=false                 # Upstash Redis设为true
REDIS_ENABLED=true
METADATA_STORE_TYPE=redis

# 存储配置
STORAGE_TYPE=local                      # 或 s3
LOCAL_STORAGE_PATH=static/images

# S3配置（如使用S3存储）
S3_ENDPOINT=https://your-s3-endpoint.com
S3_REGION=your-region
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket
```

### 可选配置项

```bash
REDIS_PREFIX=imageflow:
```

## 日志文件

运行过程中会生成详细的日志文件：
- `migrate_sizes.log` - 包含详细的迁移过程和错误信息
- `cleanup_orphaned.log` - 包含清理过程的详细信息
- 控制台同时显示简化的进度信息

## 故障排除

### 常见错误

1. **连接Redis失败**
   ```
   failed to connect to Redis: dial tcp [::1]:6379: connect: connection refused
   ```
   - 检查Redis服务是否运行
   - 检查Redis连接配置
   - 如使用Upstash Redis，检查TLS配置

2. **找不到图片文件**
   ```
   No files found for image: xxx
   ```
   - 检查存储配置是否正确
   - 本地存储：检查 `LOCAL_STORAGE_PATH` 配置和文件权限
   - S3存储：检查S3配置和访问权限

3. **Redis未启用**
   ```
   Redis metadata store is not enabled
   ```
   - 检查 `REDIS_ENABLED=true`
   - 检查 `METADATA_STORE_TYPE=redis`

4. **S3访问失败**
   ```
   failed to access S3 bucket
   ```
   - 检查S3_ENDPOINT、S3_ACCESS_KEY、S3_SECRET_KEY配置
   - 检查网络连接
   - 检查S3存储桶权限

### 安全运行

- 工具只读取文件信息，不会修改或删除图片文件
- 支持重复运行，已处理的记录会被自动跳过
- 建议在低峰时段运行以减少对服务的影响
- 清理工具会自动检测并只清理孤立的索引项

## 性能说明

- 大型图片库的迁移可能需要几分钟时间
- S3存储需要网络请求，速度相对较慢
- 工具每处理10张图片会输出一次进度报告
- 内存占用很小，主要时间消耗在存储I/O操作

## 技术细节

- 使用Redis Pipeline批量操作提升性能
- 支持GIF文件的特殊处理
- 兼容现有的路径存储格式
- 自动清理页面缓存确保更新生效
- 支持S3 HEAD请求获取文件大小
- 统一的Redis缓存策略，避免直接查询存储

## 支持的平台

- Linux x86_64
- Linux ARM64

如果您需要其他平台支持，可以从源码自行构建。

## 重要说明

**修复内容包括：**
1. ✅ 图片文件大小显示问题
2. ✅ Redis索引清理不完整的问题  
3. ✅ 自动删除功能的Redis清理bug
4. ✅ 孤立图片索引项清理

**运行顺序：**
1. 先运行迁移工具修复文件大小
2. 再运行清理工具清除孤立索引项
3. 重启ImageFlow服务