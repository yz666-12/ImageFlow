package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"sync"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
)

// TagsResponse represents the response for the tags API
type TagsResponse struct {
	Tags []string `json:"tags"`
}

// TagsHandler returns a handler for retrieving all unique tags
func TagsHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get storage type from environment
		storageType := os.Getenv("STORAGE_TYPE")

		// Validate API key
		if !validateAPIKey(w, r, cfg.APIKey) {
			return
		}

		// Get all unique tags
		tags, err := getAllUniqueTags(storageType, cfg.ImageBasePath)
		if err != nil {
			log.Printf("Error retrieving tags: %v", err)
			http.Error(w, "Failed to retrieve tags", http.StatusInternalServerError)
			return
		}

		// Return JSON response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(TagsResponse{
			Tags: tags,
		})
	}
}

// getAllUniqueTags retrieves all unique tags from image metadata
func getAllUniqueTags(storageType, basePath string) ([]string, error) {
	// Check if Redis is enabled
	if utils.RedisEnabled {
		// Use Redis to get all unique tags
		return utils.GetAllUniqueTags(context.Background())
	}

	// Fall back to file-based storage
	// Use a map to store unique tags
	uniqueTags := make(map[string]struct{})
	var mu sync.Mutex

	if storageType == "s3" {
		// For S3 storage, we need to list all metadata files
		// and extract tags from each one
		return getS3UniqueTags(uniqueTags, &mu)
	} else {
		// For local storage, we can read metadata files from the metadata directory
		return getLocalUniqueTags(basePath, uniqueTags, &mu)
	}
}

// getLocalUniqueTags retrieves unique tags from local metadata files
func getLocalUniqueTags(basePath string, uniqueTags map[string]struct{}, mu *sync.Mutex) ([]string, error) {
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
		if err != nil || metadata == nil {
			continue
		}

		// Add tags to the unique tags map
		mu.Lock()
		for _, tag := range metadata.Tags {
			uniqueTags[tag] = struct{}{}
		}
		mu.Unlock()
	}

	// Convert map keys to slice
	return mapKeysToSortedSlice(uniqueTags), nil
}

// getS3UniqueTags retrieves unique tags from S3 metadata
func getS3UniqueTags(uniqueTags map[string]struct{}, mu *sync.Mutex) ([]string, error) {
	// Get all metadata from S3
	// This is a simplified approach - in a real implementation,
	// you might want to paginate through results for large datasets

	// List all metadata objects
	s3Storage, ok := utils.Storage.(*utils.S3Storage)
	if !ok {
		return nil, nil
	}

	// Get all metadata files
	metadataPrefix := "metadata/"
	objects, err := s3Storage.ListObjects(context.Background(), metadataPrefix)
	if err != nil {
		return nil, err
	}

	// Process each metadata file
	for _, obj := range objects {
		// Extract ID from key
		key := obj.Key
		if filepath.Ext(key) != ".json" {
			continue
		}

		// Extract ID from key
		id := filepath.Base(key)
		id = id[:len(id)-5] // Remove .json extension

		// Get metadata
		metadata, err := utils.MetadataManager.GetMetadata(context.Background(), id)
		if err != nil || metadata == nil {
			continue
		}

		// Add tags to the unique tags map
		mu.Lock()
		for _, tag := range metadata.Tags {
			uniqueTags[tag] = struct{}{}
		}
		mu.Unlock()
	}

	// Convert map keys to slice
	return mapKeysToSortedSlice(uniqueTags), nil
}

// mapKeysToSortedSlice converts map keys to a sorted slice
func mapKeysToSortedSlice(m map[string]struct{}) []string {
	result := make([]string, 0, len(m))
	for key := range m {
		result = append(result, key)
	}
	sort.Strings(result)
	return result
}
