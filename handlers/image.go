package handlers

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
)

// RandomImage 处理随机图片请求
func RandomImage(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 检测设备类型
		deviceType := utils.DetectDevice(r)

		// 检测浏览器是否支持AVIF
		avifSupport := cfg.AvifSupport
		if accept := r.Header.Get("Accept"); !strings.Contains(accept, "image/avif") {
			avifSupport = false
		}

		// 获取随机图片
		imagePath, err := utils.GetRandomImage(cfg.ImageBasePath, deviceType, avifSupport)
		if err != nil {
			http.Error(w, "Failed to get random image", http.StatusInternalServerError)
			return
		}

		// 设置适当的Content-Type
		ext := filepath.Ext(imagePath)
		switch ext {
		case ".webp":
			w.Header().Set("Content-Type", "image/webp")
		case ".avif":
			w.Header().Set("Content-Type", "image/avif")
		default:
			w.Header().Set("Content-Type", "image/jpeg")
		}
		http.ServeFile(w, r, imagePath)
	}
}
