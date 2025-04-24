package handlers

import (
	"context"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/Yuri-NagaSaki/ImageFlow/utils/errors"
	"github.com/Yuri-NagaSaki/ImageFlow/utils/logger"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

// Image format constants
const (
	FormatAVIF     = "avif"
	FormatWebP     = "webp"
	FormatOriginal = "original"
)

// detectBestFormat determines optimal image format based on Accept headers
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

// determineOrientation selects orientation based on device type and request parameters
func determineOrientation(r *http.Request, deviceType string) string {
	orientation := r.URL.Query().Get("orientation")
	if orientation == "" {
		if deviceType == utils.DeviceMobile {
			return "portrait"
		} else {
			return "landscape"
		}
	}
	return orientation
}

// getContentType returns the appropriate Content-Type based on format and filename
func getContentType(format string, filename string) string {
	if format == FormatAVIF {
		return "image/avif"
	}
	if format == FormatWebP {
		return "image/webp"
	}

	// Determine content type based on file extension
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		return "image/jpeg"
	}
}

// setImageResponseHeaders sets standard HTTP headers for image responses
func setImageResponseHeaders(w http.ResponseWriter, contentType string) {
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Vary", "Accept, User-Agent")
}

// getFormattedImagePath constructs the path to an image with the given format
func getFormattedImagePath(format string, orientation string, filename string) string {
	switch format {
	case FormatAVIF:
		return fmt.Sprintf("%s/avif/%s.avif", orientation, filename)
	case FormatWebP:
		return fmt.Sprintf("%s/webp/%s.webp", orientation, filename)
	default:
		// Keep original format and path
		// Determine extension by checking if filename already has one
		extension := filepath.Ext(filename)
		if extension == "" {
			extension = ".jpg" // Default to jpg if no extension
		}
		return fmt.Sprintf("original/%s/%s%s", orientation, filename, extension)
	}
}

// RandomImageHandler serves random images from S3 storage
func RandomImageHandler(s3Client *s3.Client, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !cfg.S3Enabled {
			errors.HandleError(w, errors.ErrInternal, "S3 storage is not enabled", nil)
			return
		}

		// Determine device type and orientation
		deviceType := utils.DetectDeviceType(r)
		orientation := determineOrientation(r, deviceType)

		// Get tag parameter for filtering
		tag := r.URL.Query().Get("tag")
		logger.Info("Processing random image request",
			zap.String("tag", tag),
			zap.String("orientation", orientation))

		// Declare variables used throughout the function
		var imageObjects []string
		var err error
		var useRedisResults bool = false

		// Filter by tag if specified
		if tag != "" && utils.RedisEnabled {
			// Use Redis to get all images with the specified tag
			imageIDs, redisErr := utils.GetImagesByTag(context.Background(), tag)
			if redisErr != nil {
				logger.Error("Failed to get images by tag from Redis",
					zap.String("tag", tag),
					zap.Error(redisErr))
				// Fall back to traditional filtering
			} else {
				logger.Info("Found images with tag from Redis",
					zap.String("tag", tag),
					zap.Int("count", len(imageIDs)))

				// Filter images by orientation
				for _, id := range imageIDs {
					metadata, metaErr := utils.MetadataManager.GetMetadata(context.Background(), id)
					if metaErr == nil && metadata != nil && metadata.Orientation == orientation {
						// Add the original image path to the list
						imageObjects = append(imageObjects, metadata.Paths.Original)
					}
				}

				logger.Debug("Filtered images by orientation",
					zap.String("orientation", orientation),
					zap.Int("count", len(imageObjects)))

				// If we found images with Redis, skip the traditional filtering
				if len(imageObjects) > 0 {
					useRedisResults = true
				}
			}
		}

		// If we didn't get results from Redis, use traditional filtering
		if !useRedisResults {
			// Build the prefix for original images directory
			prefix := fmt.Sprintf("original/%s/", orientation)

			// List objects in the directory
			output, err := s3Client.ListObjectsV2(context.Background(), &s3.ListObjectsV2Input{
				Bucket: aws.String(cfg.S3Bucket),
				Prefix: aws.String(prefix),
			})

			if err != nil {
				logger.Error("Failed to list objects from S3", zap.Error(err))
				errors.HandleError(w, errors.ErrInternal, "Failed to list images", err)
				return
			}

			// Filter image files
			for _, obj := range output.Contents {
				if utils.IsImageFile(*obj.Key) {
					// If tag filtering is requested, check metadata
					if tag != "" {
						// Extract ID from key
						fileBaseName := filepath.Base(*obj.Key)
						id := strings.TrimSuffix(fileBaseName, filepath.Ext(fileBaseName))

						// Get metadata to check tags
						metadata, err := utils.MetadataManager.GetMetadata(context.Background(), id)
						if err != nil || metadata == nil {
							// Skip if metadata not found or error
							continue
						}

						// Check if image has the requested tag
						hasTag := false
						for _, imgTag := range metadata.Tags {
							if imgTag == tag {
								hasTag = true
								break
							}
						}

						if !hasTag {
							// Skip if image doesn't have the tag
							continue
						}
					}

					imageObjects = append(imageObjects, *obj.Key)
				}
			}
		}

		if len(imageObjects) == 0 {
			errors.HandleError(w, errors.ErrNotFound, "No images found", nil)
			return
		}

		// Select a random image
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		randomIndex := rng.Intn(len(imageObjects))
		originalKey := imageObjects[randomIndex]
		logger.Debug("Selected random image", zap.String("key", originalKey))

		// Extract base filename without extension
		fileBaseName := filepath.Base(originalKey)
		filename := strings.TrimSuffix(fileBaseName, filepath.Ext(fileBaseName))

		// Determine best format for client
		bestFormat := detectBestFormat(r)

		// Preserve PNG format for transparency if original is PNG
		isPNG := strings.HasSuffix(strings.ToLower(originalKey), ".png")
		if isPNG && bestFormat == FormatOriginal {
			// Use original PNG
			imageKey := originalKey
			logger.Debug("Serving original PNG", zap.String("key", imageKey))

			// Get image from S3
			data, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
				Bucket: aws.String(cfg.S3Bucket),
				Key:    aws.String(imageKey),
			})

			if err != nil {
				logger.Error("Failed to get image from S3",
					zap.String("key", imageKey),
					zap.Error(err))
				errors.HandleError(w, errors.ErrNotFound, "Image not found", err)
				return
			}
			defer data.Body.Close()

			// Set response headers with PNG content type
			setImageResponseHeaders(w, "image/png")

			// Copy image data to response
			if _, err := io.Copy(w, data.Body); err != nil {
				logger.Error("Failed to send image", zap.Error(err))
				return
			}
			return
		}

		// Get image path
		imageKey := getFormattedImagePath(bestFormat, orientation, filename)
		logger.Debug("Serving image",
			zap.String("format", bestFormat),
			zap.String("path", imageKey))

		// Get image from S3
		data, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
			Bucket: aws.String(cfg.S3Bucket),
			Key:    aws.String(imageKey),
		})

		if err != nil {
			logger.Error("Failed to get image from S3",
				zap.String("key", imageKey),
				zap.Error(err))
			// Fall back to original format if specific format not available
			if bestFormat != FormatOriginal {
				logger.Info("Falling back to original image format")
				data, err = s3Client.GetObject(r.Context(), &s3.GetObjectInput{
					Bucket: aws.String(cfg.S3Bucket),
					Key:    aws.String(originalKey),
				})

				if err != nil {
					logger.Error("Failed to get original image", zap.Error(err))
					errors.HandleError(w, errors.ErrNotFound, "Image not found", err)
					return
				}

				// Use original format
				bestFormat = FormatOriginal
				imageKey = originalKey
			} else {
				errors.HandleError(w, errors.ErrNotFound, "Image not found", err)
				return
			}
		}
		defer data.Body.Close()

		// Set response headers
		contentType := getContentType(bestFormat, imageKey)
		setImageResponseHeaders(w, contentType)

		// Copy image data to response
		if _, err := io.Copy(w, data.Body); err != nil {
			logger.Error("Failed to send image", zap.Error(err))
			return
		}
	}
}

// LocalRandomImageHandler serves random images from local storage
func LocalRandomImageHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Determine device type
		deviceType := utils.DetectDeviceType(r)

		// Get tag parameter for filtering
		tag := r.URL.Query().Get("tag")
		logger.Info("Processing random image request",
			zap.String("tag", tag),
			zap.String("device_type", deviceType))

		// Determine orientation based on device type
		orientation := "landscape" // Default for desktop
		if deviceType == utils.DeviceMobile {
			orientation = "portrait" // Mobile gets portrait
		}

		logger.Debug("Using orientation based on device type",
			zap.String("orientation", orientation),
			zap.String("device_type", deviceType))

		// Find all images with the specified tag
		var matchingImages []*utils.ImageMetadata
		var err error

		if tag != "" {
			// When filtering by tag, get all images with that tag
			var imageIDs []string

			// Try to use Redis first if enabled
			if utils.RedisEnabled {
				redisIDs, redisErr := utils.GetImagesByTag(context.Background(), tag)
				if redisErr != nil {
					logger.Error("Failed to get images by tag from Redis",
						zap.String("tag", tag),
						zap.Error(redisErr))
					// Fall back to file-based lookup
				} else {
					logger.Info("Found images with tag from Redis",
						zap.String("tag", tag),
						zap.Int("count", len(redisIDs)))
					imageIDs = redisIDs
				}
			}

			// Fall back to file-based lookup if Redis is not enabled or failed
			if len(imageIDs) == 0 {
				fileIDs, fileErr := findImagesWithTagDebug(tag, string(cfg.StorageType), cfg.ImageBasePath)
				if fileErr != nil {
					logger.Error("Failed to find images with tag",
						zap.String("tag", tag),
						zap.Error(fileErr))
					errors.HandleError(w, errors.ErrInternal, "Failed to find images", fileErr)
					return
				}
				imageIDs = fileIDs
			}

			// Convert image IDs to metadata objects
			for _, id := range imageIDs {
				metadata, err := utils.MetadataManager.GetMetadata(context.Background(), id)
				if err == nil && metadata != nil {
					matchingImages = append(matchingImages, metadata)
				}
			}

			logger.Info("Found images with tag",
				zap.String("tag", tag),
				zap.Int("count", len(matchingImages)))

			if len(matchingImages) == 0 {
				logger.Warn("No images found with tag", zap.String("tag", tag))
				errors.HandleError(w, errors.ErrNotFound, "No images found", nil)
				return
			}

			// Filter by the determined orientation (based on device type)
			var filteredImages []*utils.ImageMetadata
			for _, img := range matchingImages {
				if img.Orientation == orientation {
					filteredImages = append(filteredImages, img)
				}
			}

			// Only use filtered images if we found any
			if len(filteredImages) > 0 {
				matchingImages = filteredImages
				logger.Debug("Filtered images by orientation",
					zap.String("orientation", orientation),
					zap.Int("count", len(matchingImages)))
			} else {
				logger.Warn("No images found matching criteria",
					zap.String("tag", tag),
					zap.String("orientation", orientation))
				errors.HandleError(w, errors.ErrNotFound, "No images found matching criteria", nil)
				return
			}
		} else {
			// Without tag filtering, use the standard approach

			// Read files from the orientation directory
			originalDir := filepath.Join(cfg.ImageBasePath, "original", orientation)
			logger.Debug("Looking for images in directory", zap.String("dir", originalDir))

			files, err := os.ReadDir(originalDir)
			if err != nil {
				logger.Error("Failed to read directory",
					zap.String("dir", originalDir),
					zap.Error(err))
				errors.HandleError(w, errors.ErrNotFound, "No images found", err)
				return
			}

			// Convert files to metadata objects
			for _, file := range files {
				if !file.IsDir() && utils.IsImageFile(file.Name()) {
					id := strings.TrimSuffix(file.Name(), filepath.Ext(file.Name()))
					matchingImages = append(matchingImages, &utils.ImageMetadata{
						ID:          id,
						Orientation: orientation,
						Paths: struct {
							Original string `json:"original"`
							WebP     string `json:"webp"`
							AVIF     string `json:"avif"`
						}{
							Original: filepath.Join("original", orientation, file.Name()),
						},
					})
				}
			}

			if len(matchingImages) == 0 {
				logger.Warn("No images found in directory", zap.String("dir", originalDir))
				errors.HandleError(w, errors.ErrNotFound, "No images found", nil)
				return
			}
		}

		// Select a random image from matching images
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		randomIndex := rng.Intn(len(matchingImages))
		selectedImage := matchingImages[randomIndex]
		logger.Debug("Selected random image",
			zap.String("id", selectedImage.ID),
			zap.String("orientation", selectedImage.Orientation))

		// Determine best format for client
		bestFormat := detectBestFormat(r)
		logger.Debug("Best format for client", zap.String("format", bestFormat))

		// Get the image path based on the format
		var imagePath string
		var contentType string

		// Check if the image is a PNG (for transparency)
		isPNG := false
		if selectedImage.Format == "png" {
			isPNG = true
		} else {
			// Try to detect from the original path
			isPNG = strings.HasSuffix(strings.ToLower(selectedImage.Paths.Original), ".png")
		}

		// For PNG images with transparency, use original format
		if isPNG && bestFormat == FormatOriginal {
			imagePath = filepath.Join(cfg.ImageBasePath, selectedImage.Paths.Original)
			contentType = "image/png"
			logger.Debug("Using original PNG for transparency", zap.String("path", imagePath))
		} else {
			// Use the appropriate format based on browser support
			switch bestFormat {
			case FormatAVIF:
				imagePath = filepath.Join(cfg.ImageBasePath, selectedImage.Orientation, "avif", selectedImage.ID+".avif")
				contentType = "image/avif"
			case FormatWebP:
				imagePath = filepath.Join(cfg.ImageBasePath, selectedImage.Orientation, "webp", selectedImage.ID+".webp")
				contentType = "image/webp"
			default:
				// Use original format
				imagePath = filepath.Join(cfg.ImageBasePath, selectedImage.Paths.Original)
				contentType = getContentType(FormatOriginal, imagePath)
			}
			logger.Debug("Using format and path",
				zap.String("format", bestFormat),
				zap.String("path", imagePath))

			// Check if file exists, fall back to original if needed
			if _, err := os.Stat(imagePath); os.IsNotExist(err) && bestFormat != FormatOriginal {
				logger.Info("Format not available, falling back to original",
					zap.String("format", bestFormat))
				imagePath = filepath.Join(cfg.ImageBasePath, selectedImage.Paths.Original)
				contentType = getContentType(FormatOriginal, imagePath)
			}
		}

		// Read and serve the image
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			logger.Error("Failed to read image",
				zap.String("path", imagePath),
				zap.Error(err))
			errors.HandleError(w, errors.ErrNotFound, "Image not found", err)
			return
		}

		// Set response headers
		setImageResponseHeaders(w, contentType)

		// Send image data
		if _, err := w.Write(imageData); err != nil {
			logger.Error("Failed to send image", zap.Error(err))
			return
		}
	}
}
