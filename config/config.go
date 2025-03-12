package config

import (
	"encoding/json"
	"os"

	"github.com/joho/godotenv"
)

// Config 存储应用配置
type Config struct {
	ServerAddr    string `json:"server_addr"`
	ImageBasePath string `json:"image_base_path"`
	AvifSupport   bool   `json:"avif_support"`
	APIKey        string // 添加 API Key
}

// Load 从配置文件加载配置
func Load() (*Config, error) {
	// 默认配置
	cfg := &Config{
		ServerAddr:    "0.0.0.0:8080", // 修改为 8080 以匹配 Dockerfile
		ImageBasePath: "./static",
		AvifSupport:   true,
	}

	// 尝试加载 .env 文件，但不强制要求
	_ = godotenv.Load()

	// 从环境变量获取 API key
	cfg.APIKey = os.Getenv("API_KEY")

	// 如果配置文件存在，从文件加载其他配置
	if _, err := os.Stat("config/config.json"); err == nil {
		file, err := os.Open("config/config.json")
		if err != nil {
			return nil, err
		}
		defer file.Close()

		decoder := json.NewDecoder(file)
		if err := decoder.Decode(cfg); err != nil {
			return nil, err
		}
	}

	return cfg, nil
}
