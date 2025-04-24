package handlers

import (
	"net/http"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils/errors"
	"github.com/Yuri-NagaSaki/ImageFlow/utils/logger"
	"go.uber.org/zap"
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
			errors.WriteError(w, errors.ErrInvalidAPIKey)
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			errors.WriteError(w, errors.ErrInvalidAPIKey)
			return
		}

		providedKey := parts[1]

		// Validate API key
		if providedKey == cfg.APIKey {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"valid":true}`))
			logger.Debug("API key validated successfully")
		} else {
			errors.WriteError(w, errors.ErrInvalidAPIKey)
			logger.Warn("API key validation failed",
				zap.String("provided_key", providedKey))
		}
	}
}

// RequireAPIKey middleware to validate API key before processing requests
func RequireAPIKey(cfg *config.Config, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get API key from request header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			errors.WriteError(w, errors.ErrInvalidAPIKey)
			logger.Warn("缺少API密钥",
				zap.String("path", r.URL.Path))
			return
		}

		// Extract Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			errors.WriteError(w, errors.ErrInvalidAPIKey)
			logger.Warn("无效的Authorization头",
				zap.String("path", r.URL.Path),
				zap.String("auth_header", authHeader))
			return
		}

		// Validate API key
		providedKey := parts[1]
		if providedKey != cfg.APIKey {
			errors.WriteError(w, errors.ErrInvalidAPIKey)
			logger.Warn("API密钥验证失败",
				zap.String("path", r.URL.Path),
				zap.String("provided_key", providedKey))
			return
		}

		// If API key is valid, proceed to next handler
		next(w, r)
	}
}
