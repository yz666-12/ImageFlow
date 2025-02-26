package handlers

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
)

func init() {
	// 初始化随机数生成器
	rand.Seed(time.Now().UnixNano())
}

// UploadHandler 处理图片上传
func UploadHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.ServeFile(w, r, "static/upload.html")
			return
		}

		// 解析表单
		err := r.ParseMultipartForm(32 << 20) // 32MB 最大内存
		if err != nil {
			http.Error(w, "无法解析表单", http.StatusBadRequest)
			return
		}

		// 获取上传的文件
		file, handler, err := r.FormFile("image")
		if err != nil {
			http.Error(w, "无法获取上传的文件", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// 检查文件类型
		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			http.Error(w, "只支持 JPG 和 PNG 格式", http.StatusBadRequest)
			return
		}

		// 创建临时文件
		tempFile, err := os.CreateTemp("", "upload-*"+ext)
		if err != nil {
			http.Error(w, "无法创建临时文件", http.StatusInternalServerError)
			return
		}
		defer os.Remove(tempFile.Name())
		defer tempFile.Close()

		// 复制上传的文件到临时文件
		_, err = io.Copy(tempFile, file)
		if err != nil {
			http.Error(w, "无法保存上传的文件", http.StatusInternalServerError)
			return
		}
		tempFile.Close() // 关闭文件以便后续读取

		// 检测图片方向
		orientation, err := detectOrientation(tempFile.Name())
		if err != nil {
			http.Error(w, "无法检测图片方向: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// 确定目标目录
		targetDir := filepath.Join(cfg.ImageBasePath, orientation)
		
		// 生成规范的文件名: 年月日_时分秒_随机数.扩展名
		timestamp := time.Now().Format("20060102_150405")
		randomPart := fmt.Sprintf("%04d", rand.Intn(10000)) // 添加4位随机数
		filename := fmt.Sprintf("%s_%s%s", timestamp, randomPart, ext)
		targetPath := filepath.Join(targetDir, filename)

		// 复制文件到目标目录
		srcFile, err := os.Open(tempFile.Name())
		if err != nil {
			http.Error(w, "无法打开临时文件", http.StatusInternalServerError)
			return
		}
		defer srcFile.Close()

		// 确保目标目录存在
		if err := os.MkdirAll(targetDir, 0755); err != nil {
			http.Error(w, "无法创建目标目录", http.StatusInternalServerError)
			return
		}

		dstFile, err := os.Create(targetPath)
		if err != nil {
			http.Error(w, "无法创建目标文件", http.StatusInternalServerError)
			return
		}
		defer dstFile.Close()

		_, err = io.Copy(dstFile, srcFile)
		if err != nil {
			http.Error(w, "无法保存文件到目标目录", http.StatusInternalServerError)
			return
		}

		// 异步转换为 WebP 和 AVIF
		go convertImage(targetPath, targetDir, cfg)

		// 返回成功消息
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"success","message":"图片上传成功","orientation":"%s","filename":"%s"}`, orientation, filename)
	}
}

// 检测图片方向
func detectOrientation(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return "", err
	}

	bounds := img.Bounds()
	width := bounds.Max.X - bounds.Min.X
	height := bounds.Max.Y - bounds.Min.Y

	if width > height {
		return "landscape", nil
	}
	return "portrait", nil
}

// 转换图片为 WebP 和 AVIF
func convertImage(sourcePath, baseDir string, cfg *config.Config) {
	var wg sync.WaitGroup
	wg.Add(2) // WebP 和 AVIF 两个任务

	// 获取文件名（不含扩展名）
	baseName := filepath.Base(sourcePath)
	baseName = strings.TrimSuffix(baseName, filepath.Ext(baseName))

	// 转换为 WebP
	go func() {
		defer wg.Done()
		webpDir := filepath.Join(baseDir, "webp")
		if err := os.MkdirAll(webpDir, 0755); err != nil {
			fmt.Printf("创建 WebP 目录失败: %v\n", err)
			return
		}

		webpPath := filepath.Join(webpDir, baseName+".webp")
		cmd := exec.Command("cwebp", "-q", "80", sourcePath, "-o", webpPath)
		output, err := cmd.CombinedOutput()
		if err != nil {
			fmt.Printf("WebP 转换失败: %v\n输出: %s\n", err, string(output))
			return
		}
		fmt.Printf("WebP 转换成功: %s\n", webpPath)
	}()

	// 转换为 AVIF
	go func() {
		defer wg.Done()
		avifDir := filepath.Join(baseDir, "avif")
		if err := os.MkdirAll(avifDir, 0755); err != nil {
			fmt.Printf("创建 AVIF 目录失败: %v\n", err)
			return
		}

		avifPath := filepath.Join(avifDir, baseName+".avif")
		cmd := exec.Command("avifenc", "-q", "80", sourcePath, avifPath)
		output, err := cmd.CombinedOutput()
		if err != nil {
			fmt.Printf("AVIF 转换失败: %v\n输出: %s\n", err, string(output))
			return
		}
		fmt.Printf("AVIF 转换成功: %s\n", avifPath)
	}()

	wg.Wait()
	fmt.Printf("图片 %s 转换完成\n", sourcePath)
} 
