package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// ImageInfo represents information about an image
type ImageInfo struct {
	ID          string `json:"id"`          // Filename without extension
	FileName    string `json:"fileName"`    // Full filename with extension
	URL         string `json:"url"`         // URL to access the image
	Orientation string `json:"orientation"` // landscape or portrait
	Format      string `json:"format"`      // original, webp, avif
	Size        int64  `json:"size"`        // File size in bytes
	Path        string `json:"path"`        // Path relative to storage root
	StorageType string `json:"storageType"` // "local" or "s3"
}

// PaginatedResponse represents a paginated response with images
type PaginatedResponse struct {
	Success    bool        `json:"success"`    // Whether the request was successful
	Images     []ImageInfo `json:"images"`     // Images for current page
	Page       int         `json:"page"`       // Current page number
	Limit      int         `json:"limit"`      // Number of items per page
	TotalPages int         `json:"totalPages"` // Total number of pages
	Total      int         `json:"total"`      // Total number of images
}

// ListImagesHandler returns a handler for listing images
func ListImagesHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get storage type from environment
		storageType := os.Getenv("STORAGE_TYPE")

		// Check for API key
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "未提供授权信息", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "授权格式无效", http.StatusUnauthorized)
			return
		}

		apiKey := parts[1]
		if apiKey != cfg.APIKey {
			http.Error(w, "API密钥无效", http.StatusUnauthorized)
			return
		}

		// Process query parameters
		orientation := r.URL.Query().Get("orientation")
		format := r.URL.Query().Get("format")
		
		// Parse pagination parameters
		pageStr := r.URL.Query().Get("page")
		limitStr := r.URL.Query().Get("limit")
		
		// Default values
		if orientation == "" {
			orientation = "all" // all, landscape, portrait
		}
		if format == "" {
			format = "original" // original, webp, avif
		}
		
		// Set default pagination values
		page := 1
		limit := 12 // Default items per page
		
		// Parse page number
		if pageStr != "" {
			pageVal, err := strconv.Atoi(pageStr)
			if err == nil && pageVal > 0 {
				page = pageVal
			}
		}
		
		// Parse limit
		if limitStr != "" {
			limitVal, err := strconv.Atoi(limitStr)
			if err == nil && limitVal > 0 && limitVal <= 50 { // Cap at 50 items per page
				limit = limitVal
			}
		}

		var allImages []ImageInfo
		var err error

		if storageType == "s3" {
			allImages, err = listS3Images(orientation, format)
		} else {
			allImages, err = listLocalImages(cfg.ImageBasePath, orientation, format)
		}

		if err != nil {
			log.Printf("Error listing images: %v", err)
			http.Error(w, "获取图片列表失败", http.StatusInternalServerError)
			return
		}
		
		// Sort images by filename in descending order (newest first)
		sort.Slice(allImages, func(i, j int) bool {
			return allImages[i].FileName > allImages[j].FileName
		})
		
		// Calculate pagination values
		total := len(allImages)
		totalPages := int(math.Ceil(float64(total) / float64(limit)))
		
		// Ensure page is within valid range
		if page > totalPages && totalPages > 0 {
			page = totalPages
		}
		
		// Calculate start and end indices for the current page
		start := (page - 1) * limit
		end := start + limit
		
		// Ensure end index is within bounds
		if end > total {
			end = total
		}
		
		// Extract the subset of images for the current page
		var pagedImages []ImageInfo
		if start < total {
			pagedImages = allImages[start:end]
		} else {
			pagedImages = []ImageInfo{} // Empty slice for out of range pages
		}

		// Set response headers
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		// Encode and send the paginated response
		response := PaginatedResponse{
			Success:    true,
			Images:     pagedImages,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
			Total:      total,
		}
		
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("Error encoding JSON response: %v", err)
		}
	}
}

// listLocalImages returns a list of images from the local filesystem
func listLocalImages(basePath, orientation, format string) ([]ImageInfo, error) {
	var images []ImageInfo
	var orientations []string
	var formats []string

	// Determine which orientations to list
	if orientation == "all" {
		orientations = []string{"landscape", "portrait"}
	} else {
		orientations = []string{orientation}
	}

	// Determine which formats to list
	if format == "all" {
		formats = []string{"original", "webp", "avif"}
	} else {
		formats = []string{format}
	}

	for _, orientVal := range orientations {
		for _, formatVal := range formats {
			var dirPath string
			var extension string

			// Construct the path based on format
			if formatVal == "original" {
				dirPath = filepath.Join(basePath, "original", orientVal)
				extension = ".jpg" // Assuming original images are JPG
			} else {
				dirPath = filepath.Join(basePath, orientVal, formatVal)
				extension = "." + formatVal
			}

			// List files in the directory
			files, err := os.ReadDir(dirPath)
			if err != nil {
				// Skip directory if it doesn't exist
				log.Printf("Warning: Could not read directory %s: %v", dirPath, err)
				continue
			}

			// Filter and collect image files
			for _, file := range files {
				if file.IsDir() {
					continue
				}

				fileName := file.Name()
				if strings.HasSuffix(strings.ToLower(fileName), extension) {
					// Get file info for size
					fileInfo, err := file.Info()
					if err != nil {
						log.Printf("Warning: Could not get file info for %s: %v", fileName, err)
						continue
					}

					// Construct image URL
					var firstPart, thirdPart string
					if formatVal == "original" {
						firstPart = "original"
						thirdPart = ""
					} else {
						firstPart = ""
						thirdPart = formatVal
					}
					relPath := filepath.Join(firstPart, orientVal, thirdPart, fileName)

					// 构建URL，与上传功能保持一致
					var url string
					storageType := os.Getenv("STORAGE_TYPE")
					if storageType == "local" {
						url = fmt.Sprintf("/images/%s", relPath)
					} else {
						// For S3 storage
						customDomain := os.Getenv("CUSTOM_DOMAIN")
						if customDomain != "" {
							url = fmt.Sprintf("%s/%s", strings.TrimSuffix(customDomain, "/"), relPath)
						} else {
							// Fallback to S3 endpoint with bucket name
							endpoint := strings.TrimSuffix(os.Getenv("S3_ENDPOINT"), "/")
							bucket := os.Getenv("S3_BUCKET")
							url = fmt.Sprintf("%s/%s/%s", endpoint, bucket, relPath)
						}
					}

					// Extract ID (filename without extension)
					id := strings.TrimSuffix(fileName, filepath.Ext(fileName))

					// Add image info to the result
					images = append(images, ImageInfo{
						ID:          id,
						FileName:    fileName,
						URL:         url,
						Orientation: orientVal,
						Format:      formatVal,
						Size:        fileInfo.Size(),
						Path:        relPath,
						StorageType: "local",
					})
				}
			}
		}
	}

	return images, nil
}

// listS3Images returns a list of images from S3 storage
func listS3Images(orientation, format string) ([]ImageInfo, error) {
	var images []ImageInfo
	var orientations []string
	var formats []string
	bucket := os.Getenv("S3_BUCKET")

	// Determine which orientations to list
	if orientation == "all" {
		orientations = []string{"landscape", "portrait"}
	} else {
		orientations = []string{orientation}
	}

	// Determine which formats to list
	if format == "all" {
		formats = []string{"original", "webp", "avif"}
	} else {
		formats = []string{format}
	}

	for _, orientVal := range orientations {
		for _, formatVal := range formats {
			var prefix string
			var extension string

			// Construct the prefix based on format
			if formatVal == "original" {
				prefix = "original/" + orientVal + "/"
				extension = ".jpg" // Assuming original images are JPG
			} else {
				prefix = orientVal + "/" + formatVal + "/"
				extension = "." + formatVal
			}

			// List objects with the prefix
			paginator := s3.NewListObjectsV2Paginator(utils.S3Client, &s3.ListObjectsV2Input{
				Bucket: aws.String(bucket),
				Prefix: aws.String(prefix),
			})

			// Process each page of results
			for paginator.HasMorePages() {
				output, err := paginator.NextPage(context.Background())
				if err != nil {
					return nil, err
				}

				// Process each object
				for _, obj := range output.Contents {
					key := *obj.Key
					fileName := filepath.Base(key)

					// Skip if not an image with the right extension
					if !strings.HasSuffix(strings.ToLower(fileName), extension) {
						continue
					}

					// Extract ID (filename without extension)
					id := strings.TrimSuffix(fileName, filepath.Ext(fileName))

					// Construct image URL using the getImageURL helper
					url := getImageURL(key)

					// Add image info to the result
					images = append(images, ImageInfo{
						ID:          id,
						FileName:    fileName,
						URL:         url,
						Orientation: orientVal,
						Format:      formatVal,
						Size:        *obj.Size,
						Path:        key,
						StorageType: "s3",
					})
				}
			}
		}
	}

	return images, nil
}
