package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// AuthResponse represents the response for API key validation
type AuthResponse struct {
	Valid bool   `json:"valid"`           // Whether the API key is valid
	Error string `json:"error,omitempty"` // Error message if validation fails
}

// ValidateAPIKey provides an endpoint to validate API keys
func ValidateAPIKey(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Get API key from request header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			json.NewEncoder(w).Encode(AuthResponse{
				Valid: false,
				Error: "Missing API key",
			})
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			json.NewEncoder(w).Encode(AuthResponse{
				Valid: false,
				Error: "Invalid authorization header",
			})
			return
		}

		providedKey := parts[1]

		// Validate API key
		if providedKey == cfg.APIKey {
			json.NewEncoder(w).Encode(AuthResponse{
				Valid: true,
			})
		} else {
			json.NewEncoder(w).Encode(AuthResponse{
				Valid: false,
				Error: "Invalid API key",
			})
		}
	}
}

// RequireAPIKey middleware to validate API key before processing requests
func RequireAPIKey(cfg *config.Config, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get API key from request header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		// Validate API key
		providedKey := parts[1]
		if providedKey != cfg.APIKey {
			http.Error(w, "Invalid API key", http.StatusUnauthorized)
			return
		}

		// If API key is valid, proceed to next handler
		next(w, r)
	}
}
