package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

// Config stores the application configuration
type Config struct {
	ServerAddr        string `json:"server_addr"`     // Server listen address
	ImageBasePath     string `json:"image_base_path"` // Base path for image storage
	AvifSupport       bool   `json:"avif_support"`    // Whether AVIF format is supported
	APIKey            string // API key for authentication
	MaxUploadCount    int    `json:"max_upload_count"`   // Maximum number of images allowed in single upload
	ImageQuality      int    `json:"image_quality"`      // Image conversion quality (1-100)
	WorkerThreads     int    `json:"worker_threads"`     // Number of parallel worker threads
	CompressionEffort int    `json:"compression_effort"` // Compression effort level (0-10)
	ForceLossless     bool   `json:"force_lossless"`     // Whether to force lossless conversion
}

// Load loads configuration from environment variables and config file
func Load() (*Config, error) {
	// Default configuration
	cfg := &Config{
		ServerAddr:        "0.0.0.0:8686",
		ImageBasePath:     os.Getenv("LOCAL_STORAGE_PATH"),
		AvifSupport:       true,
		MaxUploadCount:    10,    // Default max upload: 10 images
		ImageQuality:      80,    // Default quality: 80
		WorkerThreads:     4,     // Default workers: 4 threads
		CompressionEffort: 6,     // Default compression effort: 6 (medium-high)
		ForceLossless:     false, // Default to lossy compression
	}

	// If LOCAL_STORAGE_PATH is not set, use default value
	if cfg.ImageBasePath == "" {
		cfg.ImageBasePath = "static/images"
	}

	// Ensure path is relative
	if !filepath.IsAbs(cfg.ImageBasePath) {
		cfg.ImageBasePath = filepath.Join(".", cfg.ImageBasePath)
	}

	// Try to load .env file, but don't require it
	_ = godotenv.Load()

	// Get API key from environment
	cfg.APIKey = os.Getenv("API_KEY")

	// Get max upload count from environment
	if maxCount := os.Getenv("MAX_UPLOAD_COUNT"); maxCount != "" {
		if count, err := strconv.Atoi(maxCount); err == nil && count > 0 {
			cfg.MaxUploadCount = count
		}
	}

	// Get image quality from environment
	if quality := os.Getenv("IMAGE_QUALITY"); quality != "" {
		if q, err := strconv.Atoi(quality); err == nil && q > 0 && q <= 100 {
			cfg.ImageQuality = q
		}
	}

	// Get worker threads from environment
	if workers := os.Getenv("WORKER_THREADS"); workers != "" {
		if w, err := strconv.Atoi(workers); err == nil && w > 0 {
			cfg.WorkerThreads = w
		}
	}

	// Get compression effort from environment
	if effort := os.Getenv("COMPRESSION_EFFORT"); effort != "" {
		if e, err := strconv.Atoi(effort); err == nil && e >= 0 && e <= 10 {
			cfg.CompressionEffort = e
		}
	}

	// Get force lossless setting from environment
	if lossless := os.Getenv("FORCE_LOSSLESS"); lossless == "true" || lossless == "1" {
		cfg.ForceLossless = true
	}

	// If config file exists, load additional configuration from file
	if _, err := os.Stat("config/config.json"); err == nil {
		file, err := os.Open("config/config.json")
		if err != nil {
			return nil, err
		}
		defer file.Close()

		decoder := json.NewDecoder(file)
		if err := decoder.Decode(cfg); err != nil {
			return nil, err
		}
	}

	return cfg, nil
}
