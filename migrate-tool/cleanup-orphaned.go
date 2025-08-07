package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var (
	redisClient *redis.Client
	logger      *zap.Logger
)

// Initialize logger
func initLogger() error {
	writeSyncer := zapcore.AddSync(&lumberjack.Logger{
		Filename:   "cleanup_orphaned.log",
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

// Load Redis configuration
func initRedis() error {
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

	redisHost := getEnvOrDefault("REDIS_HOST", "localhost")
	redisPort := getEnvOrDefault("REDIS_PORT", "6379")
	redisPassword := os.Getenv("REDIS_PASSWORD")

	opts := &redis.Options{
		Addr:     redisHost + ":" + redisPort,
		Password: redisPassword,
		DB:       redisDB,
	}

	if redisTLS {
		opts.TLSConfig = &tls.Config{
			InsecureSkipVerify: true,
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
		zap.String("host", redisHost),
		zap.String("port", redisPort),
		zap.Int("db", redisDB))

	return nil
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Clean orphaned image IDs from Redis
func cleanOrphanedImageIDs() error {
	ctx := context.Background()

	// Find the correct Redis prefix
	possiblePrefixes := []string{
		"imageflow:s3:",
		"imageflow:local:",
		"imageflow:",
	}

	var foundPrefix string
	var imageIDs []string

	for _, prefix := range possiblePrefixes {
		testKey := prefix + "images"
		logger.Info("Checking for images with prefix", zap.String("key", testKey))

		ids, err := redisClient.ZRevRange(ctx, testKey, 0, -1).Result()
		if err == nil && len(ids) > 0 {
			foundPrefix = prefix
			imageIDs = ids
			logger.Info("Found images with prefix",
				zap.String("prefix", prefix),
				zap.Int("count", len(ids)))
			break
		}
	}

	if len(imageIDs) == 0 {
		logger.Info("No images found with any common prefix")
		return nil
	}

	logger.Info("Starting cleanup of orphaned image IDs",
		zap.Int("total_images", len(imageIDs)))

	orphaned := 0
	valid := 0

	for i, id := range imageIDs {
		if i%50 == 0 && i > 0 {
			logger.Info("Cleanup progress",
				zap.Int("processed", i),
				zap.Int("total", len(imageIDs)),
				zap.Int("orphaned", orphaned),
				zap.Int("valid", valid))
		}

		// Check if metadata exists
		metadataKey := foundPrefix + "metadata:" + id
		exists, err := redisClient.Exists(ctx, metadataKey).Result()
		if err != nil {
			logger.Warn("Failed to check metadata existence",
				zap.String("image_id", id),
				zap.Error(err))
			continue
		}

		if exists == 0 {
			// Orphaned entry - remove from main images index
			imagesKey := foundPrefix + "images"
			if err := redisClient.ZRem(ctx, imagesKey, id).Err(); err != nil {
				logger.Error("Failed to remove orphaned image ID",
					zap.String("image_id", id),
					zap.Error(err))
			} else {
				logger.Debug("Removed orphaned image ID",
					zap.String("image_id", id))
				orphaned++
			}
		} else {
			valid++
		}
	}

	// Clear page cache
	pattern := foundPrefix + "page_cache:*"
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

	logger.Info("Cleanup completed",
		zap.Int("total_processed", len(imageIDs)),
		zap.Int("orphaned_removed", orphaned),
		zap.Int("valid_kept", valid))

	return nil
}

func main() {
	// Initialize logger
	if err := initLogger(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	fmt.Println("==========================================")
	fmt.Println("ImageFlow Orphaned Image ID Cleanup Tool")
	fmt.Println("==========================================")
	fmt.Println()

	// Initialize Redis
	if err := initRedis(); err != nil {
		logger.Fatal("Failed to initialize Redis", zap.Error(err))
	}
	defer redisClient.Close()

	// Clean orphaned entries
	if err := cleanOrphanedImageIDs(); err != nil {
		logger.Error("Cleanup failed", zap.Error(err))
		fmt.Printf("\n❌ Cleanup failed: %v\n", err)
		fmt.Println("Check cleanup_orphaned.log for detailed error information")
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("✅ Orphaned image ID cleanup completed successfully!")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("1. Restart your ImageFlow service")
	fmt.Println("2. Refresh your browser")
	fmt.Println("3. The ghost entries should no longer appear in your image list")
	fmt.Println()
	fmt.Println("Cleanup details have been logged to: cleanup_orphaned.log")
}