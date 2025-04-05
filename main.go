package main

import (
	"encoding/json"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/handlers"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	// Initialize configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize S3 client only when using S3 storage
	storageType := os.Getenv("STORAGE_TYPE")
	if storageType == "s3" {
		if err := utils.InitS3Client(); err != nil {
			log.Fatalf("Failed to initialize S3 client: %v", err)
		}
	}

	// Initialize storage provider
	if err := utils.InitStorage(); err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}

	// Initialize metadata store
	if err := utils.InitMetadataStore(); err != nil {
		log.Fatalf("Failed to initialize metadata store: %v", err)
	}

	// Ensure image directories exist
	ensureDirectories(cfg)

	// Initialize and start image cleaner
	utils.InitCleaner()
	log.Printf("Image cleaner started")

	// Configure MIME types
	configureMIMETypes()

	// Create routes
	http.HandleFunc("/api/validate-api-key", handlers.ValidateAPIKey(cfg))
	http.HandleFunc("/api/upload", handlers.RequireAPIKey(cfg, handlers.UploadHandler(cfg)))
	http.HandleFunc("/api/images", handlers.RequireAPIKey(cfg, handlers.ListImagesHandler(cfg)))
	http.HandleFunc("/api/delete-image", handlers.RequireAPIKey(cfg, handlers.DeleteImageHandler(cfg)))
	http.HandleFunc("/api/config", handlers.RequireAPIKey(cfg, handlers.ConfigHandler(cfg)))

	// Add cleanup trigger endpoint
	http.HandleFunc("/api/trigger-cleanup", handlers.RequireAPIKey(cfg, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		utils.TriggerCleanup()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"message": "Cleanup process triggered",
		})
	}))

	// Use appropriate random image handler based on storage type
	if storageType == "s3" {
		http.HandleFunc("/api/random", handlers.RandomImageHandler(utils.S3Client))
	} else {
		http.HandleFunc("/api/random", handlers.LocalRandomImageHandler())
		// Serve local images
		localPath := os.Getenv("LOCAL_STORAGE_PATH")
		if !filepath.IsAbs(localPath) {
			localPath = filepath.Join(".", localPath)
		}
		http.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir(localPath))))
	}

	// Serve static files
	fs := http.FileServer(http.Dir("static"))

	// Next.js static assets
	http.Handle("/_next/", http.StripPrefix("/_next/", http.FileServer(http.Dir("static/_next"))))

	// Static assets
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Favicon files
	faviconServer := http.FileServer(http.Dir("favicon"))
	http.Handle("/favicon-16.png", faviconServer)
	http.Handle("/favicon-32.png", faviconServer)
	http.Handle("/favicon.ico", faviconServer)

	// Text files
	http.HandleFunc("/index.txt", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.txt")
	})
	http.HandleFunc("/manage.txt", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/manage.txt")
	})

	// Serve upload and management pages
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/":
			http.ServeFile(w, r, "static/index.html")
		case "/manage":
			http.ServeFile(w, r, "static/manage.html")
		default:
			filePath := filepath.Join("static", r.URL.Path)
			if !filepath.IsAbs(filePath) {
				http.NotFound(w, r)
				return
			}
			if _, err := os.Stat(filePath); err == nil {
				http.ServeFile(w, r, filePath)
			} else {
				http.NotFound(w, r)
			}
		}
	})

	// Start server
	log.Printf("Starting server on %s with %s storage", cfg.ServerAddr, storageType)
	if err := http.ListenAndServe(cfg.ServerAddr, nil); err != nil {
		log.Fatal(err)
	}
}

// configureMIMETypes registers common MIME types
func configureMIMETypes() {
	// Register common MIME types
	mime.AddExtensionType(".css", "text/css")
	mime.AddExtensionType(".js", "application/javascript")
	mime.AddExtensionType(".svg", "image/svg+xml")
	mime.AddExtensionType(".ico", "image/x-icon")
	mime.AddExtensionType(".png", "image/png")
	mime.AddExtensionType(".jpg", "image/jpeg")
	mime.AddExtensionType(".jpeg", "image/jpeg")
	mime.AddExtensionType(".webp", "image/webp")
	mime.AddExtensionType(".avif", "image/avif")
}

// ensureDirectories creates necessary directory structure for images
func ensureDirectories(cfg *config.Config) {
	dirs := []string{
		filepath.Join(cfg.ImageBasePath, "original", "landscape"),
		filepath.Join(cfg.ImageBasePath, "original", "portrait"),
		filepath.Join(cfg.ImageBasePath, "landscape", "webp"),
		filepath.Join(cfg.ImageBasePath, "landscape", "avif"),
		filepath.Join(cfg.ImageBasePath, "portrait", "webp"),
		filepath.Join(cfg.ImageBasePath, "portrait", "avif"),
		filepath.Join(cfg.ImageBasePath, "gif"),      // Directory for GIF files
		filepath.Join(cfg.ImageBasePath, "metadata"), // Directory for image metadata
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("Warning: Failed to create directory %s: %v", dir, err)
		} else {
			log.Printf("Created directory: %s", dir)
		}
	}
}
