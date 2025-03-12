package handlers

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"  // 支持 GIF
	_ "image/jpeg" // 支持 JPEG
	_ "image/png"  // 支持 PNG
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
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
	// Fallback to S3 endpoint
	endpoint := strings.TrimSuffix(os.Getenv("S3_ENDPOINT"), "/imageflow")
	return fmt.Sprintf("%s/%s", endpoint, key)
}

func determineOrientation(img image.Config) string {
	if img.Width >= img.Height {
		return "landscape"
	}
	return "portrait"
}

func UploadHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form
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

		results := make([]map[string]interface{}, 0)

		for _, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				log.Printf("Error opening file: %v", err)
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  fmt.Sprintf("Error opening file: %v", err),
				})
				continue
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
				continue
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
				continue
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
				continue
			}

			// Generate filename
			timestamp := time.Now().Format("20060102_150405")
			filename := fmt.Sprintf("%s_%d", timestamp, time.Now().UnixNano()%10000)

			// Store original image
			originalKey := filepath.Join("original", orientation, filename+".jpg")
			if err := utils.Storage.Store(r.Context(), originalKey, data); err != nil {
				log.Printf("Error storing original image: %v", err)
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  fmt.Sprintf("Error storing original file: %v", err),
				})
				continue
			}
			log.Printf("Original image stored: %s", originalKey)

			// Convert and store WebP
			webpData, err := utils.ConvertToWebP(data)
			if err != nil {
				log.Printf("WebP conversion error: %v", err)
			} else {
				webpKey := filepath.Join(orientation, "webp", filename+".webp")
				if err := utils.Storage.Store(r.Context(), webpKey, webpData); err != nil {
					log.Printf("Error storing WebP image: %v", err)
				} else {
					log.Printf("WebP image stored: %s", webpKey)
				}
			}

			// Convert and store AVIF
			avifData, err := utils.ConvertToAVIF(data)
			if err != nil {
				log.Printf("AVIF conversion error: %v", err)
			} else {
				avifKey := filepath.Join(orientation, "avif", filename+".avif")
				if err := utils.Storage.Store(r.Context(), avifKey, avifData); err != nil {
					log.Printf("Error storing AVIF image: %v", err)
				} else {
					log.Printf("AVIF image stored: %s", avifKey)
				}
			}

			// Get URLs for response
			originalURL := getPublicURL(originalKey)
			webpURL := getPublicURL(filepath.Join(orientation, "webp", filename+".webp"))
			avifURL := getPublicURL(filepath.Join(orientation, "avif", filename+".avif"))

			results = append(results, map[string]interface{}{
				"filename":    fileHeader.Filename,
				"status":      "success",
				"message":     "File uploaded and converted successfully",
				"orientation": orientation,
				"urls": map[string]string{
					"original": originalURL,
					"webp":     webpURL,
					"avif":     avifURL,
				},
			})
		}

		// Return JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"results": results,
		})
	}
}
