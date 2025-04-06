package utils

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// Global configuration instance
var Config *config.Config

// SetConfig sets the global configuration
func SetConfig(cfg *config.Config) {
	Config = cfg
}

// getImageQuality returns the configured quality setting
func getImageQuality() string {
	if Config != nil {
		return strconv.Itoa(Config.ImageQuality)
	}

	// Fallback to environment variable if config is not set
	quality := "80" // Default quality
	if q := os.Getenv("IMAGE_QUALITY"); q != "" {
		// Validate quality is a number between 1-100
		if qInt, err := strconv.Atoi(q); err == nil && qInt > 0 && qInt <= 100 {
			quality = q
		} else {
			log.Printf("Invalid IMAGE_QUALITY value: %s, using default: 80", q)
		}
	}
	return quality
}

// getCompressionEffort returns the configured compression effort level
func getCompressionEffort() int {
	if Config != nil {
		return Config.CompressionEffort
	}

	// Fallback to environment variable if config is not set
	effort := 6 // Default effort (medium-high)
	if e := os.Getenv("COMPRESSION_EFFORT"); e != "" {
		if eInt, err := strconv.Atoi(e); err == nil && eInt >= 0 && eInt <= 10 {
			effort = eInt
		} else {
			log.Printf("Invalid COMPRESSION_EFFORT value: %s, using default: 6", e)
		}
	}
	return effort
}

// shouldUseLossless determines if lossless mode should be used
// format parameter can be used to make format-specific decisions
func shouldUseLossless(format string) bool {
	// Check config first
	if Config != nil && Config.ForceLossless {
		return true
	}

	// Fallback to environment variable if config is not set
	if l := os.Getenv("FORCE_LOSSLESS"); l == "1" || l == "true" {
		return true
	}

	// Optionally use lossless for PNG images to preserve transparency
	if format == "png" {
		// Check if PNG images should use lossless by default
		if png := os.Getenv("PNG_LOSSLESS"); png == "1" || png == "true" {
			return true
		}
	}

	// Default to lossy for all other formats
	return false
}

// createTempFile creates a temporary file with the given prefix and suffix
func createTempFile(prefix, suffix string, data []byte) (string, error) {
	tempFile, err := os.CreateTemp("", prefix+"-*"+suffix)
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %v", err)
	}
	defer tempFile.Close()

	if _, err := tempFile.Write(data); err != nil {
		os.Remove(tempFile.Name())
		return "", fmt.Errorf("failed to write temp file: %v", err)
	}

	return tempFile.Name(), nil
}

// ConvertToWebP converts image data to WebP format
func ConvertToWebP(data []byte) ([]byte, error) {
	quality := getImageQuality()
	effort := getCompressionEffort()
	threads := getThreadCount()

	log.Printf("Starting WebP conversion, input size: %d bytes, quality: %s, effort: %d, threads: %d",
		len(data), quality, effort, threads)

	// Detect the image format
	imgFormat, err := DetectImageFormat(data)
	if err != nil {
		return nil, fmt.Errorf("failed to detect image format: %v", err)
	}

	log.Printf("Converting %s image to WebP", imgFormat.Format)

	// For GIF images, return the original data without conversion
	if imgFormat.Format == "gif" {
		log.Printf("GIF detected, skipping WebP conversion and returning original data")
		return data, nil
	}

	// Create temporary input file with appropriate extension
	inputPath, err := createTempFile("input", imgFormat.Extension, data)
	if err != nil {
		return nil, err
	}
	defer os.Remove(inputPath)

	// Create temporary output file
	tempOutput, err := os.CreateTemp("", "output-*.webp")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp output file: %v", err)
	}
	tempOutput.Close()
	outputPath := tempOutput.Name()
	defer os.Remove(outputPath)

	// Convert to WebP with appropriate flags based on source format
	var cmd *exec.Cmd

	// Check if we should use lossless mode
	useLossless := shouldUseLossless(imgFormat.Format)

	// Build command with shared parameters
	args := []string{
		"-q", quality,
		"-m", fmt.Sprintf("%d", effort),
		"-mt", // Enable multi-threading (doesn't take a thread count parameter)
	}

	// Add lossless flag if needed
	if useLossless {
		log.Printf("Using cwebp with lossless flag for %s conversion", imgFormat.Format)
		args = append(args, "-lossless")
	}

	// Add input and output files
	args = append(args, inputPath, "-o", outputPath)
	cmd = exec.Command("cwebp", args...)

	// Log the command for debugging
	log.Printf("Running: %s", cmd.String())

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("WebP conversion failed: %v\nOutput: %s", err, string(output))
		return nil, fmt.Errorf("webp conversion failed: %v", err)
	}

	// Read the output file
	result, err := os.ReadFile(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read WebP output file: %v", err)
	}

	log.Printf("WebP conversion successful, output size: %d bytes, compression ratio: %.2f%%",
		len(result), float64(len(result))*100/float64(len(data)))

	return result, nil
}

// ConvertToAVIF converts image data to AVIF format
func ConvertToAVIF(data []byte) ([]byte, error) {
	quality := getImageQuality()
	effort := getCompressionEffort()

	// Get thread count from environment or use default
	threads := getThreadCount()

	log.Printf("Starting AVIF conversion, input size: %d bytes, quality: %s, effort: %d, threads: %d",
		len(data), quality, effort, threads)

	// Detect the image format
	imgFormat, err := DetectImageFormat(data)
	if err != nil {
		return nil, fmt.Errorf("failed to detect image format: %v", err)
	}

	log.Printf("Converting %s image to AVIF", imgFormat.Format)

	// For GIF images, return the original data without conversion
	if imgFormat.Format == "gif" {
		log.Printf("GIF detected, skipping AVIF conversion and returning original data")
		return data, nil
	}

	// Create temporary input file with appropriate extension
	inputPath, err := createTempFile("input", imgFormat.Extension, data)
	if err != nil {
		return nil, err
	}
	defer os.Remove(inputPath)

	// Create temporary output file
	tempOutput, err := os.CreateTemp("", "output-*.avif")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp output file: %v", err)
	}
	tempOutput.Close()
	outputPath := tempOutput.Name()
	defer os.Remove(outputPath)

	// Handle different source formats
	var cmd *exec.Cmd

	// Check if lossless mode should be used
	useLossless := shouldUseLossless(imgFormat.Format)

	// Speed in AVIF is opposite scale from our effort (0=fast, 10=slow)
	avifSpeed := 10 - effort

	// Build base command with speed parameter
	args := []string{
		"-s", fmt.Sprintf("%d", avifSpeed),
		"--jobs", fmt.Sprintf("%d", threads),
	}

	// Add lossless flag or quality parameter (they can't be used together)
	if useLossless {
		log.Printf("Using avifenc with lossless flag for %s conversion", imgFormat.Format)
		args = append(args, "--lossless")
	} else {
		args = append(args, "-q", quality)
	}

	// Add input and output files
	args = append(args, inputPath, outputPath)
	cmd = exec.Command("avifenc", args...)

	// Log the command for debugging
	log.Printf("Running: %s", cmd.String())

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("AVIF conversion failed: %v\nOutput: %s", err, string(output))
		return nil, fmt.Errorf("avif conversion failed: %v", err)
	}

	// Read the output file
	result, err := os.ReadFile(outputPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read AVIF output file: %v", err)
	}

	log.Printf("AVIF conversion successful, output size: %d bytes, compression ratio: %.2f%%",
		len(result), float64(len(result))*100/float64(len(data)))

	return result, nil
}

// getThreadCount returns the number of threads to use for conversion
func getThreadCount() int {
	// Default to 4 threads if not specified
	threads := 4

	// Check environment variable
	if t := os.Getenv("WORKER_THREADS"); t != "" {
		if tInt, err := strconv.Atoi(t); err == nil && tInt > 0 {
			threads = tInt
		} else {
			log.Printf("Invalid WORKER_THREADS value: %s, using default: 4", t)
		}
	}

	return threads
}
