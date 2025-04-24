package main

import (
	"context"
	"flag"
	"log"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Parse command-line flags
	forceFlag := flag.Bool("force", false, "Force migration even if it was already completed")
	envFile := flag.String("env", ".env", "Path to .env file")
	flag.Parse()

	// Load environment variables
	if err := godotenv.Load(*envFile); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
		log.Printf("Continuing with environment variables from the system")
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Check if Redis is enabled as metadata store
	if cfg.MetadataStoreType != config.MetadataStoreTypeRedis {
		log.Fatalf("Redis is not configured as metadata store. Set METADATA_STORE_TYPE=redis in your .env file")
	}

	// Initialize Redis client
	if err := utils.InitRedisClient(cfg); err != nil {
		log.Fatalf("Failed to initialize Redis client: %v", err)
	}

	// Check if Redis is properly initialized
	if !utils.IsRedisMetadataStore() {
		log.Fatalf("Redis metadata store is not properly initialized")
	}

	// Initialize storage provider based on storage type
	log.Printf("Storage type: %s", cfg.StorageType)

	if cfg.StorageType == config.StorageTypeS3 {
		// Initialize S3 client
		if err := utils.InitS3Client(cfg); err != nil {
			log.Fatalf("Failed to initialize S3 client: %v", err)
		}
	}

	// Initialize storage
	if err := utils.InitStorage(cfg); err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	// Check if migration was already completed
	ctx := context.Background()
	migrationKey := utils.RedisPrefix + "migration_completed"

	if !*forceFlag {
		val, err := utils.RedisClient.Get(ctx, migrationKey).Result()
		if err == nil {
			log.Printf("Migration was already completed at %s", val)
			log.Printf("Use --force flag to force migration")
			return
		} else if err != redis.Nil {
			log.Printf("Error checking migration status: %v", err)
		}
	} else {
		log.Printf("Force flag is set, proceeding with migration regardless of previous status")
	}

	// Start migration
	log.Printf("Starting metadata migration to Redis...")
	startTime := time.Now()

	if err := utils.MigrateMetadataToRedis(ctx, cfg); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// Mark migration as completed
	if err := utils.RedisClient.Set(ctx, migrationKey, time.Now().Format(time.RFC3339), 0).Err(); err != nil {
		log.Printf("Warning: Failed to mark migration as completed: %v", err)
	}

	duration := time.Since(startTime)
	log.Printf("Migration completed successfully in %v", duration)
}
