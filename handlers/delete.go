package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// DeleteRequest represents the request body for deleting an image
type DeleteRequest struct {
	ID string `json:"id"` // Image ID (filename without extension)
}

// DeleteResponse represents the response after deleting an image
type DeleteResponse struct {
	Success bool   `json:"success"` // Whether the operation was successful
	Message string `json:"message"` // Description of the result
}

// DeleteImageHandler returns a handler for deleting images
func DeleteImageHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only accept POST method
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body
		var req DeleteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if ID is provided
		if req.ID == "" {
			http.Error(w, "Image ID is required", http.StatusBadRequest)
			return
		}

		var success bool
		var message string

		// Delete based on storage type
		if cfg.StorageType == config.StorageTypeS3 {
			success, message = deleteS3Images(req.ID, cfg)
		} else {
			success, message = deleteLocalImages(req.ID, cfg.ImageBasePath)
		}

		// If deletion was successful, clean up Redis data
		if success && utils.RedisEnabled {
			// Create Redis metadata store
			redisStore := utils.NewRedisMetadataStore()

			// Delete metadata from Redis
			if err := redisStore.DeleteMetadata(r.Context(), req.ID); err != nil {
				log.Printf("Warning: Failed to delete Redis metadata for %s: %v", req.ID, err)
			}

			// Remove from images sorted set
			if err := utils.RedisClient.ZRem(r.Context(), utils.RedisPrefix+"images", req.ID).Err(); err != nil {
				log.Printf("Warning: Failed to remove from images set: %v", err)
			}

			// Clear page cache
			if err := utils.ClearPageCache(r.Context()); err != nil {
				log.Printf("Warning: Failed to clear page cache: %v", err)
			}
		}

		// Prepare and send response
		resp := DeleteResponse{
			Success: success,
			Message: message,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// deleteLocalImages deletes all formats of an image from local storage
func deleteLocalImages(id string, basePath string) (bool, string) {
	// Formats and orientations to check for image files
	formats := []string{"original", "webp", "avif"}
	orientations := []string{"landscape", "portrait"}

	deletedCount := 0
	errorCount := 0
	var lastError error

	// Find all matching image files and delete them
	for _, format := range formats {
		for _, orientation := range orientations {
			var path string
			if format == "original" {
				path = filepath.Join(basePath, format, orientation)
			} else {
				path = filepath.Join(basePath, orientation, format)
			}

			// Find matching files with glob pattern
			// This will match any extension (jpg, png, etc)
			files, err := filepath.Glob(filepath.Join(path, id+".*"))
			if err != nil {
				log.Printf("Error finding files for %s in %s: %v", id, path, err)
				errorCount++
				lastError = err
				continue
			}

			// Delete each found file
			for _, file := range files {
				err := os.Remove(file)
				if err != nil {
					log.Printf("Error deleting file %s: %v", file, err)
					errorCount++
					lastError = err
				} else {
					log.Printf("Successfully deleted file: %s", file)
					deletedCount++
				}
			}
		}
	}

	// Check for GIF files (stored in a separate gif directory without orientation classification)
	gifPath := filepath.Join(basePath, "gif")
	gifFiles, err := filepath.Glob(filepath.Join(gifPath, id+".*"))
	if err != nil {
		log.Printf("Error finding GIF files for %s in %s: %v", id, gifPath, err)
		errorCount++
		lastError = err
	} else {
		// Delete each GIF file found
		for _, file := range gifFiles {
			err := os.Remove(file)
			if err != nil {
				log.Printf("Error deleting GIF file %s: %v", file, err)
				errorCount++
				lastError = err
			} else {
				log.Printf("Successfully deleted GIF file: %s", file)
				deletedCount++
			}
		}
	}

	// Determine operation result
	if errorCount > 0 {
		return false, fmt.Sprintf("Partial deletion failure: %d files deleted successfully, %d failed: %v",
			deletedCount, errorCount, lastError)
	}

	if deletedCount == 0 {
		return false, "No matching image files found"
	}

	return true, fmt.Sprintf("成功删除 %d 张图片", deletedCount)
}

// deleteS3Images deletes all formats of an image from S3 storage
func deleteS3Images(id string, cfg *config.Config) (bool, string) {
	// Check if S3 is properly configured
	if !cfg.S3Enabled {
		return false, "S3 storage is not enabled"
	}

	if cfg.S3Bucket == "" {
		return false, "S3 bucket not configured"
	}

	// Check if S3 client is initialized
	if utils.S3Client == nil {
		return false, "S3 client not initialized"
	}

	// Formats and orientations to check
	formats := []string{"original", "webp", "avif"}
	orientations := []string{"landscape", "portrait"}

	// Build list of objects to delete
	var objectsToDelete []types.ObjectIdentifier
	var deletedPathsForLogging []string

	// Create context
	ctx := context.Background()

	// Find matching objects
	for _, format := range formats {
		for _, orientation := range orientations {
			var prefix string
			if format == "original" {
				prefix = fmt.Sprintf("%s/%s/%s", format, orientation, id)
			} else {
				prefix = fmt.Sprintf("%s/%s/%s", orientation, format, id)
			}

			// List objects matching prefix
			paginator := s3.NewListObjectsV2Paginator(utils.S3Client, &s3.ListObjectsV2Input{
				Bucket: aws.String(cfg.S3Bucket),
				Prefix: aws.String(prefix),
			})

			for paginator.HasMorePages() {
				output, err := paginator.NextPage(ctx)
				if err != nil {
					log.Printf("Error listing S3 objects with prefix %s: %v", prefix, err)
					continue
				}

				for _, obj := range output.Contents {
					key := *obj.Key
					// Check if filename starts with ID
					baseName := filepath.Base(key)
					if strings.HasPrefix(baseName, id+".") {
						objectsToDelete = append(objectsToDelete, types.ObjectIdentifier{
							Key: aws.String(key),
						})
						deletedPathsForLogging = append(deletedPathsForLogging, key)
					}
				}
			}
		}
	}

	// Check for GIF files
	gifPrefix := fmt.Sprintf("gif/%s", id)

	// List GIF objects matching prefix
	gifPaginator := s3.NewListObjectsV2Paginator(utils.S3Client, &s3.ListObjectsV2Input{
		Bucket: aws.String(cfg.S3Bucket),
		Prefix: aws.String(gifPrefix),
	})

	for gifPaginator.HasMorePages() {
		output, err := gifPaginator.NextPage(ctx)
		if err != nil {
			log.Printf("Error listing S3 GIF objects with prefix %s: %v", gifPrefix, err)
			continue
		}

		for _, obj := range output.Contents {
			key := *obj.Key
			// Check if filename starts with ID
			baseName := filepath.Base(key)
			if strings.HasPrefix(baseName, id+".") {
				objectsToDelete = append(objectsToDelete, types.ObjectIdentifier{
					Key: aws.String(key),
				})
				deletedPathsForLogging = append(deletedPathsForLogging, key)
			}
		}
	}

	// If no matching objects found
	if len(objectsToDelete) == 0 {
		return false, "No matching image files found"
	}

	// Delete objects in batch
	_, err := utils.S3Client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(cfg.S3Bucket),
		Delete: &types.Delete{
			Objects: objectsToDelete,
			Quiet:   aws.Bool(false),
		},
	})

	if err != nil {
		log.Printf("Error deleting S3 objects: %v", err)
		return false, fmt.Sprintf("Deletion failed: %v", err)
	}

	// Log deleted files
	for _, path := range deletedPathsForLogging {
		log.Printf("Successfully deleted file from S3: %s", path)
	}

	return true, fmt.Sprintf("成功删除 %d 张图片", len(objectsToDelete))
}
