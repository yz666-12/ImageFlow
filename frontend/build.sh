#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Building project..."
npm run build
echo "Copying static files to Go backend..."
rm -rf ../static/*
cp -r out/* ../static/
echo "Creating required directories..."
mkdir -p ../static/images/original/landscape
mkdir -p ../static/images/original/portrait
mkdir -p ../static/images/landscape/webp
mkdir -p ../static/images/landscape/avif
mkdir -p ../static/images/portrait/webp
mkdir -p ../static/images/portrait/avif
mkdir -p ../static/images/gif
echo "Build completed successfully!" 
