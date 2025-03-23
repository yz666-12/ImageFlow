#!/bin/bash

# 安装依赖
echo "Installing dependencies..."
npm install

# 构建项目
echo "Building project..."
npm run build

# 复制静态文件到Go后端的static目录
echo "Copying static files to Go backend..."
rm -rf ../static/*
cp -r out/* ../static/

echo "Build completed successfully!" 