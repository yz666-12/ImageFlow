package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// ConfigHandler returns a handler function that exposes selected configuration values
func ConfigHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Create a simplified config that only exposes what we want clients to know
		clientConfig := map[string]interface{}{
			"maxUploadCount": cfg.MaxUploadCount,
			"imageQuality":   cfg.ImageQuality,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(clientConfig)
	}
}
