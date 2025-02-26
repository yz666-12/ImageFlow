package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
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

func main() {
	flag.Parse()
	
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
				cmd = exec.Command("avifenc", "--min", "0", "--max", "63", "-a", "end-usage=q", "-a", fmt.Sprintf("cq-level=%d", *quality), file, outFile)
			}
			
			if err := cmd.Run(); err != nil {
				log.Printf("转换失败 %s: %v", file, err)
				return
			}
			
			fmt.Printf("已转换: %s -> %s\n", file, outFile)
		}(file)
	}
	
	wg.Wait()
	fmt.Println("转换完成!")
} 
