#!/bin/bash

# ImageFlow Cleanup Tool Builder
# 构建适用于Linux平台的清理工具二进制文件

set -e

TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TOOL_DIR"

echo "=========================================="
echo "ImageFlow Cleanup Tool Builder"
echo "=========================================="
echo ""

# 清理之前的构建
mkdir -p bin/

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    echo "Please install Go 1.22 or later"
    exit 1
fi

echo "📦 Building cleanup tools for Linux platforms..."
echo ""

# 构建配置
declare -A platforms=(
    ["linux-amd64"]="linux amd64"
    ["linux-arm64"]="linux arm64"
)

# 初始化Go模块
echo "🔧 Initializing Go modules..."
go mod tidy

# 构建各平台版本
for platform in "${!platforms[@]}"; do
    IFS=' ' read -ra PLATFORM <<< "${platforms[$platform]}"
    GOOS=${PLATFORM[0]}
    GOARCH=${PLATFORM[1]}
    
    output_name="cleanup-orphaned-$platform"
    
    echo "🏗️  Building cleanup tool for $GOOS/$GOARCH..."
    
    GOOS=$GOOS GOARCH=$GOARCH go build -ldflags="-s -w" -o "bin/$output_name" cleanup-orphaned.go
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $output_name"
    else
        echo "   ❌ Failed to build $output_name"
        exit 1
    fi
done

echo ""
echo "📁 Built cleanup tools:"
ls -la bin/cleanup-orphaned-*

# 创建使用脚本
cat > bin/run-cleanup.sh << 'EOF'
#!/bin/bash

# ImageFlow Cleanup Tool Runner (Linux)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BINARY="cleanup-orphaned-linux-amd64"
        ;;
    aarch64|arm64)
        BINARY="cleanup-orphaned-linux-arm64"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        echo "Supported architectures: x86_64, aarch64"
        exit 1
        ;;
esac

BINARY_PATH="$SCRIPT_DIR/$BINARY"

if [ ! -f "$BINARY_PATH" ]; then
    echo "❌ Binary not found: $BINARY_PATH"
    echo "Please make sure the cleanup tool is properly installed"
    exit 1
fi

# Make sure binary is executable
chmod +x "$BINARY_PATH"

# Run the cleanup tool
echo "🚀 Running ImageFlow orphaned image ID cleanup tool..."
echo "   Using binary: $BINARY"
echo ""
exec "$BINARY_PATH" "$@"
EOF

# 设置脚本执行权限
chmod +x bin/run-cleanup.sh

echo ""
echo "✅ Cleanup tool build completed successfully!"
echo ""
echo "📂 Output directory: bin/"
echo ""
echo "🚀 Usage:"
echo "   Linux:   ./bin/run-cleanup.sh"
echo ""
echo "📝 Or run directly:"
echo "   Linux x64:   ./bin/cleanup-orphaned-linux-amd64"  
echo "   Linux ARM64: ./bin/cleanup-orphaned-linux-arm64"
echo ""