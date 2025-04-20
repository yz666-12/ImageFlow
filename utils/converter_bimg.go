package utils

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"

	"github.com/h2non/bimg"
)

var (
	vipsOnce sync.Once
)

// InitVips initializes libvips and sets concurrency parameters.
// This function is thread-safe and will only execute once.
func InitVips(threads int) {
	vipsOnce.Do(func() {
		// Set thread limit for image processing via environment variable
		os.Setenv("VIPS_CONCURRENCY", strconv.Itoa(threads))

		log.Printf("Initialized libvips with %d threads", threads)
	})
}

// ConvertToWebPWithBimg converts image data to WebP format using bimg/libvips
func ConvertToWebPWithBimg(data []byte) ([]byte, error) {
	quality := getImageQuality()
	effort := getCompressionEffort()
	threads := getThreadCount()

	// Initialize libvips
	InitVips(threads)

	log.Printf("Starting WebP conversion with bimg, input size: %d bytes, quality: %s, effort: %d",
		len(data), quality, effort)

	// Detect image format
	imgFormat, err := DetectImageFormat(data)
	if err != nil {
		return nil, fmt.Errorf("failed to detect image format: %v", err)
	}

	// Return original data for GIF images
	if imgFormat.Format == "gif" {
		log.Printf("GIF detected, skipping WebP conversion")
		return data, nil
	}

	// Create bimg image object
	img := bimg.NewImage(data)

	// Set conversion parameters
	qualityInt, _ := strconv.Atoi(quality)
	options := bimg.Options{
		Type:    bimg.WEBP,
		Quality: qualityInt,
		// Note: bimg doesn't support direct effort control for WebP
		// It uses internal optimization
		Lossless: shouldUseLossless(imgFormat.Format),
	}

	// Perform conversion
	result, err := img.Process(options)
	if err != nil {
		log.Printf("WebP conversion failed: %v", err)
		return nil, fmt.Errorf("webp conversion failed: %v", err)
	}

	log.Printf("WebP conversion successful, output size: %d bytes, compression ratio: %.2f%%",
		len(result), float64(len(result))*100/float64(len(data)))

	return result, nil
}

// ConvertToAVIFWithBimg converts image data to AVIF format using bimg/libvips
func ConvertToAVIFWithBimg(data []byte) ([]byte, error) {
	quality := getImageQuality()
	effort := getCompressionEffort()
	threads := getThreadCount()

	// Initialize libvips
	InitVips(threads)

	log.Printf("Starting AVIF conversion with bimg, input size: %d bytes, quality: %s, effort: %d",
		len(data), quality, effort)

	// Detect image format
	imgFormat, err := DetectImageFormat(data)
	if err != nil {
		return nil, fmt.Errorf("failed to detect image format: %v", err)
	}

	// Return original data for GIF images
	if imgFormat.Format == "gif" {
		log.Printf("GIF detected, skipping AVIF conversion")
		return data, nil
	}

	// Create bimg image object
	img := bimg.NewImage(data)

	// Set conversion parameters
	qualityInt, _ := strconv.Atoi(quality)
	options := bimg.Options{
		Type:    bimg.AVIF,
		Quality: qualityInt,
		// Note: bimg uses internal optimization for AVIF
		// Effort parameter is not directly supported
		Lossless: shouldUseLossless(imgFormat.Format),
	}

	// Perform conversion
	result, err := img.Process(options)
	if err != nil {
		log.Printf("AVIF conversion failed: %v", err)
		return nil, fmt.Errorf("avif conversion failed: %v", err)
	}

	log.Printf("AVIF conversion successful, output size: %d bytes, compression ratio: %.2f%%",
		len(result), float64(len(result))*100/float64(len(data)))

	return result, nil
}
