package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
)

var (
	sourcePath = flag.String("source", "", "源图片目录")
	targetPath = flag.String("target", "", "目标图片目录")
	format     = flag.String("format", "webp", "转换格式 (webp 或 avif)")
	quality    = flag.Int("quality", 80, "图片质量 (1-100)")
	workers    = flag.Int("workers", 4, "并行工作线程数")
)

// 从环境变量读取配置值
func getEnvOrDefault(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}

	intVal, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}

	return intVal
}

func main() {
	flag.Parse()

	// 检查环境变量中是否有质量和线程数的设置
	envQuality := getEnvOrDefault("IMAGE_QUALITY", -1)
	if envQuality > 0 {
		*quality = envQuality
		fmt.Printf("使用环境变量设置的质量: %d\n", *quality)
	}

	envWorkers := getEnvOrDefault("WORKER_THREADS", -1)
	if envWorkers > 0 {
		*workers = envWorkers
		fmt.Printf("使用环境变量设置的线程数: %d\n", *workers)
	}

	if *sourcePath == "" || *targetPath == "" {
		log.Fatal("必须指定源目录和目标目录")
	}

	if *format != "webp" && *format != "avif" {
		log.Fatal("格式必须是 webp 或 avif")
	}

	// 确保目标目录存在
	if err := os.MkdirAll(*targetPath, 0755); err != nil {
		log.Fatalf("创建目标目录失败: %v", err)
	}

	// 获取所有图片文件
	var files []string
	err := filepath.Walk(*sourcePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			ext := strings.ToLower(filepath.Ext(path))
			if ext == ".jpg" || ext == ".jpeg" || ext == ".png" {
				files = append(files, path)
			}
		}
		return nil
	})

	if err != nil {
		log.Fatalf("扫描源目录失败: %v", err)
	}

	fmt.Printf("找到 %d 个图片文件\n", len(files))

	// 使用工作池并行处理图片
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, *workers)

	for _, file := range files {
		wg.Add(1)
		semaphore <- struct{}{}

		go func(file string) {
			defer wg.Done()
			defer func() { <-semaphore }()

			// 确定输出文件名
			relPath, err := filepath.Rel(*sourcePath, file)
			if err != nil {
				log.Printf("计算相对路径失败 %s: %v", file, err)
				return
			}

			outFile := filepath.Join(*targetPath, strings.TrimSuffix(relPath, filepath.Ext(relPath))+"."+*format)
			outDir := filepath.Dir(outFile)

			if err := os.MkdirAll(outDir, 0755); err != nil {
				log.Printf("创建输出目录失败 %s: %v", outDir, err)
				return
			}

			// 转换图片
			var cmd *exec.Cmd
			if *format == "webp" {
				cmd = exec.Command("cwebp", "-q", fmt.Sprintf("%d", *quality), file, "-o", outFile)
			} else {
				cmd = exec.Command("avifenc", "-q", fmt.Sprintf("%d", *quality), file, outFile)
			}

			// 捕获命令输出以便调试
			output, err := cmd.CombinedOutput()
			if err != nil {
				log.Printf("转换失败 %s: %v\n输出: %s", file, err, string(output))
				return
			}

			fmt.Printf("已转换: %s -> %s\n", file, outFile)
		}(file)
	}

	wg.Wait()
	fmt.Println("转换完成!")
}
