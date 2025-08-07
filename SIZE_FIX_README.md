# 图片大小信息修复

## 问题描述

在ImageFlow的早期版本中，图片列表API返回的文件大小字段为0B，导致前端显示不正确。

## 修复内容

1. **后端修复**: 修改 `handlers/list.go` 中的 `listImagesFromRedis` 函数，添加了从文件系统读取文件大小的逻辑
2. **独立迁移工具**: 提供 `migrate-tool/` 目录下的独立二进制迁移工具

## 使用方法

### 1. 重新构建应用

```bash
go build -o imageflow
```

### 2. 构建并运行迁移工具

```bash
# 进入迁移工具目录
cd migrate-tool/

# 构建所有平台的二进制文件
./build.sh

# 运行迁移（根据您的系统选择）
# Linux系统
./bin/run-linux.sh

# macOS系统  
./bin/run-macos.sh

# Windows系统
bin\run-windows.bat
```

### 3. 重启ImageFlow服务

```bash
# 如果使用systemd
sudo systemctl restart imageflow

# 如果使用Docker
docker-compose restart

# 如果直接运行
./imageflow
```

## 迁移工具特性

- ✅ **独立运行**: 编译为二进制文件，无需Go环境
- ✅ **跨平台支持**: Linux/macOS/Windows，支持x64和ARM64架构  
- ✅ **智能检测**: 自动跳过已处理的记录，支持重复运行
- ✅ **进度跟踪**: 详细的进度报告和错误处理
- ✅ **自动清理**: 清理页面缓存确保新数据生效
- ✅ **多格式支持**: 支持original/webp/avif格式的文件大小

## 目录结构

```
migrate-tool/
├── main.go           # 迁移工具源码
├── go.mod           # Go模块定义
├── build.sh         # 构建脚本
├── README.md        # 详细使用说明
└── bin/             # 构建输出目录
    ├── migrate-sizes-linux-amd64
    ├── migrate-sizes-linux-arm64
    ├── migrate-sizes-darwin-amd64
    ├── migrate-sizes-darwin-arm64
    ├── migrate-sizes-windows-amd64.exe
    ├── run-linux.sh
    ├── run-macos.sh
    └── run-windows.bat
```

## 注意事项

- 建议在执行迁移前停止ImageFlow服务
- 确保Redis服务正常运行
- 确保对图片文件有读取权限
- 迁移过程会生成详细的日志文件 `migrate_sizes.log`

## 验证修复

1. 重启服务后访问图片管理页面
2. 检查图片卡片是否显示正确的文件大小（不再是0B）
3. 确认不同格式（WebP/AVIF/Original）都显示对应的文件大小

## 详细说明

请查看 `migrate-tool/README.md` 获取更详细的使用说明、故障排除和技术细节。