package handlers

import (
	"encoding/json"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"log"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
)

// UploadResult represents the result of an image upload
type UploadResult struct {
	Filename    string            `json:"filename"`
	Status      string            `json:"status"`
	Message     string            `json:"message"`
	Orientation string            `json:"orientation,omitempty"`
	Format      string            `json:"format,omitempty"`
	URLs        map[string]string `json:"urls,omitempty"`
	ExpiryTime  string            `json:"expiryTime,omitempty"`
	Tags        []string          `json:"tags,omitempty"`
}

// getPublicURL constructs a public-facing URL for accessing an image
func getPublicURL(key string, cfg *config.Config) string {
	if cfg.StorageType == config.StorageTypeLocal {
		return fmt.Sprintf("/images/%s", key)
	}
	// For S3 storage
	if cfg.CustomDomain != "" {
		return fmt.Sprintf("%s/%s", strings.TrimSuffix(cfg.CustomDomain, "/"), key)
	}
	// Fallback to S3 endpoint with bucket name
	endpoint := strings.TrimSuffix(cfg.S3Endpoint, "/")
	return fmt.Sprintf("%s/%s/%s", endpoint, cfg.S3Bucket, key)
}

// determineImageOrientation classifies an image as landscape or portrait
// Square images and portrait images are classified as portrait
func determineImageOrientation(img image.Config) string {
	if img.Width > img.Height {
		return "landscape"
	}
	return "portrait"
}

// processImage handles the processing of a single image file
func processImage(ctx *uploadContext, fileHeader *multipart.FileHeader) UploadResult {
	file, err := fileHeader.Open()
	if err != nil {
		return UploadResult{
			Filename: fileHeader.Filename,
			Status:   "error",
			Message:  fmt.Sprintf("Error opening file: %v", err),
		}
	}
	defer file.Close()

	// Read image configuration to determine orientation
	img, _, err := image.DecodeConfig(file)
	if err != nil {
		return UploadResult{
			Filename: fileHeader.Filename,
			Status:   "error",
			Message:  fmt.Sprintf("Error reading image configuration: %v", err),
		}
	}
	orientation := determineImageOrientation(img)

	// Reset file pointer
	if _, err := file.Seek(0, 0); err != nil {
		return UploadResult{
			Filename: fileHeader.Filename,
			Status:   "error",
			Message:  fmt.Sprintf("Error resetting file pointer: %v", err),
		}
	}

	// Read file content
	data := make([]byte, fileHeader.Size)
	if _, err := file.Read(data); err != nil {
		return UploadResult{
			Filename: fileHeader.Filename,
			Status:   "error",
			Message:  fmt.Sprintf("Error reading file: %v", err),
		}
	}

	// Generate unique filename
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%d", timestamp, time.Now().UnixNano()%10000)
	imageID := filename

	// Detect image format
	imgFormat, err := utils.DetectImageFormat(data)
	if err != nil {
		return UploadResult{
			Filename: fileHeader.Filename,
			Status:   "error",
			Message:  fmt.Sprintf("Error detecting image format: %v", err),
		}
	}

	var originalKey string
	if imgFormat.Format == "gif" {
		originalKey = filepath.Join("gif", filename+imgFormat.Extension)
	} else {
		originalKey = filepath.Join("original", orientation, filename+imgFormat.Extension)
	}

	if err := utils.Storage.Store(ctx.r.Context(), originalKey, data); err != nil {
		return UploadResult{
			Filename: fileHeader.Filename,
			Status:   "error",
			Message:  fmt.Sprintf("Error storing original file: %v", err),
		}
	}
	log.Printf("Original image stored: %s", originalKey)

	var webpURL, avifURL string
	var wg sync.WaitGroup

	if imgFormat.Format != "gif" {
		// WebP conversion - simply call the function which now uses worker pool internally
		wg.Add(1)
		go func() {
			defer wg.Done()
			if webpData, err := utils.ConvertToWebPWithBimg(data, ctx.cfg); err == nil {
				webpKey := filepath.Join(orientation, "webp", filename+".webp")
				if err := utils.Storage.Store(ctx.r.Context(), webpKey, webpData); err == nil {
					webpURL = getPublicURL(webpKey, ctx.cfg)
				}
			}
		}()

		// AVIF conversion - simply call the function which now uses worker pool internally
		wg.Add(1)
		go func() {
			defer wg.Done()
			if avifData, err := utils.ConvertToAVIFWithBimg(data, ctx.cfg); err == nil {
				avifKey := filepath.Join(orientation, "avif", filename+".avif")
				if err := utils.Storage.Store(ctx.r.Context(), avifKey, avifData); err == nil {
					avifURL = getPublicURL(avifKey, ctx.cfg)
				}
			}
		}()

		wg.Wait()
	}

	// Get URL for original image
	originalURL := getPublicURL(originalKey, ctx.cfg)

	// Set WebP and AVIF URLs with defaults if conversion failed
	if webpURL == "" {
		webpURL = originalURL
	}
	if avifURL == "" {
		avifURL = originalURL
	}

	var expiryTimeStr string
	if !ctx.expiryTime.IsZero() {
		expiryTimeStr = ctx.expiryTime.Format(time.RFC3339)
	}

	metadata := &utils.ImageMetadata{
		ID:           imageID,
		OriginalName: fileHeader.Filename,
		UploadTime:   time.Now(),
		Format:       imgFormat.Format,
		Orientation:  orientation,
		Tags:         ctx.tags,
	}

	if !ctx.expiryTime.IsZero() {
		metadata.ExpiryTime = ctx.expiryTime
	}

	metadata.Paths.Original = originalKey
	if webpURL != originalURL {
		metadata.Paths.WebP = filepath.Join(orientation, "webp", imageID+".webp")
	}
	if avifURL != originalURL {
		metadata.Paths.AVIF = filepath.Join(orientation, "avif", imageID+".avif")
	}

	if err := utils.MetadataManager.SaveMetadata(ctx.r.Context(), metadata); err != nil {
		log.Printf("Warning: Failed to save metadata for image %s: %v", imageID, err)
	}

	return UploadResult{
		Filename:    fileHeader.Filename,
		Status:      "success",
		Message:     "File uploaded and converted successfully",
		Orientation: orientation,
		Format:      imgFormat.Format,
		ExpiryTime:  expiryTimeStr,
		Tags:        ctx.tags,
		URLs: map[string]string{
			"original": originalURL,
			"webp":     webpURL,
			"avif":     avifURL,
		},
	}
}

type uploadContext struct {
	r          *http.Request
	expiryTime time.Time
	tags       []string
	cfg        *config.Config
}

// UploadHandler handles image uploads, converting them to multiple formats
func UploadHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse multipart form with default max upload size (32MB)
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			http.Error(w, "Error parsing form", http.StatusBadRequest)
			return
		}

		// Get uploaded files
		files := r.MultipartForm.File["images[]"]
		if len(files) == 0 {
			http.Error(w, "No files uploaded", http.StatusBadRequest)
			return
		}

		// Check if number of uploaded files exceeds the maximum limit
		if len(files) > cfg.MaxUploadCount {
			http.Error(w, fmt.Sprintf("Too many files uploaded. Maximum allowed is %d files", cfg.MaxUploadCount), http.StatusBadRequest)
			return
		}

		// Get expiry time parameter (in minutes)
		expiryMinutes := 0 // Default: never expire
		if expiryParam := r.FormValue("expiryMinutes"); expiryParam != "" {
			if minutes, err := strconv.Atoi(expiryParam); err == nil && minutes >= 0 {
				expiryMinutes = minutes
			} else {
				log.Printf("Invalid expiryMinutes parameter: %s, using default: %d", expiryParam, expiryMinutes)
			}
		}

		// Calculate expiry time
		var expiryTime time.Time
		if expiryMinutes > 0 {
			expiryTime = time.Now().Add(time.Duration(expiryMinutes) * time.Minute)
			log.Printf("Images will expire at: %v", expiryTime)
		}

		// Get tags parameter
		var tags []string
		if tagsParam := r.FormValue("tags"); tagsParam != "" {
			// Split by comma and trim spaces
			for _, tag := range strings.Split(tagsParam, ",") {
				trimmedTag := strings.TrimSpace(tag)
				if trimmedTag != "" {
					tags = append(tags, trimmedTag)
				}
			}
			log.Printf("Image tags: %v", tags)
		}

		ctx := &uploadContext{
			r:          r,
			expiryTime: expiryTime,
			tags:       tags,
			cfg:        cfg,
		}

		// Process images concurrently - using a semaphore to limit concurrency at upload level
		// Each image will use the worker pool internally for conversion tasks
		resultsChan := make(chan UploadResult, len(files))
		var wg sync.WaitGroup

		for _, fileHeader := range files {
			wg.Add(1)
			go func(fh *multipart.FileHeader) {
				defer wg.Done()
				result := processImage(ctx, fh)
				resultsChan <- result
			}(fileHeader)
		}

		// Start a goroutine to close results channel after all processing is done
		go func() {
			wg.Wait()
			close(resultsChan)
		}()

		// Collect and send results as they come in
		results := make([]UploadResult, 0, len(files))
		for result := range resultsChan {
			results = append(results, result)
			// Optionally flush partial results to client here if needed
		}

		// Return JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"results": results,
		})
	}
}
