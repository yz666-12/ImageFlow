package handlers

import (
	"net/http"
	"os"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
)

// RandomImage handles random image requests in a unified way, working with both
// local and S3 storage based on the configured storage type.
//
// This handler:
// 1. Checks the storage type configuration (local or S3)
// 2. Delegates to the appropriate specialized handler
// 3. Returns a random image with proper format detection, including special handling for PNG
//
// Benefits:
// - Provides a single entry point for random image functionality
// - Maintains proper content type detection for all image formats
// - Handles PNG transparency properly with special cases
// - Ensures consistent headers and caching behavior
func RandomImage(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get storage type from environment
		storageType := os.Getenv("STORAGE_TYPE")

		// Use the appropriate handler based on storage type
		if storageType == "s3" {
			// Use the existing S3 handler
			RandomImageHandler(utils.S3Client)(w, r)
		} else {
			// Use the existing local handler
			LocalRandomImageHandler()(w, r)
		}
	}
}
