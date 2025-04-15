package utils

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

	"github.com/redis/go-redis/v9"
)

var (
	// RedisClient is the global Redis client instance
	RedisClient *redis.Client
	// RedisEnabled indicates if Redis is enabled
	RedisEnabled bool
	// RedisPrefix is the prefix for all Redis keys
	RedisPrefix string
)

// InitRedisClient initializes the Redis client
// Read environment variables and initialize the Redis client (with TLS support). Sets RedisEnabled if connection is successful.
func InitRedisClient() error {
	// Check if Redis is enabled
	redisEnabled := os.Getenv("REDIS_ENABLED")
	if strings.ToLower(redisEnabled) != "true" {
		log.Printf("Redis is disabled")
		RedisEnabled = false
		return nil
	}

	// Get Redis configuration from environment variables
	redisHost := getEnvOrDefault("REDIS_HOST", "localhost")
	redisPort := getEnvOrDefault("REDIS_PORT", "6379")
	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisDB := parseEnvInt("REDIS_DB", 0)
	RedisPrefix = getEnvOrDefault("REDIS_PREFIX", "imageflow:")

	// Create Redis client
	// Check if TLS is enabled for Redis
	tlsEnabled := strings.ToLower(os.Getenv("REDIS_TLS_ENABLED")) == "true"
	redisOptions := &redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: redisPassword,
		DB:       redisDB,
	}
	if tlsEnabled {
		redisOptions.TLSConfig = &tls.Config{}
	}
	RedisClient = redis.NewClient(redisOptions)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Failed to connect to Redis: %v", err)
		return err
	}

	log.Printf("Connected to Redis at %s:%s", redisHost, redisPort)
	RedisEnabled = true
	return nil
}

// RedisMetadataStore implements metadata storage using Redis
// RedisMetadataStore is the structure for metadata operations using Redis.
type RedisMetadataStore struct {
	prefix string
}

// getEnvOrDefault returns the value of the environment variable or the default value if not set.
func getEnvOrDefault(key, defaultVal string) string {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	return v
}

// parseEnvInt parses an environment variable as int, or returns defaultVal on error.
func parseEnvInt(key string, defaultVal int) int {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		log.Printf("Invalid %s value: %s, using default %d", key, v, defaultVal)
		return defaultVal
	}
	return i
}

// NewRedisMetadataStore creates a new Redis metadata store
func NewRedisMetadataStore() *RedisMetadataStore {
	return &RedisMetadataStore{
		prefix: RedisPrefix + "metadata:",
	}
}

// SaveMetadata saves image metadata to Redis
func (rms *RedisMetadataStore) SaveMetadata(ctx context.Context, metadata *ImageMetadata) error {
	// Marshal metadata to JSON
	data, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %v", err)
	}

	// Save metadata
	key := rms.prefix + metadata.ID
	if err := RedisClient.Set(ctx, key, data, 0).Err(); err != nil {
		return fmt.Errorf("failed to save metadata to Redis: %v", err)
	}

	// If expiry time is set, add to expiry index
	if !metadata.ExpiryTime.IsZero() {
		expiryKey := RedisPrefix + "expiry"
		score := float64(metadata.ExpiryTime.Unix())
		if err := RedisClient.ZAdd(ctx, expiryKey, redis.Z{
			Score:  score,
			Member: metadata.ID,
		}).Err(); err != nil {
			log.Printf("Warning: Failed to add to expiry index: %v", err)
		}
	}

	// Add tags to tag index
	if len(metadata.Tags) > 0 {
		for _, tag := range metadata.Tags {
			tagKey := RedisPrefix + "tag:" + tag
			if err := RedisClient.SAdd(ctx, tagKey, metadata.ID).Err(); err != nil {
				log.Printf("Warning: Failed to add to tag index: %v", err)
			}
		}

		// Add to all tags set
		allTagsKey := RedisPrefix + "all_tags"
		// Convert []string to []any
		tagsInterface := make([]any, len(metadata.Tags))
		for i, tag := range metadata.Tags {
			tagsInterface[i] = tag
		}
		if err := RedisClient.SAdd(ctx, allTagsKey, tagsInterface...).Err(); err != nil {
			log.Printf("Warning: Failed to add to all tags set: %v", err)
		}
	}

	log.Printf("Metadata saved to Redis for image %s", metadata.ID)
	return nil
}

// GetMetadata retrieves image metadata from Redis
func (rms *RedisMetadataStore) GetMetadata(ctx context.Context, id string) (*ImageMetadata, error) {
	key := rms.prefix + id
	data, err := RedisClient.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("metadata not found for ID: %s", id)
		}
		return nil, fmt.Errorf("failed to get metadata from Redis: %v", err)
	}

	var metadata ImageMetadata
	if err := json.Unmarshal(data, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %v", err)
	}

	return &metadata, nil
}

// ListExpiredImages lists all expired images
func (rms *RedisMetadataStore) ListExpiredImages(ctx context.Context) ([]*ImageMetadata, error) {
	now := time.Now()
	expiryKey := RedisPrefix + "expiry"

	// Get all expired image IDs (score <= current timestamp)
	expiredIDs, err := RedisClient.ZRangeByScore(ctx, expiryKey, &redis.ZRangeBy{
		Min: "0",
		Max: fmt.Sprintf("%d", now.Unix()),
	}).Result()

	if err != nil {
		return nil, fmt.Errorf("failed to get expired image IDs: %v", err)
	}

	var expiredImages []*ImageMetadata
	for _, id := range expiredIDs {
		metadata, err := rms.GetMetadata(ctx, id)
		if err != nil {
			log.Printf("Error getting metadata for expired image %s: %v", id, err)
			continue
		}

		expiredImages = append(expiredImages, metadata)
	}

	if len(expiredImages) > 0 {
		log.Printf("Found %d expired images", len(expiredImages))
	}
	return expiredImages, nil
}

// DeleteMetadata deletes image metadata from Redis
func (rms *RedisMetadataStore) DeleteMetadata(ctx context.Context, id string) error {
	// Get metadata first to get tags
	metadata, err := rms.GetMetadata(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to get metadata for deletion: %v", err)
	}

	// Remove from tag indexes
	for _, tag := range metadata.Tags {
		tagKey := RedisPrefix + "tag:" + tag
		if err := RedisClient.SRem(ctx, tagKey, id).Err(); err != nil {
			log.Printf("Warning: Failed to remove from tag index: %v", err)
		}
	}

	// Remove from expiry index
	expiryKey := RedisPrefix + "expiry"
	if err := RedisClient.ZRem(ctx, expiryKey, id).Err(); err != nil {
		log.Printf("Warning: Failed to remove from expiry index: %v", err)
	}

	// Delete metadata
	key := rms.prefix + id
	if err := RedisClient.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete metadata from Redis: %v", err)
	}

	log.Printf("Metadata deleted from Redis for image %s", id)
	return nil
}

// GetAllUniqueTags retrieves all unique tags from Redis
func GetAllUniqueTags(ctx context.Context) ([]string, error) {
	if !RedisEnabled {
		return nil, fmt.Errorf("redis is not enabled")
	}

	allTagsKey := RedisPrefix + "all_tags"
	tags, err := RedisClient.SMembers(ctx, allTagsKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get tags from Redis: %v", err)
	}

	return tags, nil
}

// GetImagesByTag retrieves all image IDs with a specific tag
func GetImagesByTag(ctx context.Context, tag string) ([]string, error) {
	if !RedisEnabled {
		return nil, fmt.Errorf("redis is not enabled")
	}

	tagKey := RedisPrefix + "tag:" + tag
	imageIDs, err := RedisClient.SMembers(ctx, tagKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get images by tag from Redis: %v", err)
	}

	return imageIDs, nil
}

// MigrateMetadataToRedis migrates metadata from JSON files or S3 to Redis
func MigrateMetadataToRedis(ctx context.Context) error {
	if !RedisEnabled {
		return fmt.Errorf("redis is not enabled")
	}

	storageType := os.Getenv("STORAGE_TYPE")
	log.Printf("Starting metadata migration to Redis for storage type: %s", storageType)

	// Create Redis metadata store
	redisStore := NewRedisMetadataStore()

	if storageType == "s3" {
		return migrateS3MetadataToRedis(ctx, redisStore)
	} else {
		return migrateLocalMetadataToRedis(ctx, redisStore)
	}
}

// migrateLocalMetadataToRedis migrates local metadata to Redis
func migrateLocalMetadataToRedis(ctx context.Context, redisStore *RedisMetadataStore) error {
	// Get local metadata store
	localPath := os.Getenv("LOCAL_STORAGE_PATH")
	if localPath == "" {
		localPath = "static/images"
	}

	// Ensure path is absolute
	if !filepath.IsAbs(localPath) {
		localPath = filepath.Join(".", localPath)
	}

	metadataDir := filepath.Join(localPath, "metadata")
	files, err := os.ReadDir(metadataDir)
	if err != nil {
		return fmt.Errorf("failed to read metadata directory: %v", err)
	}

	migratedCount := 0
	for _, file := range files {
		if file.IsDir() || filepath.Ext(file.Name()) != ".json" {
			continue
		}

		// Extract ID from filename
		id := filepath.Base(file.Name())
		id = id[:len(id)-5] // Remove .json extension

		// Read metadata file
		metadataPath := filepath.Join(metadataDir, file.Name())
		data, err := os.ReadFile(metadataPath)
		if err != nil {
			log.Printf("Error reading metadata file %s: %v", metadataPath, err)
			continue
		}

		var metadata ImageMetadata
		if err := json.Unmarshal(data, &metadata); err != nil {
			log.Printf("Error unmarshaling metadata from %s: %v", metadataPath, err)
			continue
		}

		// Save to Redis
		if err := redisStore.SaveMetadata(ctx, &metadata); err != nil {
			log.Printf("Error saving metadata to Redis for %s: %v", id, err)
			continue
		}

		migratedCount++
	}

	log.Printf("Migrated %d metadata entries from local storage to Redis", migratedCount)
	return nil
}

// migrateS3MetadataToRedis migrates S3 metadata to Redis
func migrateS3MetadataToRedis(ctx context.Context, redisStore *RedisMetadataStore) error {
	// Get S3 storage instance
	s3Storage, ok := Storage.(*S3Storage)
	if !ok {
		return fmt.Errorf("failed to get S3 storage instance")
	}

	// List all metadata objects
	metadataPrefix := "metadata/"
	objects, err := s3Storage.ListObjects(ctx, metadataPrefix)
	if err != nil {
		return fmt.Errorf("failed to list metadata objects: %v", err)
	}

	migratedCount := 0
	for _, obj := range objects {
		// Skip if not a JSON file
		if filepath.Ext(obj.Key) != ".json" {
			continue
		}

		// Extract ID from key
		id := filepath.Base(obj.Key)
		id = id[:len(id)-5] // Remove .json extension

		// Get metadata from S3
		data, err := s3Storage.Get(ctx, obj.Key)
		if err != nil {
			log.Printf("Error getting metadata from S3 for %s: %v", obj.Key, err)
			continue
		}

		var metadata ImageMetadata
		if err := json.Unmarshal(data, &metadata); err != nil {
			log.Printf("Error unmarshaling metadata from S3 for %s: %v", obj.Key, err)
			continue
		}

		// Save to Redis
		if err := redisStore.SaveMetadata(ctx, &metadata); err != nil {
			log.Printf("Error saving metadata to Redis for %s: %v", id, err)
			continue
		}

		migratedCount++
	}

	log.Printf("Migrated %d metadata entries from S3 to Redis", migratedCount)
	return nil
}

// GetAllMetadata retrieves all image metadata from Redis
func (rms *RedisMetadataStore) GetAllMetadata(ctx context.Context) ([]*ImageMetadata, error) {
	if !RedisEnabled {
		return nil, fmt.Errorf("redis is not enabled")
	}

	// Get all keys matching the metadata prefix pattern
	pattern := rms.prefix + "*"
	keys, err := RedisClient.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata keys from Redis: %v", err)
	}

	var allMetadata []*ImageMetadata
	for _, key := range keys {
		// Extract ID from key
		id := strings.TrimPrefix(key, rms.prefix)

		// Get metadata for this ID
		metadata, err := rms.GetMetadata(ctx, id)
		if err != nil {
			log.Printf("Warning: Failed to get metadata for ID %s: %v", id, err)
			continue
		}

		allMetadata = append(allMetadata, metadata)
	}

	log.Printf("Retrieved %d metadata entries from Redis", len(allMetadata))
	return allMetadata, nil
}
