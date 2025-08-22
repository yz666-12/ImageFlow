package utils

import (
	"bytes"
	"fmt"
	"image"
	_ "image/gif"  // Register GIF format
	_ "image/jpeg" // Register JPEG format
	_ "image/png"  // Register PNG format
	_ "golang.org/x/image/webp" // Register WebP format
	_ "github.com/gen2brain/avif" // Register AVIF format
	"io"
	"io/fs"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/utils/logger"
	"go.uber.org/zap"
)

// ImageFormatInfo contains information about an image's format
type ImageFormatInfo struct {
	Format    string // Format name (e.g., "jpeg", "png", "gif")
	Extension string // File extension (e.g., ".jpg", ".png", ".gif")
	MimeType  string // MIME type (e.g., "image/jpeg", "image/png", "image/gif")
}

// SupportedImageExtensions contains all file extensions recognized by the application
var SupportedImageExtensions = []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}

// Global random source with proper seeding
var globalRand = rand.New(rand.NewSource(time.Now().UnixNano()))

// DetectImageFormat detects the format of an image from its binary data
func DetectImageFormat(data []byte) (ImageFormatInfo, error) {
	// Create a reader from the data
	r := bytes.NewReader(data)

	// Detect the image format
	_, format, err := image.DecodeConfig(r)
	if err != nil {
		logger.Error("Failed to decode image format", zap.Error(err))
		return ImageFormatInfo{}, fmt.Errorf("failed to decode image format: %v", err)
	}

	// Rewind the reader for future use
	if _, err = r.Seek(0, io.SeekStart); err != nil {
		logger.Error("Failed to rewind image reader", zap.Error(err))
		return ImageFormatInfo{}, fmt.Errorf("failed to process image data: %v", err)
	}

	// Convert format to lowercase
	format = strings.ToLower(format)
	logger.Debug("Detected image format", zap.String("format", format))

	// Map format to extension and MIME type
	switch format {
	case "jpeg":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".jpg",
			MimeType:  "image/jpg",
		}, nil
	case "png":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".png",
			MimeType:  "image/png",
		}, nil
	case "gif":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".gif",
			MimeType:  "image/gif",
		}, nil
	case "webp":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".webp",
			MimeType:  "image/webp",
		}, nil
	case "avif":
		return ImageFormatInfo{
			Format:    format,
			Extension: ".avif",
			MimeType:  "image/avif",
		}, nil
	default:
		// Default to jpeg for unknown formats
		logger.Debug("Unknown format detected, defaulting to JPEG",
			zap.String("original_format", format))
		return ImageFormatInfo{
			Format:    "jpeg",
			Extension: ".jpg",
			MimeType:  "image/jpeg",
		}, nil
	}
}

// IsImageFile checks if a filename has a supported image extension
func IsImageFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	for _, supportedExt := range SupportedImageExtensions {
		if ext == supportedExt {
			return true
		}
	}
	return false
}

// GetRandomImage returns a path to a random image with appropriate format for device and browser
//
// DEPRECATED: This function is deprecated and will be removed in a future version.
// Use handlers.RandomImage, handlers.RandomImageHandler, or handlers.LocalRandomImageHandler instead,
// which offer better PNG support and more consistent behavior across storage types.
func GetRandomImage(basePath string, deviceType DeviceType, avifSupport bool) (string, error) {
	// Select image orientation based on device type
	orientation := "landscape"
	if deviceType == Mobile {
		orientation = "portrait"
	}

	// Select image format based on browser support
	format := "webp"
	if avifSupport {
		format = "avif"
	}

	logger.Debug("Selecting random image",
		zap.String("orientation", orientation),
		zap.String("format", format),
		zap.String("base_path", basePath))

	// Construct the image directory path
	dirPath := filepath.Join(basePath, orientation, format)

	// Get all files in the directory
	files, err := os.ReadDir(dirPath)
	if err != nil {
		logger.Error("Failed to read image directory",
			zap.String("path", dirPath),
			zap.Error(err))
		return "", fmt.Errorf("failed to read image directory: %v", err)
	}

	// Filter for image files
	var imageFiles []fs.DirEntry
	for _, file := range files {
		if !file.IsDir() && IsImageFile(file.Name()) {
			imageFiles = append(imageFiles, file)
		}
	}

	if len(imageFiles) == 0 {
		logger.Error("No images found in directory",
			zap.String("path", dirPath))
		return "", fmt.Errorf("no images found in directory: %s", dirPath)
	}

	// Select a random image
	randomIndex := globalRand.Intn(len(imageFiles))
	selectedImage := imageFiles[randomIndex]

	imagePath := filepath.Join(dirPath, selectedImage.Name())
	logger.Debug("Selected random image",
		zap.String("path", imagePath),
		zap.Int("total_images", len(imageFiles)))

	return imagePath, nil
}
