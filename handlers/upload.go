package handlers

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"  // 支持 GIF
	_ "image/jpeg" // 支持 JPEG
	_ "image/png"  // 支持 PNG
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
)

func getPublicURL(key string) string {
	storageType := os.Getenv("STORAGE_TYPE")
	if storageType == "local" {
		return fmt.Sprintf("/images/%s", key)
	}
	// For S3 storage
	customDomain := os.Getenv("CUSTOM_DOMAIN")
	if customDomain != "" {
		return fmt.Sprintf("%s/%s", strings.TrimSuffix(customDomain, "/"), key)
	}
	// Fallback to S3 endpoint with bucket name
	endpoint := strings.TrimSuffix(os.Getenv("S3_ENDPOINT"), "/")
	bucket := os.Getenv("S3_BUCKET")
	return fmt.Sprintf("%s/%s/%s", endpoint, bucket, key)
}

func determineOrientation(img image.Config) string {
	// 只有当宽度严格大于高度时才判断为横屏
	// 正方形和竖型图片都归类为竖屏
	if img.Width > img.Height {
		return "landscape"
	}
	return "portrait"
}

func UploadHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		workerSemaphore := make(chan struct{}, cfg.WorkerThreads)
		log.Printf("使用 %d 个并行工作线程进行图片处理", cfg.WorkerThreads)
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form with default max upload size (32MB)
		if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max memory
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		// Get uploaded files
		files := r.MultipartForm.File["images[]"]
		if len(files) == 0 {
			http.Error(w, "No files uploaded", http.StatusBadRequest)
			return
		}

		// 检查上传的图片数量是否超过最大限制
		if len(files) > cfg.MaxUploadCount {
			http.Error(w, fmt.Sprintf("Too many files uploaded. Maximum allowed is %d files", cfg.MaxUploadCount), http.StatusBadRequest)
			return
		}

		// 创建结果数组和等待组
		results := make([]map[string]interface{}, 0, len(files))
		resultsMutex := sync.Mutex{}
		var wgFiles sync.WaitGroup

		// 已在切面上方创建结果数组

		for _, fileHeader := range files {
			// 为每个文件添加到等待组
			wgFiles.Add(1)

			// 启动goroutine处理文件
			go func(fileHeader *multipart.FileHeader) {
				defer wgFiles.Done()

				// 获取工作线程槽位
				workerSemaphore <- struct{}{}
				defer func() { <-workerSemaphore }()
				file, err := fileHeader.Open()
				if err != nil {
					log.Printf("Error opening file: %v", err)
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error opening file: %v", err),
					})
					// 向结果数组中添加失败结果
					resultsMutex.Lock()
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error opening file: %v", err),
					})
					resultsMutex.Unlock()
					return
				}
				defer file.Close()

				// Read image configuration to determine orientation
				img, _, err := image.DecodeConfig(file)
				if err != nil {
					log.Printf("Error reading image configuration: %v", err)
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error reading image configuration: %v", err),
					})
					// 向结果数组中添加失败结果
					resultsMutex.Lock()
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error opening file: %v", err),
					})
					resultsMutex.Unlock()
					return
				}
				orientation := determineOrientation(img)

				// Reset file pointer
				if _, err := file.Seek(0, 0); err != nil {
					log.Printf("Error resetting file pointer: %v", err)
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error resetting file pointer: %v", err),
					})
					// 向结果数组中添加失败结果
					resultsMutex.Lock()
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error opening file: %v", err),
					})
					resultsMutex.Unlock()
					return
				}

				// Read file content
				data := make([]byte, fileHeader.Size)
				if _, err := file.Read(data); err != nil {
					log.Printf("Error reading file: %v", err)
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error reading file: %v", err),
					})
					// 向结果数组中添加失败结果
					resultsMutex.Lock()
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error opening file: %v", err),
					})
					resultsMutex.Unlock()
					return
				}

				// Generate filename
				timestamp := time.Now().Format("20060102_150405")
				filename := fmt.Sprintf("%s_%d", timestamp, time.Now().UnixNano()%10000)

				// Detect image format
				imgFormat, err := utils.DetectImageFormat(data)
				if err != nil {
					log.Printf("Error detecting image format: %v", err)
					resultsMutex.Lock()
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error detecting image format: %v", err),
					})
					resultsMutex.Unlock()
					return
				}

				// Check if it's a GIF file
				var originalKey string
				if imgFormat.Format == "gif" {
					// Store GIF in special directory
					originalKey = filepath.Join("gif", filename+imgFormat.Extension)
				} else {
					// Store other formats in original directory
					originalKey = filepath.Join("original", orientation, filename+imgFormat.Extension)
				}

				if err := utils.Storage.Store(r.Context(), originalKey, data); err != nil {
					log.Printf("Error storing original image: %v", err)
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error storing original file: %v", err),
					})
					// 向结果数组中添加失败结果
					resultsMutex.Lock()
					results = append(results, map[string]interface{}{
						"filename": fileHeader.Filename,
						"status":   "error",
						"message":  fmt.Sprintf("Error opening file: %v", err),
					})
					resultsMutex.Unlock()
					return
				}
				log.Printf("Original image stored: %s", originalKey)

				// 判断是否是GIF文件
				var wg sync.WaitGroup
				var webpURL, avifURL string

				if imgFormat.Format == "gif" {
					// GIF文件不进行转换，只存储原始格式
					log.Printf("GIF file stored in special directory: %s", originalKey)

					// 为结果数组添加成功结果
					resultsMutex.Lock()
					// Create a result that's consistent with the format of non-GIF files
					results = append(results, map[string]interface{}{
						"filename":    fileHeader.Filename,
						"status":      "success",
						"message":     "GIF file uploaded successfully",
						"format":      imgFormat.Format,
						"url":         getPublicURL(originalKey), // Include this for backward compatibility
						"urls": map[string]string{
							"original": getPublicURL(originalKey),
							// Include empty strings for webp and avif to maintain consistent structure
							"webp":     "",
							"avif":     "",
						},
					})
					resultsMutex.Unlock()
					return
				}

				// 非GIF文件进行正常转换
				// 创建通道用于存储转换结果
				webpResultCh := make(chan []byte, 1)
				avifResultCh := make(chan []byte, 1)

				// WebP 转换
				wg.Add(1)
				go func() {
					defer wg.Done()
					webpData, err := utils.ConvertToWebP(data)
					if err != nil {
						log.Printf("WebP conversion error: %v", err)
						webpResultCh <- nil
						return
					}
					webpResultCh <- webpData
				}()

				// AVIF 转换
				wg.Add(1)
				go func() {
					defer wg.Done()
					avifData, err := utils.ConvertToAVIF(data)
					if err != nil {
						log.Printf("AVIF conversion error: %v", err)
						avifResultCh <- nil
						return
					}
					avifResultCh <- avifData
				}()

				// 等待所有转换完成
				wg.Wait()

				// 处理 WebP 结果
				webpData := <-webpResultCh
				if webpData != nil {
					webpKey := filepath.Join(orientation, "webp", filename+".webp")
					if err := utils.Storage.Store(r.Context(), webpKey, webpData); err != nil {
						log.Printf("Error storing WebP image: %v", err)
					} else {
						log.Printf("WebP image stored: %s", webpKey)
						webpURL = getPublicURL(webpKey)
					}
				}

				// 处理 AVIF 结果
				avifData := <-avifResultCh
				if avifData != nil {
					avifKey := filepath.Join(orientation, "avif", filename+".avif")
					if err := utils.Storage.Store(r.Context(), avifKey, avifData); err != nil {
						log.Printf("Error storing AVIF image: %v", err)
					} else {
						log.Printf("AVIF image stored: %s", avifKey)
						avifURL = getPublicURL(avifKey)
					}
				}

				// Get URL for original image
				originalURL := getPublicURL(originalKey)

				// WebP and AVIF URLs were set during the conversion process
				// If they weren't set (due to conversion failure), set default values
				if webpURL == "" {
					webpURL = getPublicURL(filepath.Join(orientation, "webp", filename+".webp"))
				}
				if avifURL == "" {
					avifURL = getPublicURL(filepath.Join(orientation, "avif", filename+".avif"))
				}

				// 为结果数组添加成功结果
				resultsMutex.Lock()
				results = append(results, map[string]interface{}{
					"filename":    fileHeader.Filename,
					"status":      "success",
					"message":     "File uploaded and converted successfully",
					"orientation": orientation,
					"format":      imgFormat.Format,
					"urls": map[string]string{
						"original": originalURL,
						"webp":     webpURL,
						"avif":     avifURL,
					},
				})
				resultsMutex.Unlock()
			}(fileHeader) // 传递文件头到goroutine
		}

		// 等待所有文件处理完成
		wgFiles.Wait()

		// Return JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"results": results,
		})
	}
}
