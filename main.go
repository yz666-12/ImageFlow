package main

import (
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

	// 只在使用S3存储时初始化S3客户端
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

	// 确保图片目录存在
	ensureDirectories(cfg)

	// 设置MIME类型
	configureMIMETypes()

	// Create routes
	http.HandleFunc("/validate-api-key", handlers.ValidateAPIKey(cfg))
	http.HandleFunc("/upload", handlers.RequireAPIKey(cfg, handlers.UploadHandler(cfg)))
	http.HandleFunc("/api/images", handlers.RequireAPIKey(cfg, handlers.ListImagesHandler(cfg)))
	http.HandleFunc("/api/delete-image", handlers.RequireAPIKey(cfg, handlers.DeleteImageHandler(cfg)))
	http.HandleFunc("/api/config", handlers.RequireAPIKey(cfg, handlers.ConfigHandler(cfg)))

	// 根据存储类型使用不同的随机图片处理器
	if storageType == "s3" {
		http.HandleFunc("/api/random", handlers.RandomImageHandler(utils.S3Client))
	} else {
		http.HandleFunc("/api/random", handlers.LocalRandomImageHandler())
		// 本地图片服务
		localPath := os.Getenv("LOCAL_STORAGE_PATH")
		if !filepath.IsAbs(localPath) {
			localPath = filepath.Join(".", localPath)
		}
		http.Handle("/images/", http.StripPrefix("/images/", http.FileServer(http.Dir(localPath))))
	}

	// 提供静态文件（包括图片、CSS、JS等）
	fs := http.FileServer(http.Dir("static"))

	// Next.js 静态资源
	http.Handle("/_next/", http.StripPrefix("/_next/", http.FileServer(http.Dir("static/_next"))))

	// 静态资源
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// 图标文件
	faviconServer := http.FileServer(http.Dir("favicon"))
	http.Handle("/favicon-16.png", faviconServer)
	http.Handle("/favicon-32.png", faviconServer)
	http.Handle("/favicon.ico", faviconServer)

	http.HandleFunc("/index.txt", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/index.txt")
	})
	http.HandleFunc("/manage.txt", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/manage.txt")
	})

	// 提供上传页面与管理页面
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
	log.Printf("Starting server on 0.0.0.0:8686 with %s storage", storageType)
	if err := http.ListenAndServe("0.0.0.0:8686", nil); err != nil {
		log.Fatal(err)
	}
}

// 配置MIME类型
func configureMIMETypes() {
	// 设置常见的MIME类型
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

func ensureDirectories(cfg *config.Config) {
	dirs := []string{
		filepath.Join(cfg.ImageBasePath, "original", "landscape"),
		filepath.Join(cfg.ImageBasePath, "original", "portrait"),
		filepath.Join(cfg.ImageBasePath, "landscape", "webp"),
		filepath.Join(cfg.ImageBasePath, "landscape", "avif"),
		filepath.Join(cfg.ImageBasePath, "portrait", "webp"),
		filepath.Join(cfg.ImageBasePath, "portrait", "avif"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("Warning: Failed to create directory %s: %v", dir, err)
		} else {
			log.Printf("Created directory: %s", dir)
		}
	}
}
