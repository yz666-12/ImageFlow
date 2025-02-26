package handlers

import (
	"encoding/json"
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
			http.ServeFile(w, r, "static/index.html")
			return
		}

		// 解析表单
		err := r.ParseMultipartForm(100 << 20) // 100MB 最大内存
		if err != nil {
			http.Error(w, "无法解析表单", http.StatusBadRequest)
			return
		}

		// 获取上传的文件
		files := r.MultipartForm.File["images[]"] // 修改为 images[]
		if len(files) == 0 {
			http.Error(w, "没有上传文件", http.StatusBadRequest)
			return
		}

		results := make([]map[string]interface{}, 0)

		for _, fileHeader := range files {
			// 检查文件类型
			ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
			if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "只支持 JPG 和 PNG 格式",
				})
				continue
			}

			// 打开上传的文件
			file, err := fileHeader.Open()
			if err != nil {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "无法打开文件",
				})
				continue
			}
			defer file.Close()

			// 创建临时文件
			tempFile, err := os.CreateTemp("", "upload-*"+ext)
			if err != nil {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "无法创建临时文件",
				})
				continue
			}
			tempPath := tempFile.Name()
			defer os.Remove(tempPath)
			defer tempFile.Close()

			// 复制上传的文件到临时文件
			_, err = io.Copy(tempFile, file)
			if err != nil {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "无法保存文件",
				})
				continue
			}
			tempFile.Close()

			// 检测图片方向
			orientation, err := detectOrientation(tempPath)
			if err != nil {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "无法检测图片方向",
				})
				continue
			}

			// 确定目标目录
			targetDir := filepath.Join(cfg.ImageBasePath, orientation)

			// 生成规范的文件名
			timestamp := time.Now().Format("20060102_150405")
			randomPart := fmt.Sprintf("%04d", rand.Intn(10000))
			filename := fmt.Sprintf("%s_%s%s", timestamp, randomPart, ext)
			targetPath := filepath.Join(targetDir, filename)

			// 确保目标目录存在
			if err := os.MkdirAll(targetDir, 0755); err != nil {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "无法创建目标目录",
				})
				continue
			}

			// 复制文件到目标位置
			if err := copyFile(tempPath, targetPath); err != nil {
				results = append(results, map[string]interface{}{
					"filename": fileHeader.Filename,
					"status":   "error",
					"message":  "无法保存到目标位置",
				})
				continue
			}

			// 异步转换为 WebP 和 AVIF
			go convertImage(targetPath, targetDir, cfg)

			// 添加成功结果
			results = append(results, map[string]interface{}{
				"filename":    fileHeader.Filename,
				"status":      "success",
				"message":     "上传成功",
				"savedAs":     filename,
				"orientation": orientation,
			})
		}

		// 返回所有文件的处理结果
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"results": results,
		})
	}
}

// 添加辅助函数
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
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
