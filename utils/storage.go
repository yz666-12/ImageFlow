package utils

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// S3Object represents an object in S3 storage
type S3Object struct {
	Key  string
	Size int64
}

// StorageProvider defines the interface for storage operations
type StorageProvider interface {
	Store(ctx context.Context, key string, data []byte) error
	Get(ctx context.Context, key string) ([]byte, error)
	Delete(ctx context.Context, key string) error
}

// LocalStorage implements StorageProvider for local filesystem
type LocalStorage struct {
	BasePath string
}

func NewLocalStorage(basePath string) (*LocalStorage, error) {
	dirs := []string{
		filepath.Join(basePath, "original", "landscape"),
		filepath.Join(basePath, "original", "portrait"),
		filepath.Join(basePath, "landscape", "webp"),
		filepath.Join(basePath, "landscape", "avif"),
		filepath.Join(basePath, "portrait", "webp"),
		filepath.Join(basePath, "portrait", "avif"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create directory %s: %v", dir, err)
		}
	}

	return &LocalStorage{BasePath: basePath}, nil
}

func (ls *LocalStorage) Store(ctx context.Context, key string, data []byte) error {
	fullPath := filepath.Join(ls.BasePath, key)
	dir := filepath.Dir(fullPath)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %v", dir, err)
	}

	if err := os.WriteFile(fullPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write file %s: %v", fullPath, err)
	}

	log.Printf("File stored locally: %s", key)
	return nil
}

func (ls *LocalStorage) Get(ctx context.Context, key string) ([]byte, error) {
	return os.ReadFile(filepath.Join(ls.BasePath, key))
}

func (ls *LocalStorage) Delete(ctx context.Context, key string) error {
	return os.Remove(filepath.Join(ls.BasePath, key))
}

// S3Storage implements StorageProvider for S3-compatible storage
type S3Storage struct {
	client       *s3.Client
	bucket       string
	customDomain string
	endpoint     string
}

func NewS3Storage(cfg *config.Config) (*S3Storage, error) {
	if err := InitS3Client(cfg); err != nil {
		return nil, err
	}
	return &S3Storage{
		client:       S3Client,
		bucket:       cfg.S3Bucket,
		customDomain: cfg.CustomDomain,
		endpoint:     cfg.S3Endpoint,
	}, nil
}

func (s *S3Storage) Store(ctx context.Context, key string, data []byte) error {
	log.Printf("Storing to S3: bucket=%s, key=%s, size=%d bytes", s.bucket, key, len(data))

	contentType := "application/octet-stream"
	ext := strings.ToLower(filepath.Ext(key))
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".webp":
		contentType = "image/webp"
	case ".avif":
		contentType = "image/avif"
	}

	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:       aws.String(s.bucket),
		Key:          aws.String(key),
		Body:         bytes.NewReader(data),
		ContentType:  aws.String(contentType),
		ACL:          types.ObjectCannedACLPublicRead,
		CacheControl: aws.String("public, max-age=31536000"), // 缓存一年
	})
	if err != nil {
		log.Printf("Failed to store object in S3: %v", err)
		return fmt.Errorf("failed to store object in S3: %v", err)
	}

	var url string
	if s.customDomain != "" {
		url = fmt.Sprintf("%s/%s", strings.TrimSuffix(s.customDomain, "/"), key)
	} else {
		url = fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(s.endpoint, "/"), s.bucket, key)
	}
	log.Printf("Successfully stored object in S3: %s (URL: %s)", key, url)
	return nil
}

func (s *S3Storage) Get(ctx context.Context, key string) ([]byte, error) {
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get object from S3: %v", err)
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

func (s *S3Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object from S3: %v", err)
	}
	return nil
}

// ListObjects lists objects in S3 with the given prefix
func (s *S3Storage) ListObjects(ctx context.Context, prefix string) ([]S3Object, error) {
	var objects []S3Object

	// Create paginator for listing objects
	paginator := s3.NewListObjectsV2Paginator(s.client, &s3.ListObjectsV2Input{
		Bucket: aws.String(s.bucket),
		Prefix: aws.String(prefix),
	})

	// Iterate through pages
	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to list objects from S3: %v", err)
		}

		// Process each object in the page
		for _, obj := range page.Contents {
			objects = append(objects, S3Object{
				Key:  *obj.Key,
				Size: *obj.Size,
			})
		}
	}

	return objects, nil
}

// StorageConfig represents the storage configuration
type StorageConfig struct {
	Type      string // "local" or "s3"
	LocalPath string // base path for local storage
}

// NewStorageProvider creates a new storage provider based on configuration
func NewStorageProvider(cfg *config.Config) (StorageProvider, error) {
	switch cfg.StorageType {
	case config.StorageTypeLocal:
		return NewLocalStorage(cfg.ImageBasePath)
	case config.StorageTypeS3:
		return NewS3Storage(cfg)
	default:
		return nil, fmt.Errorf("unsupported storage type: %s", cfg.StorageType)
	}
}

// Global storage instance
var Storage StorageProvider

// InitStorage initializes the global storage provider
func InitStorage(cfg *config.Config) error {
	var err error
	Storage, err = NewStorageProvider(cfg)
	return err
}
