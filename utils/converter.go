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

	// Detect the image format
	imgFormat, err := DetectImageFormat(data)
	if err != nil {
		log.Printf("Failed to detect image format: %v", err)
		return nil, fmt.Errorf("failed to detect image format: %v", err)
	}
	
	log.Printf("Detected image format: %s", imgFormat.Format)

	// Create temporary input file with appropriate extension
	tempInput, err := ioutil.TempFile("", fmt.Sprintf("input-*%s", imgFormat.Extension))
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

	// Convert to WebP with appropriate flags based on format
	var cmd *exec.Cmd
	if imgFormat.Format == "gif" {
		// Special handling for GIF files (including animated GIFs)
		log.Printf("Using special handling for GIF format")
		cmd = exec.Command("gif2webp", "-q", quality, "-lossy", tempInput.Name(), "-o", tempOutput.Name())
	} else {
		// Standard conversion for other formats (JPEG, PNG)
		cmd = exec.Command("cwebp", "-q", quality, tempInput.Name(), "-o", tempOutput.Name())
	}
	
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

	// Detect the image format
	imgFormat, err := DetectImageFormat(data)
	if err != nil {
		log.Printf("Failed to detect image format: %v", err)
		return nil, fmt.Errorf("failed to detect image format: %v", err)
	}
	
	log.Printf("Detected image format for AVIF conversion: %s", imgFormat.Format)

	// Create temporary input file with appropriate extension
	tempInput, err := ioutil.TempFile("", fmt.Sprintf("input-*%s", imgFormat.Extension))
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

	// Convert to AVIF with appropriate handling based on format
	var cmd *exec.Cmd
	if imgFormat.Format == "gif" {
		// For GIF files, we need to extract the first frame for AVIF
		// Extract first frame to a temporary PNG file
		tempPng, err := ioutil.TempFile("", "gifframe-*.png")
		if err != nil {
			log.Printf("Failed to create temp PNG file: %v", err)
			return nil, fmt.Errorf("failed to create temp PNG file: %v", err)
		}
		defer os.Remove(tempPng.Name())
		defer tempPng.Close()
		
		// Extract first frame using convert (ImageMagick)
		convertCmd := exec.Command("convert", tempInput.Name()+"[0]", tempPng.Name())
		convertOutput, err := convertCmd.CombinedOutput()
		if err != nil {
			log.Printf("GIF frame extraction failed: %v\nOutput: %s", err, string(convertOutput))
			return nil, fmt.Errorf("gif frame extraction failed: %v", err)
		}
		
		// Now convert the PNG to AVIF
		cmd = exec.Command("avifenc", "-q", quality, tempPng.Name(), tempOutput.Name())
	} else {
		// Standard conversion for other formats
		cmd = exec.Command("avifenc", "-q", quality, tempInput.Name(), tempOutput.Name())
	}
	
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
