package handlers

import (
	"log"
	"net/http"
	"strings"
	
	"github.com/yourusername/random-image-api/config"
	"github.com/yourusername/random-image-api/utils"
)

// RandomImage 处理随机图片请求
func RandomImage(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 检测设备类型
		deviceType := utils.DetectDevice(r)
		
		// 检测是否支持AVIF
		avifSupport := cfg.AvifSupport && strings.Contains(r.Header.Get("Accept"), "image/avif")
		
		// 获取随机图片路径
		imagePath, err := utils.GetRandomImage(cfg.ImageBasePath, deviceType, avifSupport)
		if err != nil {
			log.Printf("Error getting random image: %v", err)
			http.Error(w, "Failed to get random image", http.StatusInternalServerError)
			return
		}
		
		// 设置适当的内容类型
		contentType := "image/webp"
		if avifSupport {
			contentType = "image/avif"
		}
		w.Header().Set("Content-Type", contentType)
		
		// 设置缓存控制
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		
		// 提供图片
		http.ServeFile(w, r, imagePath)
	}
} 
