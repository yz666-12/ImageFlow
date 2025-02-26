package config

import (
	"encoding/json"
	"os"
)

// Config 存储应用配置
type Config struct {
	ServerAddr    string `json:"server_addr"`
	ImageBasePath string `json:"image_base_path"`
	AvifSupport   bool   `json:"avif_support"`
}

// Load 从配置文件加载配置
func Load() (*Config, error) {
	// 默认配置
	cfg := &Config{
		ServerAddr:    "0.0.0.0:8686",
		ImageBasePath: "./static",
		AvifSupport:   true,
	}
	
	// 如果配置文件存在，从文件加载
	if _, err := os.Stat("config.json"); err == nil {
		file, err := os.Open("config.json")
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
