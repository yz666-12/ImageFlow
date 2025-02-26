package main

import (
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/handlers"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 确保图片目录存在
	ensureDirectories(cfg)

	// 设置MIME类型
	configureMIMETypes()

	// 设置路由
	http.HandleFunc("/api/random", handlers.RandomImage(cfg))
	http.HandleFunc("/validate-api-key", handlers.ValidateAPIKey(cfg))
	http.HandleFunc("/upload", handlers.RequireAPIKey(cfg, handlers.UploadHandler(cfg)))

	// 提供静态文件
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// 提供上传页面
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "static/index.html")
			return
		}
		http.NotFound(w, r)
	})

	// 启动服务器
	log.Printf("Starting server on %s", cfg.ServerAddr)
	if err := http.ListenAndServe(cfg.ServerAddr, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
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
		filepath.Join(cfg.ImageBasePath, "landscape", "webp"),
		filepath.Join(cfg.ImageBasePath, "landscape", "avif"),
		filepath.Join(cfg.ImageBasePath, "portrait", "webp"),
		filepath.Join(cfg.ImageBasePath, "portrait", "avif"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Fatalf("Failed to create directory %s: %v", dir, err)
		}
	}
}
