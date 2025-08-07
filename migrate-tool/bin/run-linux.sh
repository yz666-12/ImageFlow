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
