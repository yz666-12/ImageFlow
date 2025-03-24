package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// 图片格式常量
const (
	FormatAVIF     = "avif"
	FormatWebP     = "webp"
	FormatOriginal = "original"
)

// 设备类型常量
const (
	DeviceMobile  = "mobile"
	DeviceDesktop = "desktop"
)

// 支持的图片扩展名
var supportedImageExtensions = []string{".jpg", ".jpeg", ".png"}

// getImageURL 获取图片URL
func getImageURL(key string) string {
	storageType := os.Getenv("STORAGE_TYPE")
	if storageType == "local" {
		return fmt.Sprintf("/static/images/%s", key)
	}

	// For S3 storage
	customDomain := os.Getenv("CUSTOM_DOMAIN")
	if customDomain != "" {
		return fmt.Sprintf("%s/%s", strings.TrimSuffix(customDomain, "/"), key)
	}

	// Fallback to S3 endpoint
	s3Endpoint := os.Getenv("S3_ENDPOINT")
	bucket := os.Getenv("S3_BUCKET")
	return fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(s3Endpoint, "/"+bucket), bucket, key)
}

// detectDeviceType 判断客户端是移动设备还是桌面设备
func detectDeviceType(userAgent string) string {
	mobilePlatforms := []string{
		"android", "webos", "iphone", "ipad", "ipod", "blackberry", "windows phone",
	}
	userAgent = strings.ToLower(userAgent)
	for _, platform := range mobilePlatforms {
		if strings.Contains(userAgent, platform) {
			return DeviceMobile
		}
	}
	return DeviceDesktop
}

// detectBestFormat 根据客户端能力确定最佳图片格式
func detectBestFormat(r *http.Request) string {
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "image/avif") {
		return FormatAVIF
	}
	if strings.Contains(accept, "image/webp") {
		return FormatWebP
	}
	return FormatOriginal
}

// determineOrientation 根据设备类型和请求参数确定图片方向
func determineOrientation(r *http.Request, deviceType string) string {
	orientation := r.URL.Query().Get("orientation")
	if orientation == "" {
		if deviceType == DeviceMobile {
			return "portrait"
		} else {
			return "landscape"
		}
	}
	return orientation
}

// getContentType 根据图片格式和文件名获取合适的Content-Type
func getContentType(format string, filename string) string {
	if format == FormatAVIF {
		return "image/avif"
	}
	if format == FormatWebP {
		return "image/webp"
	}

	// 根据文件扩展名判断
	lowerFilename := strings.ToLower(filename)
	if strings.HasSuffix(lowerFilename, ".png") {
		return "image/png"
	}
	// 默认为JPEG
	return "image/jpeg"
}

// setImageResponseHeaders 设置图片响应的HTTP头
func setImageResponseHeaders(w http.ResponseWriter, contentType string) {
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Vary", "Accept, User-Agent")
}

// getFormattedImagePath 根据格式获取图片路径
func getFormattedImagePath(format string, orientation string, filename string) string {
	switch format {
	case FormatAVIF:
		return fmt.Sprintf("%s/avif/%s.avif", orientation, filename)
	case FormatWebP:
		return fmt.Sprintf("%s/webp/%s.webp", orientation, filename)
	default:
		// 保持原始路径
		return fmt.Sprintf("original/%s/%s", orientation, filename)
	}
}

// isImageFile 检查文件名是否为支持的图片文件
func isImageFile(filename string) bool {
	lowerName := strings.ToLower(filename)
	for _, ext := range supportedImageExtensions {
		if strings.HasSuffix(lowerName, ext) {
			return true
		}
	}
	return false
}

// RandomImageHandler 处理S3存储的随机图片请求
func RandomImageHandler(s3Client *s3.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bucket := os.Getenv("S3_BUCKET")

		// 确定设备类型和方向
		deviceType := detectDeviceType(r.UserAgent())
		orientation := determineOrientation(r, deviceType)

		// 构建原始图片目录前缀
		prefix := fmt.Sprintf("original/%s/", orientation)

		// 列出对应目录中的对象
		output, err := s3Client.ListObjectsV2(context.Background(), &s3.ListObjectsV2Input{
			Bucket: &bucket,
			Prefix: aws.String(prefix),
		})

		if err != nil {
			log.Printf("Error listing objects: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// 过滤出图片文件
		var imageObjects []string
		for _, obj := range output.Contents {
			if isImageFile(*obj.Key) {
				imageObjects = append(imageObjects, *obj.Key)
			}
		}

		if len(imageObjects) == 0 {
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// 选择一个随机图片
		rand.Seed(time.Now().UnixNano())
		randomIndex := rand.Intn(len(imageObjects))
		originalKey := imageObjects[randomIndex]
		log.Printf("Selected random image: %s", originalKey)

		// 提取不带扩展名的文件名
		fileBaseName := filepath.Base(originalKey)
		filename := strings.TrimSuffix(fileBaseName, filepath.Ext(fileBaseName))

		// 确定客户端最佳格式
		bestFormat := detectBestFormat(r)

		// 获取图片路径
		imageKey := getFormattedImagePath(bestFormat, orientation, filename)
		log.Printf("Serving image format: %s, path: %s", bestFormat, imageKey)

		// 从S3获取图片
		data, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
			Bucket: &bucket,
			Key:    aws.String(imageKey),
		})

		if err != nil {
			log.Printf("Error getting image %s: %v", imageKey, err)
			// 如果特定格式不存在，尝试回退到原始图片
			if bestFormat != FormatOriginal {
				log.Printf("Falling back to original image format")
				data, err = s3Client.GetObject(r.Context(), &s3.GetObjectInput{
					Bucket: &bucket,
					Key:    aws.String(originalKey),
				})

				if err != nil {
					log.Printf("Error getting original image: %v", err)
					http.Error(w, "Image not found", http.StatusNotFound)
					return
				}

				// 使用原始格式
				bestFormat = FormatOriginal
				imageKey = originalKey
			} else {
				http.Error(w, "Image not found", http.StatusNotFound)
				return
			}
		}
		defer data.Body.Close()

		// 设置响应头
		contentType := getContentType(bestFormat, imageKey)
		setImageResponseHeaders(w, contentType)

		// 拷贝图片数据到响应
		if _, err := io.Copy(w, data.Body); err != nil {
			log.Printf("Error sending image: %v", err)
			return
		}
	}
}

// LocalRandomImageHandler 处理本地存储的随机图片请求
func LocalRandomImageHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 获取本地存储路径
		localPath := os.Getenv("LOCAL_STORAGE_PATH")

		// 确定设备类型和方向
		deviceType := detectDeviceType(r.UserAgent())
		orientation := determineOrientation(r, deviceType)

		// 构建原始图片目录路径
		originalDir := filepath.Join(localPath, "original", orientation)

		// 读取目录中的所有文件
		files, err := os.ReadDir(originalDir)
		if err != nil {
			log.Printf("Error reading directory %s: %v", originalDir, err)
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// 过滤出图片文件
		var imageFiles []string
		for _, file := range files {
			if !file.IsDir() && isImageFile(file.Name()) {
				imageFiles = append(imageFiles, file.Name())
			}
		}

		if len(imageFiles) == 0 {
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// 选择一个随机图片
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		randomImage := imageFiles[rng.Intn(len(imageFiles))]
		log.Printf("Selected random image: %s", randomImage)

		// 提取不带扩展名的文件名
		filename := strings.TrimSuffix(randomImage, filepath.Ext(randomImage))

		// 确定客户端最佳格式
		bestFormat := detectBestFormat(r)

		// 确定图片路径
		var imagePath string
		switch bestFormat {
		case FormatAVIF:
			imagePath = filepath.Join(localPath, orientation, "avif", filename+".avif")
		case FormatWebP:
			imagePath = filepath.Join(localPath, orientation, "webp", filename+".webp")
		default:
			imagePath = filepath.Join(localPath, "original", orientation, randomImage)
		}

		log.Printf("Serving image format: %s, path: %s", bestFormat, imagePath)

		// 检查文件是否存在
		if _, err := os.Stat(imagePath); os.IsNotExist(err) && bestFormat != FormatOriginal {
			// 如果转换格式不存在，回退到原始格式
			log.Printf("Converted format not found, falling back to original")
			imagePath = filepath.Join(localPath, "original", orientation, randomImage)
			bestFormat = FormatOriginal
		}

		// 读取图片文件
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			log.Printf("Error reading image %s: %v", imagePath, err)
			http.Error(w, "Image not found", http.StatusNotFound)
			return
		}

		// 设置响应头
		contentType := getContentType(bestFormat, imagePath)
		setImageResponseHeaders(w, contentType)

		// 发送图片数据
		if _, err := w.Write(imageData); err != nil {
			log.Printf("Error sending image: %v", err)
			return
		}
	}
}
