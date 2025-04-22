package utils

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/h2non/bimg"
)

// InitVips initializes libvips and sets concurrency parameters.
func InitVips(cfg *config.Config) {
	os.Setenv("VIPS_CONCURRENCY", strconv.Itoa(cfg.WorkerThreads))
	log.Printf("Setting libvips concurrency to %d threads", cfg.WorkerThreads)

	bimg.Initialize()
}

// ConvertToWebPWithBimg converts image data to WebP format using bimg/libvips
func ConvertToWebPWithBimg(data []byte, cfg *config.Config) ([]byte, error) {

	log.Printf("Starting WebP conversion with bimg, input size: %d bytes, quality: %d, speed: %d",
		len(data), cfg.ImageQuality, cfg.Speed)

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

	options := bimg.Options{
		Type:    bimg.WEBP,
		Quality: cfg.ImageQuality,
		Speed:   cfg.Speed,
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
func ConvertToAVIFWithBimg(data []byte, cfg *config.Config) ([]byte, error) {

	log.Printf("Starting AVIF conversion with bimg, input size: %d bytes, quality: %d, speed: %d",
		len(data), cfg.ImageQuality, cfg.Speed)

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

	options := bimg.Options{
		Type:    bimg.AVIF,
		Quality: cfg.ImageQuality,
		Speed:   cfg.Speed,
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
