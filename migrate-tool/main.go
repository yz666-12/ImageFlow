package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Configuration structure
type Config struct {
	RedisHost        string
	RedisPort        string
	RedisPassword    string
	RedisDB          int
	RedisTLSEnabled  bool
	RedisPrefix      string
	ImageBasePath    string
	StorageType      string
}

var (
	redisClient *redis.Client
	logger      *zap.Logger
	config      *Config
)

// Initialize logger
func initLogger() error {
	writeSyncer := zapcore.AddSync(&lumberjack.Logger{
		Filename:   "migrate_sizes.log",
		MaxSize:    10, // MB
		MaxBackups: 3,
		MaxAge:     7, // days
	})

	// Also log to console
	consoleEncoder := zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())
	fileEncoder := zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())

	core := zapcore.NewTee(
		zapcore.NewCore(consoleEncoder, zapcore.AddSync(os.Stdout), zapcore.InfoLevel),
		zapcore.NewCore(fileEncoder, writeSyncer, zapcore.DebugLevel),
	)

	logger = zap.New(core, zap.AddCaller())
	return nil
}

// Load configuration from environment
func loadConfig() (*Config, error) {
	// Try to load .env file from current directory or parent directories
	envPaths := []string{".env", "../.env", "../../.env"}
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			logger.Info("Loaded configuration from", zap.String("path", path))
			break
		}
	}

	redisDB := 0
	if dbStr := os.Getenv("REDIS_DB"); dbStr != "" {
		if db, err := strconv.Atoi(dbStr); err == nil {
			redisDB = db
		}
	}

	redisTLS := false
	if tlsStr := os.Getenv("REDIS_TLS_ENABLED"); tlsStr == "true" {
		redisTLS = true
	}

	cfg := &Config{
		RedisHost:       getEnvOrDefault("REDIS_HOST", "localhost"),
		RedisPort:       getEnvOrDefault("REDIS_PORT", "6379"),
		RedisPassword:   os.Getenv("REDIS_PASSWORD"),
		RedisDB:         redisDB,
		RedisTLSEnabled: redisTLS,
		RedisPrefix:     getEnvOrDefault("REDIS_PREFIX", "imageflow:"),
		ImageBasePath:   getEnvOrDefault("LOCAL_STORAGE_PATH", "static/images"),
		StorageType:     getEnvOrDefault("STORAGE_TYPE", "local"),
	}

	// Ensure Redis prefix ends with ":"
	if !strings.HasSuffix(cfg.RedisPrefix, ":") {
		cfg.RedisPrefix += ":"
	}

	return cfg, nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Initialize Redis client
func initRedis(cfg *Config) error {
	opts := &redis.Options{
		Addr:     cfg.RedisHost + ":" + cfg.RedisPort,
		Password: cfg.RedisPassword,
		DB:       cfg.RedisDB,
	}

	if cfg.RedisTLSEnabled {
		// For TLS, we'll use a basic TLS config
		// In production, you may want to customize this
		opts.TLSConfig = &tls.Config{
			InsecureSkipVerify: true, // For development, in production set to false
		}
	}

	redisClient = redis.NewClient(opts)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := redisClient.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %v", err)
	}

	logger.Info("Connected to Redis successfully",
		zap.String("host", cfg.RedisHost),
		zap.String("port", cfg.RedisPort),
		zap.Int("db", cfg.RedisDB))

	return nil
}

// Check if Redis metadata store is enabled
func isRedisEnabled() bool {
	enabled := getEnvOrDefault("REDIS_ENABLED", "true")
	metadataStore := getEnvOrDefault("METADATA_STORE_TYPE", "redis")
	return enabled == "true" && metadataStore == "redis"
}

// Main migration function
func migrateFileSizes() error {
	ctx := context.Background()

	// Get all image IDs
	imageIDs, err := redisClient.ZRevRange(ctx, config.RedisPrefix+"images", 0, -1).Result()
	if err != nil {
		return fmt.Errorf("failed to get image IDs from Redis: %v", err)
	}

	if len(imageIDs) == 0 {
		logger.Info("No images found in Redis, migration not needed")
		return nil
	}

	logger.Info("Starting size migration",
		zap.Int("total_images", len(imageIDs)),
		zap.String("image_base_path", config.ImageBasePath))

	updated := 0
	errors := 0
	skipped := 0

	for i, id := range imageIDs {
		if i%10 == 0 && i > 0 {
			logger.Info("Migration progress",
				zap.Int("processed", i),
				zap.Int("total", len(imageIDs)),
				zap.Int("updated", updated),
				zap.Int("skipped", skipped),
				zap.Int("errors", errors))
		}

		// Get existing metadata
		metadataKey := config.RedisPrefix + "metadata:" + id
		data, err := redisClient.HGetAll(ctx, metadataKey).Result()
		if err != nil {
			logger.Error("Failed to get metadata",
				zap.String("image_id", id),
				zap.Error(err))
			errors++
			continue
		}

		if len(data) == 0 {
			logger.Warn("No metadata found for image",
				zap.String("image_id", id))
			errors++
			continue
		}

		// Check if sizes field already exists
		if sizesStr, exists := data["sizes"]; exists && sizesStr != "" {
			skipped++
			continue
		}

		// Parse path information
		var paths struct {
			Original string `json:"original"`
			WebP     string `json:"webp"`
			AVIF     string `json:"avif"`
		}
		if pathsStr := data["paths"]; pathsStr != "" {
			if err := json.Unmarshal([]byte(pathsStr), &paths); err != nil {
				logger.Debug("Failed to unmarshal paths",
					zap.String("image_id", id),
					zap.Error(err))
			}
		}

		// Calculate file sizes for different formats
		sizes := make(map[string]int64)

		// Handle GIF files specially
		isGIF := data["format"] == "gif"
		if isGIF {
			filePath := filepath.Join(config.ImageBasePath, "gif", id+".gif")
			if fileInfo, err := os.Stat(filePath); err == nil {
				sizes["original"] = fileInfo.Size()
				sizes["webp"] = fileInfo.Size()
				sizes["avif"] = fileInfo.Size()
			} else {
				logger.Debug("GIF file not found",
					zap.String("image_id", id),
					zap.String("file_path", filePath))
			}
		} else {
			// Original file
			var originalPath string
			if paths.Original != "" {
				cleanPath := strings.TrimPrefix(paths.Original, "/")
				cleanPath = strings.TrimPrefix(cleanPath, "images/")
				originalPath = filepath.Join(config.ImageBasePath, cleanPath)
			} else {
				originalPath = filepath.Join(config.ImageBasePath, "original", data["orientation"], id+"."+data["format"])
			}

			if fileInfo, err := os.Stat(originalPath); err == nil {
				sizes["original"] = fileInfo.Size()
			}

			// WebP file
			var webpPath string
			if paths.WebP != "" {
				cleanPath := strings.TrimPrefix(paths.WebP, "/")
				cleanPath = strings.TrimPrefix(cleanPath, "images/")
				webpPath = filepath.Join(config.ImageBasePath, cleanPath)
			} else {
				webpPath = filepath.Join(config.ImageBasePath, data["orientation"], "webp", id+".webp")
			}

			if fileInfo, err := os.Stat(webpPath); err == nil {
				sizes["webp"] = fileInfo.Size()
			}

			// AVIF file
			var avifPath string
			if paths.AVIF != "" {
				cleanPath := strings.TrimPrefix(paths.AVIF, "/")
				cleanPath = strings.TrimPrefix(cleanPath, "images/")
				avifPath = filepath.Join(config.ImageBasePath, cleanPath)
			} else {
				avifPath = filepath.Join(config.ImageBasePath, data["orientation"], "avif", id+".avif")
			}

			if fileInfo, err := os.Stat(avifPath); err == nil {
				sizes["avif"] = fileInfo.Size()
			}
		}

		// Skip if no files found
		if len(sizes) == 0 {
			logger.Warn("No files found for image",
				zap.String("image_id", id))
			errors++
			continue
		}

		// Serialize size information
		sizesJSON, err := json.Marshal(sizes)
		if err != nil {
			logger.Error("Failed to marshal sizes",
				zap.String("image_id", id),
				zap.Error(err))
			errors++
			continue
		}

		// Update Redis metadata
		pipe := redisClient.Pipeline()

		// Set sizes field (JSON format with all format sizes)
		pipe.HSet(ctx, metadataKey, "sizes", string(sizesJSON))

		// Set default size field (original file size for backward compatibility)
		if originalSize, exists := sizes["original"]; exists {
			pipe.HSet(ctx, metadataKey, "size", fmt.Sprintf("%d", originalSize))
		} else if len(sizes) > 0 {
			// If no original file, use first available size
			for _, size := range sizes {
				pipe.HSet(ctx, metadataKey, "size", fmt.Sprintf("%d", size))
				break
			}
		}

		_, err = pipe.Exec(ctx)
		if err != nil {
			logger.Error("Failed to update metadata in Redis",
				zap.String("image_id", id),
				zap.Error(err))
			errors++
			continue
		}

		updated++
	}

	// Clear page cache to force regeneration
	pattern := config.RedisPrefix + "page_cache:*"
	keys, err := redisClient.Keys(ctx, pattern).Result()
	if err != nil {
		logger.Warn("Failed to get cache keys for cleanup", zap.Error(err))
	} else if len(keys) > 0 {
		if err := redisClient.Del(ctx, keys...).Err(); err != nil {
			logger.Warn("Failed to clear page cache", zap.Error(err))
		} else {
			logger.Info("Cleared page cache",
				zap.Int("cache_keys_cleared", len(keys)))
		}
	}

	logger.Info("Size migration completed",
		zap.Int("total_images", len(imageIDs)),
		zap.Int("updated", updated),
		zap.Int("skipped", skipped),
		zap.Int("errors", errors))

	if errors > 0 {
		return fmt.Errorf("migration completed with %d errors", errors)
	}

	return nil
}

func main() {
	// Initialize logger
	if err := initLogger(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	fmt.Println("===========================================")
	fmt.Println("ImageFlow File Size Migration Tool")
	fmt.Println("===========================================")
	fmt.Println()

	// Load configuration
	cfg, err := loadConfig()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}
	config = cfg

	logger.Info("Configuration loaded",
		zap.String("redis_host", cfg.RedisHost),
		zap.String("redis_port", cfg.RedisPort),
		zap.Int("redis_db", cfg.RedisDB),
		zap.String("storage_type", cfg.StorageType),
		zap.String("image_base_path", cfg.ImageBasePath))

	// Check if Redis is enabled
	if !isRedisEnabled() {
		logger.Fatal("Redis metadata store is not enabled. Please check REDIS_ENABLED and METADATA_STORE_TYPE in your configuration.")
	}

	// Initialize Redis
	if err := initRedis(cfg); err != nil {
		logger.Fatal("Failed to initialize Redis", zap.Error(err))
	}
	defer redisClient.Close()

	// Run migration
	if err := migrateFileSizes(); err != nil {
		logger.Error("Migration failed", zap.Error(err))
		fmt.Printf("\n❌ Migration failed: %v\n", err)
		fmt.Println("Check migrate_sizes.log for detailed error information")
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("✅ File size migration completed successfully!")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("1. Restart your ImageFlow service")
	fmt.Println("2. Refresh your browser")
	fmt.Println("3. Check the image management page to verify file sizes are displayed correctly")
	fmt.Println()
	fmt.Println("Migration details have been logged to: migrate_sizes.log")
}