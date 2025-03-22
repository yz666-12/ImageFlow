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

// detectDeviceType determines if the client is mobile or desktop
func detectDeviceType(userAgent string) string {
	mobilePlatforms := []string{
		"android", "webos", "iphone", "ipad", "ipod", "blackberry", "windows phone",
	}
	userAgent = strings.ToLower(userAgent)
	for _, platform := range mobilePlatforms {
		if strings.Contains(userAgent, platform) {
			return "mobile"
		}
	}
	return "desktop"
}

// detectBestFormat determines the best image format based on client capabilities
func detectBestFormat(r *http.Request) string {
	accept := r.Header.Get("Accept")

	// Check for AVIF support
	if strings.Contains(accept, "image/avif") {
		return "avif"
	}

	// Check for WebP support
	if strings.Contains(accept, "image/webp") {
		return "webp"
	}

	// Fallback to original/JPEG
	return "original"
}

func RandomImageHandler(s3Client *s3.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bucket := os.Getenv("S3_BUCKET")

		// Determine device type and orientation
		deviceType := detectDeviceType(r.UserAgent())
		orientation := r.URL.Query().Get("orientation") // 可以通过前端 JS 检测屏幕方向并传递
		if orientation == "" {
			if deviceType == "mobile" {
				orientation = "portrait" // 移动设备默认竖屏
			} else {
				orientation = "landscape" // 桌面设备默认横屏
			}
		}

		// Construct the appropriate prefix based on orientation
		prefix := fmt.Sprintf("original/%s/", orientation)

		// List objects in the appropriate directory
		output, err := s3Client.ListObjectsV2(context.Background(), &s3.ListObjectsV2Input{
			Bucket: &bucket,
			Prefix: aws.String(prefix),
		})
		if err != nil {
			log.Printf("Error listing objects: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		if len(output.Contents) == 0 {
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// Select a random image
		rand.Seed(time.Now().UnixNano())
		randomIndex := rand.Intn(len(output.Contents))
		originalKey := *output.Contents[randomIndex].Key
		log.Printf("Selected random image: %s", originalKey)

		// Extract filename without extension
		filename := strings.TrimSuffix(filepath.Base(originalKey), filepath.Ext(originalKey))

		// Determine best format for client
		bestFormat := detectBestFormat(r)

		// Get image key based on format and orientation
		var imageKey string
		switch bestFormat {
		case "avif":
			imageKey = fmt.Sprintf("%s/avif/%s.avif", orientation, filename)
		case "webp":
			imageKey = fmt.Sprintf("%s/webp/%s.webp", orientation, filename)
		default:
			imageKey = originalKey
		}
		log.Printf("Serving image format: %s, path: %s", bestFormat, imageKey)

		// Get the image from S3
		data, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
			Bucket: &bucket,
			Key:    aws.String(imageKey),
		})
		if err != nil {
			log.Printf("Error getting image %s: %v", imageKey, err)
			http.Error(w, "Image not found", http.StatusNotFound)
			return
		}
		defer data.Body.Close()

		// Set appropriate content type
		contentType := "image/jpeg"
		switch bestFormat {
		case "avif":
			contentType = "image/avif"
		case "webp":
			contentType = "image/webp"
		}

		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Cache-Control", "public, max-age=31536000")
		w.Header().Set("Vary", "Accept, User-Agent") // Important for CDN caching

		// Copy image data to response
		if _, err := io.Copy(w, data.Body); err != nil {
			log.Printf("Error sending image: %v", err)
			return
		}
	}
}

// LocalRandomImageHandler handles random image requests for local storage
func LocalRandomImageHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 获取本地存储路径
		localPath := os.Getenv("LOCAL_STORAGE_PATH")

		// 确定设备类型和方向
		deviceType := detectDeviceType(r.UserAgent())
		orientation := r.URL.Query().Get("orientation")
		if orientation == "" {
			if deviceType == "mobile" {
				orientation = "portrait"
			} else {
				orientation = "landscape"
			}
		}

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
			if !file.IsDir() && (strings.HasSuffix(strings.ToLower(file.Name()), ".jpg") ||
				strings.HasSuffix(strings.ToLower(file.Name()), ".jpeg")) {
				imageFiles = append(imageFiles, file.Name())
			}
		}

		if len(imageFiles) == 0 {
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// 随机选择一个图片
		rand.Seed(time.Now().UnixNano())
		randomImage := imageFiles[rand.Intn(len(imageFiles))]
		log.Printf("Selected random image: %s", randomImage)

		// 获取文件名（不含扩展名）
		filename := strings.TrimSuffix(randomImage, filepath.Ext(randomImage))

		// 确定最佳格式
		bestFormat := detectBestFormat(r)

		// 根据格式和方向构建图片路径
		var imagePath string
		switch bestFormat {
		case "avif":
			imagePath = filepath.Join(localPath, orientation, "avif", filename+".avif")
		case "webp":
			imagePath = filepath.Join(localPath, orientation, "webp", filename+".webp")
		default:
			imagePath = filepath.Join(localPath, "original", orientation, randomImage)
		}
		log.Printf("Serving image format: %s, path: %s", bestFormat, imagePath)

		// 读取图片文件
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			log.Printf("Error reading image %s: %v", imagePath, err)
			http.Error(w, "Image not found", http.StatusNotFound)
			return
		}

		// 设置适当的Content-Type
		contentType := "image/jpeg"
		switch bestFormat {
		case "avif":
			contentType = "image/avif"
		case "webp":
			contentType = "image/webp"
		}

		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Cache-Control", "public, max-age=31536000")
		w.Header().Set("Vary", "Accept, User-Agent")

		// 发送图片数据
		if _, err := w.Write(imageData); err != nil {
			log.Printf("Error sending image: %v", err)
			return
		}
	}
}
