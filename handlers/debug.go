package handlers

import (
	"context"
	"encoding/json"
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
	var images []string

	if storageType == "s3" {
		// For S3 storage, we need to implement S3-specific logic
		// This is a placeholder for now
		return images, nil
	}

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

	return images, nil
}
