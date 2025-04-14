package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
)

// DebugTagsResponse represents the response for the debug tags API
type DebugTagsResponse struct {
	Tag    string   `json:"tag"`
	Images []string `json:"images"`
}

// DebugTagsHandler returns a handler for debugging tag issues
func DebugTagsHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get storage type from environment
		storageType := os.Getenv("STORAGE_TYPE")

		// Validate API key
		if !validateAPIKey(w, r, cfg.APIKey) {
			return
		}

		// Get tag parameter
		tag := r.URL.Query().Get("tag")
		if tag == "" {
			http.Error(w, "Tag parameter is required", http.StatusBadRequest)
			return
		}

		// Find all images with the specified tag
		images, err := findImagesWithTagDebug(tag, storageType, cfg.ImageBasePath)
		if err != nil {
			log.Printf("Error finding images with tag %s: %v", tag, err)
			http.Error(w, "Failed to find images", http.StatusInternalServerError)
			return
		}

		// Return JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(DebugTagsResponse{
			Tag:    tag,
			Images: images,
		})
	}
}

// findImagesWithTagDebug finds all images with the specified tag
func findImagesWithTagDebug(tag, storageType, basePath string) ([]string, error) {
	// Check if Redis is enabled
	if utils.RedisEnabled {
		// Use Redis to get all images with the specified tag
		imageIDs, err := utils.GetImagesByTag(context.Background(), tag)
		if err != nil {
			log.Printf("Error getting images by tag from Redis: %v", err)
			// Fall back to file-based storage
		} else {
			log.Printf("Found %d images with tag %s from Redis", len(imageIDs), tag)

			// Log detailed metadata for debugging
			for _, id := range imageIDs {
				metadata, err := utils.MetadataManager.GetMetadata(context.Background(), id)
				if err == nil && metadata != nil {
					log.Printf("Image metadata from Redis: ID=%s, Tags=%v, Orientation=%s",
						metadata.ID, metadata.Tags, metadata.Orientation)
				}
			}

			return imageIDs, nil
		}
	}

	// Fall back to file-based storage
	var images []string

	if storageType == "s3" {
		// For S3 storage, we need to implement S3-specific logic
		s3Storage, ok := utils.Storage.(*utils.S3Storage)
		if !ok {
			return nil, fmt.Errorf("failed to get S3 storage instance")
		}

		// List all metadata objects
		metadataPrefix := "metadata/"
		objects, err := s3Storage.ListObjects(context.Background(), metadataPrefix)
		if err != nil {
			return nil, err
		}

		// Process each metadata file
		for _, obj := range objects {
			// Skip if not a JSON file
			if filepath.Ext(obj.Key) != ".json" {
				continue
			}

			// Extract ID from key
			id := filepath.Base(obj.Key)
			id = id[:len(id)-5] // Remove .json extension

			// Get metadata
			metadata, err := utils.MetadataManager.GetMetadata(context.Background(), id)
			if err != nil {
				log.Printf("Error reading metadata for %s: %v", id, err)
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

			if hasTag {
				// Add image ID to the result
				images = append(images, id)
				log.Printf("Found image %s with tag %s", id, tag)

				// Log detailed metadata for debugging
				log.Printf("Image metadata: ID=%s, Tags=%v, Orientation=%s",
					metadata.ID, metadata.Tags, metadata.Orientation)
			}
		}
	} else {
		// For local storage, we can read metadata files from the metadata directory
		metadataDir := filepath.Join(basePath, "metadata")

		// Read all files in the metadata directory
		files, err := os.ReadDir(metadataDir)
		if err != nil {
			return nil, err
		}

		// Process each metadata file
		for _, file := range files {
			if file.IsDir() || filepath.Ext(file.Name()) != ".json" {
				continue
			}

			// Extract ID from filename
			id := filepath.Base(file.Name())
			id = id[:len(id)-5] // Remove .json extension

			// Get metadata
			metadata, err := utils.MetadataManager.GetMetadata(context.Background(), id)
			if err != nil {
				log.Printf("Error reading metadata for %s: %v", id, err)
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

			if hasTag {
				// Add image ID to the result
				images = append(images, id)
				log.Printf("Found image %s with tag %s", id, tag)

				// Log detailed metadata for debugging
				log.Printf("Image metadata: ID=%s, Tags=%v, Orientation=%s",
					metadata.ID, metadata.Tags, metadata.Orientation)
			}
		}
	}

	return images, nil
}
