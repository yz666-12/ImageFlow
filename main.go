package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	
	"./config"
	"./handlers"
)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	
	// 确保图片目录存在
	ensureDirectories(cfg)
	
	// 设置路由
	http.HandleFunc("/api/random", handlers.RandomImage(cfg))
	
	// 启动服务器
	log.Printf("Starting server on %s", cfg.ServerAddr)
	if err := http.ListenAndServe(cfg.ServerAddr, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
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
