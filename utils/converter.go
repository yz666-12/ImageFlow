package utils

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
)

// ConvertToWebP converts image data to WebP format
func ConvertToWebP(data []byte) ([]byte, error) {
	// Get quality from environment variable or use default
	quality := "80"
	if q := os.Getenv("IMAGE_QUALITY"); q != "" {
		quality = q
	}
	log.Printf("Starting WebP conversion, input size: %d bytes", len(data))

	// Create temporary input file
	tempInput, err := ioutil.TempFile("", "input-*.jpg")
	if err != nil {
		log.Printf("Failed to create temp input file: %v", err)
		return nil, fmt.Errorf("failed to create temp input file: %v", err)
	}
	defer os.Remove(tempInput.Name())
	defer tempInput.Close()

	// Write input data
	if _, err := tempInput.Write(data); err != nil {
		log.Printf("Failed to write temp input file: %v", err)
		return nil, fmt.Errorf("failed to write temp input file: %v", err)
	}
	tempInput.Close()

	// Create temporary output file
	tempOutput, err := ioutil.TempFile("", "output-*.webp")
	if err != nil {
		log.Printf("Failed to create temp output file: %v", err)
		return nil, fmt.Errorf("failed to create temp output file: %v", err)
	}
	defer os.Remove(tempOutput.Name())
	defer tempOutput.Close()

	// Convert to WebP
	cmd := exec.Command("cwebp", "-q", quality, tempInput.Name(), "-o", tempOutput.Name())
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("WebP conversion failed: %v\nOutput: %s", err, string(output))
		return nil, fmt.Errorf("webp conversion failed: %v", err)
	}

	// Read the output file
	result, err := ioutil.ReadFile(tempOutput.Name())
	if err != nil {
		log.Printf("Failed to read WebP output file: %v", err)
		return nil, err
	}

	log.Printf("WebP conversion successful, output size: %d bytes", len(result))
	return result, nil
}

// ConvertToAVIF converts image data to AVIF format
func ConvertToAVIF(data []byte) ([]byte, error) {
	// Get quality from environment variable or use default
	quality := "80"
	if q := os.Getenv("IMAGE_QUALITY"); q != "" {
		quality = q
	}
	log.Printf("Starting AVIF conversion, input size: %d bytes", len(data))

	// Create temporary input file
	tempInput, err := ioutil.TempFile("", "input-*.jpg")
	if err != nil {
		log.Printf("Failed to create temp input file: %v", err)
		return nil, fmt.Errorf("failed to create temp input file: %v", err)
	}
	defer os.Remove(tempInput.Name())
	defer tempInput.Close()

	// Write input data
	if _, err := tempInput.Write(data); err != nil {
		log.Printf("Failed to write temp input file: %v", err)
		return nil, fmt.Errorf("failed to write temp input file: %v", err)
	}
	tempInput.Close()

	// Create temporary output file
	tempOutput, err := ioutil.TempFile("", "output-*.avif")
	if err != nil {
		log.Printf("Failed to create temp output file: %v", err)
		return nil, fmt.Errorf("failed to create temp output file: %v", err)
	}
	defer os.Remove(tempOutput.Name())
	defer tempOutput.Close()

	// Convert to AVIF
	cmd := exec.Command("avifenc", "-q", quality, tempInput.Name(), tempOutput.Name())
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("AVIF conversion failed: %v\nOutput: %s", err, string(output))
		return nil, fmt.Errorf("avif conversion failed: %v", err)
	}

	// Read the output file
	result, err := ioutil.ReadFile(tempOutput.Name())
	if err != nil {
		log.Printf("Failed to read AVIF output file: %v", err)
		return nil, err
	}

	log.Printf("AVIF conversion successful, output size: %d bytes", len(result))
	return result, nil
}
