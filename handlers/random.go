package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Image format constants
const (
	FormatAVIF     = "avif"
	FormatWebP     = "webp"
	FormatOriginal = "original"
)

// getImageURL constructs the public URL for an image
func getImageURL(key string) string {
	storageType := os.Getenv("STORAGE_TYPE")
	if storageType == "local" {
		return fmt.Sprintf("/static/images/%s", key)
	}

	// For S3 storage
	customDomain := os.Getenv("CUSTOM_DOMAIN")
	if customDomain != "" {
		return fmt.Sprintf("%s/%s", strings.TrimSuffix(customDomain, "/"), key)
	}

	// Fallback to S3 endpoint
	s3Endpoint := os.Getenv("S3_ENDPOINT")
	bucket := os.Getenv("S3_BUCKET")
	return fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(s3Endpoint, "/"+bucket), bucket, key)
}

// detectBestFormat determines optimal image format based on Accept headers
func detectBestFormat(r *http.Request) string {
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "image/avif") {
		return FormatAVIF
	}
	if strings.Contains(accept, "image/webp") {
		return FormatWebP
	}
	return FormatOriginal
}

// determineOrientation selects orientation based on device type and request parameters
func determineOrientation(r *http.Request, deviceType string) string {
	orientation := r.URL.Query().Get("orientation")
	if orientation == "" {
		if deviceType == utils.DeviceMobile {
			return "portrait"
		} else {
			return "landscape"
		}
	}
	return orientation
}

// getContentType returns the appropriate Content-Type based on format and filename
func getContentType(format string, filename string) string {
	if format == FormatAVIF {
		return "image/avif"
	}
	if format == FormatWebP {
		return "image/webp"
	}

	// Determine content type based on file extension
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		return "image/jpeg"
	}
}

// setImageResponseHeaders sets standard HTTP headers for image responses
func setImageResponseHeaders(w http.ResponseWriter, contentType string) {
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Vary", "Accept, User-Agent")
}

// getFormattedImagePath constructs the path to an image with the given format
func getFormattedImagePath(format string, orientation string, filename string) string {
	switch format {
	case FormatAVIF:
		return fmt.Sprintf("%s/avif/%s.avif", orientation, filename)
	case FormatWebP:
		return fmt.Sprintf("%s/webp/%s.webp", orientation, filename)
	default:
		// Keep original format and path
		// Determine extension by checking if filename already has one
		extension := filepath.Ext(filename)
		if extension == "" {
			extension = ".jpg" // Default to jpg if no extension
		}
		return fmt.Sprintf("original/%s/%s%s", orientation, filename, extension)
	}
}

// RandomImageHandler serves random images from S3 storage
func RandomImageHandler(s3Client *s3.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		bucket := os.Getenv("S3_BUCKET")

		// Determine device type and orientation
		deviceType := utils.DetectDeviceType(r)
		orientation := determineOrientation(r, deviceType)

		// Build the prefix for original images directory
		prefix := fmt.Sprintf("original/%s/", orientation)

		// List objects in the directory
		output, err := s3Client.ListObjectsV2(context.Background(), &s3.ListObjectsV2Input{
			Bucket: &bucket,
			Prefix: aws.String(prefix),
		})

		if err != nil {
			log.Printf("Error listing objects: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Filter image files
		var imageObjects []string
		for _, obj := range output.Contents {
			if utils.IsImageFile(*obj.Key) {
				imageObjects = append(imageObjects, *obj.Key)
			}
		}

		if len(imageObjects) == 0 {
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// Select a random image
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		randomIndex := rng.Intn(len(imageObjects))
		originalKey := imageObjects[randomIndex]
		log.Printf("Selected random image: %s", originalKey)

		// Extract base filename without extension
		fileBaseName := filepath.Base(originalKey)
		filename := strings.TrimSuffix(fileBaseName, filepath.Ext(fileBaseName))

		// Determine best format for client
		bestFormat := detectBestFormat(r)

		// Preserve PNG format for transparency if original is PNG
		isPNG := strings.HasSuffix(strings.ToLower(originalKey), ".png")
		if isPNG && bestFormat == FormatOriginal {
			// Use original PNG
			imageKey := originalKey
			log.Printf("Serving original PNG: %s", imageKey)

			// Get image from S3
			data, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
				Bucket: &bucket,
				Key:    aws.String(imageKey),
			})

			if err != nil {
				log.Printf("Error getting image %s: %v", imageKey, err)
				http.Error(w, "Image not found", http.StatusNotFound)
				return
			}
			defer data.Body.Close()

			// Set response headers with PNG content type
			setImageResponseHeaders(w, "image/png")

			// Copy image data to response
			if _, err := io.Copy(w, data.Body); err != nil {
				log.Printf("Error sending image: %v", err)
				return
			}
			return
		}

		// Get image path
		imageKey := getFormattedImagePath(bestFormat, orientation, filename)
		log.Printf("Serving image format: %s, path: %s", bestFormat, imageKey)

		// Get image from S3
		data, err := s3Client.GetObject(r.Context(), &s3.GetObjectInput{
			Bucket: &bucket,
			Key:    aws.String(imageKey),
		})

		if err != nil {
			log.Printf("Error getting image %s: %v", imageKey, err)
			// Fall back to original format if specific format not available
			if bestFormat != FormatOriginal {
				log.Printf("Falling back to original image format")
				data, err = s3Client.GetObject(r.Context(), &s3.GetObjectInput{
					Bucket: &bucket,
					Key:    aws.String(originalKey),
				})

				if err != nil {
					log.Printf("Error getting original image: %v", err)
					http.Error(w, "Image not found", http.StatusNotFound)
					return
				}

				// Use original format
				bestFormat = FormatOriginal
				imageKey = originalKey
			} else {
				http.Error(w, "Image not found", http.StatusNotFound)
				return
			}
		}
		defer data.Body.Close()

		// Set response headers
		contentType := getContentType(bestFormat, imageKey)
		setImageResponseHeaders(w, contentType)

		// Copy image data to response
		if _, err := io.Copy(w, data.Body); err != nil {
			log.Printf("Error sending image: %v", err)
			return
		}
	}
}

// LocalRandomImageHandler serves random images from local storage
func LocalRandomImageHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get local storage path
		localPath := os.Getenv("LOCAL_STORAGE_PATH")

		// Determine device type and orientation
		deviceType := utils.DetectDeviceType(r)
		orientation := determineOrientation(r, deviceType)

		// Build the original images directory path
		originalDir := filepath.Join(localPath, "original", orientation)

		// Read all files in the directory
		files, err := os.ReadDir(originalDir)
		if err != nil {
			log.Printf("Error reading directory %s: %v", originalDir, err)
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// Filter image files
		var imageFiles []string
		for _, file := range files {
			if !file.IsDir() && utils.IsImageFile(file.Name()) {
				imageFiles = append(imageFiles, file.Name())
			}
		}

		if len(imageFiles) == 0 {
			http.Error(w, "No images found", http.StatusNotFound)
			return
		}

		// Select a random image
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		randomImage := imageFiles[rng.Intn(len(imageFiles))]
		log.Printf("Selected random image: %s", randomImage)

		// Extract base filename without extension
		filename := strings.TrimSuffix(randomImage, filepath.Ext(randomImage))

		// Determine best format for client
		bestFormat := detectBestFormat(r)

		// Preserve PNG format for transparency if original is PNG
		isPNG := strings.HasSuffix(strings.ToLower(randomImage), ".png")
		if isPNG && bestFormat == FormatOriginal {
			// Use original PNG
			imagePath := filepath.Join(localPath, "original", orientation, randomImage)
			log.Printf("Serving original PNG: %s", imagePath)

			// Read image file
			imageData, err := os.ReadFile(imagePath)
			if err != nil {
				log.Printf("Error reading image %s: %v", imagePath, err)
				http.Error(w, "Image not found", http.StatusNotFound)
				return
			}

			// Set response headers with PNG content type
			setImageResponseHeaders(w, "image/png")

			// Send image data
			if _, err := w.Write(imageData); err != nil {
				log.Printf("Error sending image: %v", err)
				return
			}
			return
		}

		// Determine image path
		var imagePath string
		switch bestFormat {
		case FormatAVIF:
			imagePath = filepath.Join(localPath, orientation, "avif", filename+".avif")
		case FormatWebP:
			imagePath = filepath.Join(localPath, orientation, "webp", filename+".webp")
		default:
			imagePath = filepath.Join(localPath, "original", orientation, randomImage)
		}

		log.Printf("Serving image format: %s, path: %s", bestFormat, imagePath)

		// Check if file exists
		if _, err := os.Stat(imagePath); os.IsNotExist(err) && bestFormat != FormatOriginal {
			// Fall back to original format if converted format doesn't exist
			log.Printf("Converted format not found, falling back to original")
			imagePath = filepath.Join(localPath, "original", orientation, randomImage)
			bestFormat = FormatOriginal
		}

		// Read image file
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			log.Printf("Error reading image %s: %v", imagePath, err)
			http.Error(w, "Image not found", http.StatusNotFound)
			return
		}

		// Set response headers
		contentType := getContentType(bestFormat, imagePath)
		setImageResponseHeaders(w, contentType)

		// Send image data
		if _, err := w.Write(imageData); err != nil {
			log.Printf("Error sending image: %v", err)
			return
		}
	}
}
