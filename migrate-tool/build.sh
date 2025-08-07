#!/bin/bash

# ImageFlow File Size Migration Tool Builder
# 构建适用于不同平台的迁移工具二进制文件

set -e

TOOL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$TOOL_DIR"

echo "=========================================="
echo "ImageFlow Migration Tool Builder"
echo "=========================================="
echo ""

# 清理之前的构建
rm -rf bin/
mkdir -p bin/

# 检查Go环境
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    echo "Please install Go 1.22 or later"
    exit 1
fi

echo "📦 Building migration tools for different platforms..."
echo ""

# 构建配置
declare -A platforms=(
    ["linux-amd64"]="linux amd64"
    ["linux-arm64"]="linux arm64"
    ["windows-amd64"]="windows amd64"
    ["darwin-amd64"]="darwin amd64"
    ["darwin-arm64"]="darwin arm64"
)

# 初始化Go模块
echo "🔧 Initializing Go modules..."
go mod tidy

# 构建各平台版本
for platform in "${!platforms[@]}"; do
    IFS=' ' read -ra PLATFORM <<< "${platforms[$platform]}"
    GOOS=${PLATFORM[0]}
    GOARCH=${PLATFORM[1]}
    
    output_name="migrate-sizes-$platform"
    if [ "$GOOS" = "windows" ]; then
        output_name="$output_name.exe"
    fi
    
    echo "🏗️  Building for $GOOS/$GOARCH..."
    
    GOOS=$GOOS GOARCH=$GOARCH go build -ldflags="-s -w" -o "bin/$output_name" main.go
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $output_name"
    else
        echo "   ❌ Failed to build $output_name"
        exit 1
    fi
done

echo ""
echo "📁 Built files:"
ls -la bin/

# 创建使用脚本
cat > bin/run-linux.sh << 'EOF'
#!/bin/bash

# ImageFlow File Size Migration Tool Runner (Linux)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BINARY="migrate-sizes-linux-amd64"
        ;;
    aarch64|arm64)
        BINARY="migrate-sizes-linux-arm64"
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
    echo "Please make sure the migration tool is properly installed"
    exit 1
fi

# Make sure binary is executable
chmod +x "$BINARY_PATH"

# Run the migration tool
echo "🚀 Running ImageFlow file size migration tool..."
echo "   Using binary: $BINARY"
echo ""
exec "$BINARY_PATH" "$@"
EOF

cat > bin/run-macos.sh << 'EOF'
#!/bin/bash

# ImageFlow File Size Migration Tool Runner (macOS)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BINARY="migrate-sizes-darwin-amd64"
        ;;
    arm64)
        BINARY="migrate-sizes-darwin-arm64"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        echo "Supported architectures: x86_64, arm64"
        exit 1
        ;;
esac

BINARY_PATH="$SCRIPT_DIR/$BINARY"

if [ ! -f "$BINARY_PATH" ]; then
    echo "❌ Binary not found: $BINARY_PATH"
    echo "Please make sure the migration tool is properly installed"
    exit 1
fi

# Make sure binary is executable
chmod +x "$BINARY_PATH"

# Run the migration tool
echo "🚀 Running ImageFlow file size migration tool..."
echo "   Using binary: $BINARY"
echo ""
exec "$BINARY_PATH" "$@"
EOF

cat > bin/run-windows.bat << 'EOF'
@echo off

REM ImageFlow File Size Migration Tool Runner (Windows)

set SCRIPT_DIR=%~dp0
set BINARY=migrate-sizes-windows-amd64.exe
set BINARY_PATH=%SCRIPT_DIR%%BINARY%

if not exist "%BINARY_PATH%" (
    echo ❌ Binary not found: %BINARY_PATH%
    echo Please make sure the migration tool is properly installed
    pause
    exit /b 1
)

echo 🚀 Running ImageFlow file size migration tool...
echo    Using binary: %BINARY%
echo.

"%BINARY_PATH%" %*

if errorlevel 1 (
    echo.
    echo ❌ Migration failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Migration completed successfully!
pause
EOF

# 设置脚本执行权限
chmod +x bin/run-linux.sh bin/run-macos.sh

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📂 Output directory: bin/"
echo ""
echo "🚀 Usage:"
echo "   Linux:   ./bin/run-linux.sh"
echo "   macOS:   ./bin/run-macos.sh"
echo "   Windows: bin\\run-windows.bat"
echo ""
echo "📝 Or run directly:"
echo "   Linux x64:   ./bin/migrate-sizes-linux-amd64"
echo "   Linux ARM64: ./bin/migrate-sizes-linux-arm64"
echo "   macOS x64:   ./bin/migrate-sizes-darwin-amd64"
echo "   macOS ARM64: ./bin/migrate-sizes-darwin-arm64"
echo "   Windows:     bin\\migrate-sizes-windows-amd64.exe"
echo ""