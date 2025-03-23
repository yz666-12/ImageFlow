package utils

import (
	"bytes"
	"errors"
	"image"
	_ "image/gif"  // For GIF support
	_ "image/jpeg" // For JPEG support
	_ "image/png"  // For PNG support
	"io"
	"io/fs"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ImageFormatInfo contains information about an image's format
type ImageFormatInfo struct {
	Format     string // Format name (e.g., "jpeg", "png", "gif")
	Extension  string // File extension (e.g., ".jpg", ".png", ".gif")
	MimeType   string // MIME type (e.g., "image/jpeg", "image/png", "image/gif")
}

func init() {
	// 初始化随机数生成器
	rand.Seed(time.Now().UnixNano())
}

// DetectImageFormat detects the format of an image from its data
func DetectImageFormat(data []byte) (ImageFormatInfo, error) {
	// Create a reader from the data
	r := bytes.NewReader(data)
	
	// Detect the image format
	_, format, err := image.DecodeConfig(r)
	if err != nil {
		return ImageFormatInfo{}, err
	}
	
	// Rewind the reader for future use
	_, err = r.Seek(0, io.SeekStart)
	if err != nil {
		return ImageFormatInfo{}, err
	}
	
	// Convert format to lowercase
	format = strings.ToLower(format)
	
	// Map format to extension and MIME type
	switch format {
	case "jpeg":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".jpg",
			MimeType:  "image/jpeg",
		}, nil
	case "png":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".png",
			MimeType:  "image/png",
		}, nil
	case "gif":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".gif",
			MimeType:  "image/gif",
		}, nil
	default:
		// Default to jpeg for unknown formats
		return ImageFormatInfo{
			Format:    "jpeg",
			Extension: ".jpg",
			MimeType:  "image/jpeg",
		}, nil
	}
}

// GetRandomImage 获取随机图片路径
func GetRandomImage(basePath string, deviceType DeviceType, avifSupport bool) (string, error) {
	// 根据设备类型选择图片方向
	orientation := "landscape"
	if deviceType == Mobile {
		orientation = "portrait"
	}

	// 根据浏览器支持选择图片格式
	format := "webp"
	if avifSupport {
		format = "avif"
	}

	// 构建图片目录路径
	dirPath := filepath.Join(basePath, orientation, format)

	// 获取目录中的所有图片
	files, err := os.ReadDir(dirPath)
	if err != nil {
		return "", err
	}

	// 过滤出图片文件
	var imageFiles []fs.DirEntry
	for _, file := range files {
		if !file.IsDir() {
			ext := filepath.Ext(file.Name())
			if ext == ".webp" || ext == ".avif" || ext == ".jpg" || ext == ".jpeg" || ext == ".gif" || ext == ".png" {
				imageFiles = append(imageFiles, file)
			}
		}
	}

	if len(imageFiles) == 0 {
		return "", errors.New("no images found in directory")
	}

	// 随机选择一张图片
	randomIndex := rand.Intn(len(imageFiles))
	selectedImage := imageFiles[randomIndex]

	return filepath.Join(dirPath, selectedImage.Name()), nil
}
