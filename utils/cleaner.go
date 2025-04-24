package utils

import (
	"context"
	"log"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

// ImageCleaner is responsible for cleaning up expired images
type ImageCleaner struct {
	interval time.Duration
	ctx      context.Context
	cancel   context.CancelFunc
}

// NewImageCleaner creates a new image cleaner
func NewImageCleaner(cfg *config.Config) *ImageCleaner {
	ctx, cancel := context.WithCancel(context.Background())

	return &ImageCleaner{
		interval: time.Duration(cfg.CleanupInterval) * time.Minute,
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Start begins the periodic cleanup task
func (ic *ImageCleaner) Start() {
	log.Printf("Starting image cleaner with interval: %v", ic.interval)

	// Run cleanup immediately
	go ic.cleanExpiredImages()

	// Set up ticker for periodic cleanup
	ticker := time.NewTicker(ic.interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				ic.cleanExpiredImages()
			case <-ic.ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
}

// Stop terminates the cleanup task
func (ic *ImageCleaner) Stop() {
	ic.cancel()
	log.Println("Image cleaner stopped")
}

// cleanExpiredImages removes all expired images
func (ic *ImageCleaner) cleanExpiredImages() {
	ctx := context.Background()
	expiredImages, err := MetadataManager.ListExpiredImages(ctx)
	if err != nil {
		log.Printf("Error listing expired images: %v", err)
		return
	}

	if len(expiredImages) == 0 {
		return
	}

	log.Printf("Found %d expired images to clean up", len(expiredImages))

	for _, metadata := range expiredImages {
		log.Printf("Cleaning up expired image: %s (expired at: %v)", metadata.ID, metadata.ExpiryTime)

		// Delete original image
		if metadata.Paths.Original != "" {
			if err := Storage.Delete(ctx, metadata.Paths.Original); err != nil {
				log.Printf("Error deleting original image %s: %v", metadata.Paths.Original, err)
			} else {
				log.Printf("Deleted original image: %s", metadata.Paths.Original)
			}
		}

		// Delete WebP format
		if metadata.Paths.WebP != "" {
			if err := Storage.Delete(ctx, metadata.Paths.WebP); err != nil {
				log.Printf("Error deleting WebP image %s: %v", metadata.Paths.WebP, err)
			} else {
				log.Printf("Deleted WebP image: %s", metadata.Paths.WebP)
			}
		}

		// Delete AVIF format
		if metadata.Paths.AVIF != "" {
			if err := Storage.Delete(ctx, metadata.Paths.AVIF); err != nil {
				log.Printf("Error deleting AVIF image %s: %v", metadata.Paths.AVIF, err)
			} else {
				log.Printf("Deleted AVIF image: %s", metadata.Paths.AVIF)
			}
		}

		// Delete metadata
		if err := MetadataManager.DeleteMetadata(ctx, metadata.ID); err != nil {
			log.Printf("Error deleting metadata for %s: %v", metadata.ID, err)
		} else {
			log.Printf("Deleted metadata for image: %s", metadata.ID)
		}
	}

	log.Printf("Completed cleanup of %d expired images", len(expiredImages))
}

// Global cleaner instance
var Cleaner *ImageCleaner

// InitCleaner initializes and starts the image cleaner
func InitCleaner(cfg *config.Config) {
	Cleaner = NewImageCleaner(cfg)
	Cleaner.Start()
}

// TriggerCleanup manually triggers the cleanup process
func TriggerCleanup() {
	if Cleaner != nil {
		log.Println("Manually triggering cleanup process...")
		go Cleaner.cleanExpiredImages()
	} else {
		log.Println("Cleaner not initialized, cannot trigger cleanup")
	}
}
