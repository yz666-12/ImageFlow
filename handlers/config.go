package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// ClientConfig represents the configuration exposed to clients
type ClientConfig struct {
	MaxUploadCount    int  `json:"maxUploadCount"`    // Maximum number of images allowed per upload
	ImageQuality      int  `json:"imageQuality"`      // Image conversion quality (1-100)
	CompressionEffort int  `json:"compressionEffort"` // Compression effort level (0-10)
	ForceLossless     bool `json:"forceLossless"`     // Whether to force lossless conversion
}

// ConfigHandler returns a handler function that exposes selected configuration values to clients
func ConfigHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Create a simplified config that only exposes what we want clients to know
		clientConfig := ClientConfig{
			MaxUploadCount:    cfg.MaxUploadCount,
			ImageQuality:      cfg.ImageQuality,
			CompressionEffort: cfg.CompressionEffort,
			ForceLossless:     cfg.ForceLossless,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(clientConfig)
	}
}
