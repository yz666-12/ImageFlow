package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// ValidateAPIKey 验证 API key
func ValidateAPIKey(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// 从请求头获取 API key
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid": false,
				"error": "Missing API key",
			})
			return
		}

		// 提取 Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid": false,
				"error": "Invalid authorization header",
			})
			return
		}

		providedKey := parts[1]

		// 验证 API key
		if providedKey == cfg.APIKey {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid": true,
			})
		} else {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid": false,
				"error": "Invalid API key",
			})
		}
	}
}

// RequireAPIKey 中间件用于验证请求中的 API key
func RequireAPIKey(cfg *config.Config, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		providedKey := parts[1]
		if providedKey != cfg.APIKey {
			http.Error(w, "Invalid API key", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}
