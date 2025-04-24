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
	"sync"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/redis/go-redis/v9"
)

var (
	debugMode = (os.Getenv("DEBUG_MODE") == "true")
	// baseURLs caches the base URLs for different storage types
	baseURLs = make(map[string]string)
)

func init() {
	// Initialize base URLs
	storageType := os.Getenv("STORAGE_TYPE")
	if storageType == "s3" {
		customDomain := os.Getenv("CUSTOM_DOMAIN")
		if customDomain != "" {
			baseURLs["s3"] = strings.TrimSuffix(customDomain, "/")
		} else {
			endpoint := strings.TrimSuffix(os.Getenv("S3_ENDPOINT"), "/")
			bucket := os.Getenv("S3_BUCKET")
			baseURLs["s3"] = fmt.Sprintf("%s/%s", endpoint, bucket)
		}
	} else {
		baseURLs["local"] = "/images"
	}
}

func DebugLog(format string, args ...interface{}) {
	if debugMode {
		log.Printf("[DEBUG] "+format, args...)
	}
}

// ImageInfo represents information about an image
type ImageInfo = utils.ImageInfo

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
		startTime := time.Now()
		var cacheHit bool
		defer func() {
			if debugMode {
				duration := time.Since(startTime)
				log.Printf("[DEBUG] List API latency: %v, cache hit: %v", duration, cacheHit)
			}
		}()

		// Validate API key
		if !validateAPIKey(w, r, cfg.APIKey) {
			return
		}

		// Parse query parameters
		params := parseQueryParams(r)

		var allImages []ImageInfo

		// Check if Redis is enabled
		if !utils.RedisEnabled {
			http.Error(w, "Redis is required for metadata storage", http.StatusInternalServerError)
			return
		}

		// Try to get from cache first
		cacheKey := utils.CachedPageKey{
			Orientation: params.orientation,
			Format:      params.format,
			Tag:         params.tag,
			Page:        params.page,
			Limit:       params.limit,
		}

		if cache, err := utils.GetCachedPage(r.Context(), cacheKey); err == nil {
			cacheHit = true
			allImages = cache.Data
		} else {
			// Cache miss, get from Redis
			var err error
			allImages, err = listImagesFromRedis(r.Context(), params)
			if err != nil {
				log.Printf("Error listing images from Redis: %v", err)
				http.Error(w, "获取图片列表失败", http.StatusInternalServerError)
				return
			}

			// Cache the results
			if err := utils.SetCachedPage(r.Context(), cacheKey, allImages); err != nil {
				if debugMode {
					log.Printf("[DEBUG] Failed to cache page results: %v", err)
				}
			}
		}

		// Calculate pagination values
		total := len(allImages)
		totalPages := int(math.Ceil(float64(total) / float64(params.limit)))

		// Ensure page is within valid range
		if params.page > totalPages && totalPages > 0 {
			params.page = totalPages
		}

		// Calculate start and end indices for the current page
		startIdx := (params.page - 1) * params.limit
		endIdx := startIdx + params.limit
		if endIdx > total {
			endIdx = total
		}

		// Extract the subset of images for the current page
		var pagedImages []ImageInfo
		if startIdx < total {
			pagedImages = allImages[startIdx:endIdx]
		} else {
			pagedImages = []ImageInfo{}
		}

		// Send response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		response := PaginatedResponse{
			Success:    true,
			Images:     pagedImages,
			Page:       params.page,
			Limit:      params.limit,
			TotalPages: totalPages,
			Total:      total,
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			if debugMode {
				log.Printf("[DEBUG] Error encoding JSON response: %v", err)
			}
		}
	}
}

// Query parameters structure
type queryParams struct {
	orientation string
	format      string
	tag         string // Tag to filter by
	page        int
	limit       int
}

// validateAPIKey checks if the provided API key is valid
func validateAPIKey(w http.ResponseWriter, r *http.Request, configAPIKey string) bool {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "未提供授权信息", http.StatusUnauthorized)
		return false
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		http.Error(w, "授权格式无效", http.StatusUnauthorized)
		return false
	}

	apiKey := parts[1]
	if apiKey != configAPIKey {
		http.Error(w, "API密钥无效", http.StatusUnauthorized)
		return false
	}

	return true
}

// parseQueryParams extracts and validates query parameters
func parseQueryParams(r *http.Request) queryParams {
	orientation := r.URL.Query().Get("orientation")
	format := r.URL.Query().Get("format")
	tag := r.URL.Query().Get("tag")
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	// Default values
	if orientation == "" {
		orientation = "all" // all, landscape, portrait
	}
	if format == "" {
		format = "original" // original, webp, avif
	}
	// Tag can be empty, which means no tag filtering

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

	return queryParams{
		orientation: orientation,
		format:      format,
		tag:         tag,
		page:        page,
		limit:       limit,
	}
}

// constructImageURL creates the appropriate URL for image access
func constructImageURL(relPath string) string {
	storageType := os.Getenv("STORAGE_TYPE")
	var baseURL string

	if storageType == "s3" {
		customDomain := os.Getenv("CUSTOM_DOMAIN")
		if customDomain != "" {
			baseURL = strings.TrimSuffix(customDomain, "/")
		} else {
			endpoint := strings.TrimSuffix(os.Getenv("S3_ENDPOINT"), "/")
			bucket := os.Getenv("S3_BUCKET")
			baseURL = fmt.Sprintf("%s/%s", endpoint, bucket)
		}
	} else {
		baseURL = "/images"
	}

	return fmt.Sprintf("%s/%s", baseURL, strings.ReplaceAll(relPath, "\\", "/"))
}

// listImagesFromRedis retrieves images from Redis with optimized queries
func listImagesFromRedis(ctx context.Context, params queryParams) ([]ImageInfo, error) {
	if !utils.RedisEnabled {
		return nil, fmt.Errorf("redis is not enabled")
	}

	// Get image IDs based on criteria
	var imageIDs []string
	var err error

	// Use pipeline for tag and ID retrieval
	pipe := utils.RedisClient.Pipeline()
	var tagCmd *redis.StringSliceCmd
	var idsCmd *redis.StringSliceCmd

	if params.tag != "" {
		// Get images by tag
		tagCmd = pipe.SMembers(ctx, utils.RedisPrefix+"tag:"+params.tag)
	} else {
		// Get all image IDs from sorted set
		idsCmd = pipe.ZRevRange(ctx, utils.RedisPrefix+"images", 0, -1)
	}

	_, err = pipe.Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get image IDs: %v", err)
	}

	// Get results from commands
	if params.tag != "" {
		imageIDs = tagCmd.Val()
	} else {
		imageIDs = idsCmd.Val()
	}

	if len(imageIDs) == 0 {
		return []ImageInfo{}, nil
	}

	// Pre-allocate slice with capacity
	images := make([]ImageInfo, 0, len(imageIDs))

	// Use pipeline to get metadata for all images
	pipe = utils.RedisClient.Pipeline()
	metadataCommands := make(map[string]*redis.MapStringStringCmd, len(imageIDs))

	for _, id := range imageIDs {
		metadataCommands[id] = pipe.HGetAll(ctx, utils.RedisPrefix+"metadata:"+id)
	}

	_, err = pipe.Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata: %v", err)
	}

	// URL builder function with caching
	urlBuilder := newURLBuilder()

	// Process results
	for _, id := range imageIDs {
		data, err := metadataCommands[id].Result()
		if err != nil || len(data) == 0 {
			continue
		}

		// Filter by orientation if specified
		if params.orientation != "all" && data["orientation"] != params.orientation {
			continue
		}

		// Parse paths from JSON
		var paths struct {
			Original string `json:"original"`
			WebP     string `json:"webp"`
			AVIF     string `json:"avif"`
		}
		if pathsStr := data["paths"]; pathsStr != "" {
			if err := json.Unmarshal([]byte(pathsStr), &paths); err != nil {
				log.Printf("Warning: Failed to unmarshal paths for image %s: %v", id, err)
			}
		}

		// Create image info
		imageInfo := ImageInfo{
			ID:          id,
			FileName:    data["originalName"],
			Orientation: data["orientation"],
			Format:      data["format"],
			StorageType: os.Getenv("STORAGE_TYPE"),
			URLs:        make(map[string]string, 3), // Pre-allocate with capacity
		}

		// Parse tags
		if tags := data["tags"]; tags != "" {
			imageInfo.Tags = strings.Split(tags, ",")
		}

		// Construct URLs based on paths
		isGIF := data["format"] == "gif"

		if isGIF {
			gifPath := filepath.Join("gif", id+".gif")
			gifURL := urlBuilder.getURL(gifPath)
			imageInfo.URLs["original"] = gifURL
			imageInfo.URLs["webp"] = gifURL
			imageInfo.URLs["avif"] = gifURL
		} else {
			// Use stored paths if available
			if paths.Original != "" {
				imageInfo.URLs["original"] = urlBuilder.getURL(paths.Original)
			} else {
				imageInfo.URLs["original"] = urlBuilder.getURL(filepath.Join("original", data["orientation"], id+"."+data["format"]))
			}

			if paths.WebP != "" {
				imageInfo.URLs["webp"] = urlBuilder.getURL(paths.WebP)
			} else {
				imageInfo.URLs["webp"] = urlBuilder.getURL(filepath.Join(data["orientation"], "webp", id+".webp"))
			}

			if paths.AVIF != "" {
				imageInfo.URLs["avif"] = urlBuilder.getURL(paths.AVIF)
			} else {
				imageInfo.URLs["avif"] = urlBuilder.getURL(filepath.Join(data["orientation"], "avif", id+".avif"))
			}
		}

		// Set the requested format URL
		imageInfo.URL = imageInfo.URLs[params.format]

		// Update filename based on format
		if params.format != "original" {
			baseName := strings.TrimSuffix(imageInfo.FileName, filepath.Ext(imageInfo.FileName))
			imageInfo.FileName = baseName + "." + params.format
		}

		images = append(images, imageInfo)
	}

	// Sort by filename in descending order
	sort.Slice(images, func(i, j int) bool {
		return images[i].FileName > images[j].FileName
	})

	return images, nil
}

// URLBuilder caches constructed URLs
type URLBuilder struct {
	cache map[string]string
	mu    sync.RWMutex
}

// newURLBuilder creates a new URL builder with caching
func newURLBuilder() *URLBuilder {
	return &URLBuilder{
		cache: make(map[string]string),
	}
}

// getURL returns a cached URL or constructs and caches a new one
func (b *URLBuilder) getURL(relPath string) string {
	// Try to get from cache first
	b.mu.RLock()
	if url, ok := b.cache[relPath]; ok {
		b.mu.RUnlock()
		return url
	}
	b.mu.RUnlock()

	// Construct new URL
	url := constructImageURL(relPath)

	// Cache the result
	b.mu.Lock()
	b.cache[relPath] = url
	b.mu.Unlock()

	return url
}
