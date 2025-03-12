package utils

import (
	"errors"
	"io/fs"
	"math/rand"
	"os"
	"path/filepath"
	"time"
)

func init() {
	// 初始化随机数生成器
	rand.Seed(time.Now().UnixNano())
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
			if ext == ".webp" || ext == ".avif" {
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
