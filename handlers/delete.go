package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

// DeleteRequest represents the request body for deleting an image
type DeleteRequest struct {
	ID          string `json:"id"`
	StorageType string `json:"storageType"`
}

// DeleteResponse represents the response after deleting an image
type DeleteResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// DeleteImageHandler returns a handler for deleting images
func DeleteImageHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only accept POST method
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body
		var req DeleteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Check if ID is provided
		if req.ID == "" {
			http.Error(w, "Image ID is required", http.StatusBadRequest)
			return
		}

		var success bool
		var message string

		// Delete based on storage type
		if req.StorageType == "s3" {
			success, message = deleteS3Images(req.ID)
		} else {
			success, message = deleteLocalImages(req.ID, cfg.ImageBasePath)
		}

		// Prepare and send response
		resp := DeleteResponse{
			Success: success,
			Message: message,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}

// deleteLocalImages deletes all formats of an image from local storage
func deleteLocalImages(id string, basePath string) (bool, string) {
	// 需要删除的所有格式和方向
	formats := []string{"original", "webp", "avif"}
	orientations := []string{"landscape", "portrait"}

	deletedCount := 0
	errorCount := 0
	var lastError error

	// 查找所有匹配的图片文件并删除
	for _, format := range formats {
		for _, orientation := range orientations {
			var path string
			if format == "original" {
				path = filepath.Join(basePath, format, orientation)
			} else {
				path = filepath.Join(basePath, orientation, format)
			}

			// 查找匹配的文件
			files, err := filepath.Glob(filepath.Join(path, id+".*"))
			if err != nil {
				log.Printf("Error finding files for %s in %s: %v", id, path, err)
				errorCount++
				lastError = err
				continue
			}

			// 删除找到的每个文件
			for _, file := range files {
				err := os.Remove(file)
				if err != nil {
					log.Printf("Error deleting file %s: %v", file, err)
					errorCount++
					lastError = err
				} else {
					log.Printf("Successfully deleted file: %s", file)
					deletedCount++
				}
			}
		}
	}

	// 判断操作结果
	if errorCount > 0 {
		return false, fmt.Sprintf("删除部分失败，成功删除 %d 个文件，失败 %d 个: %v", deletedCount, errorCount, lastError)
	}

	if deletedCount == 0 {
		return false, "未找到匹配的图片文件"
	}

	return true, fmt.Sprintf("成功删除了 %d 个相关文件", deletedCount)
}

// deleteS3Images deletes all formats of an image from S3 storage
func deleteS3Images(id string) (bool, string) {
	// 获取S3配置
	bucket := os.Getenv("S3_BUCKET")
	if bucket == "" {
		return false, "S3 bucket not configured"
	}

	// 检查S3客户端是否初始化
	if utils.S3Client == nil {
		return false, "S3 client not initialized"
	}

	// 需要删除的所有格式和方向
	formats := []string{"original", "webp", "avif"}
	orientations := []string{"landscape", "portrait"}

	// 构建要删除的对象列表
	var objectsToDelete []types.ObjectIdentifier
	var deletedPathsForLogging []string

	// 创建上下文
	ctx := context.Background()

	// 查找匹配的对象
	for _, format := range formats {
		for _, orientation := range orientations {
			var prefix string
			if format == "original" {
				prefix = fmt.Sprintf("%s/%s/%s", format, orientation, id)
			} else {
				prefix = fmt.Sprintf("%s/%s/%s", orientation, format, id)
			}

			// 列出匹配前缀的对象
			paginator := s3.NewListObjectsV2Paginator(utils.S3Client, &s3.ListObjectsV2Input{
				Bucket: aws.String(bucket),
				Prefix: aws.String(prefix),
			})

			for paginator.HasMorePages() {
				output, err := paginator.NextPage(ctx)
				if err != nil {
					log.Printf("Error listing S3 objects with prefix %s: %v", prefix, err)
					continue
				}

				for _, obj := range output.Contents {
					key := *obj.Key
					// 检查文件名是否以ID开头
					baseName := filepath.Base(key)
					if strings.HasPrefix(baseName, id+".") {
						objectsToDelete = append(objectsToDelete, types.ObjectIdentifier{
							Key: aws.String(key),
						})
						deletedPathsForLogging = append(deletedPathsForLogging, key)
					}
				}
			}
		}
	}

	// 如果没有找到匹配的对象
	if len(objectsToDelete) == 0 {
		return false, "未找到匹配的图片文件"
	}

	// 批量删除对象
	_, err := utils.S3Client.DeleteObjects(ctx, &s3.DeleteObjectsInput{
		Bucket: aws.String(bucket),
		Delete: &types.Delete{
			Objects: objectsToDelete,
			Quiet:   aws.Bool(false),
		},
	})

	if err != nil {
		log.Printf("Error deleting S3 objects: %v", err)
		return false, fmt.Sprintf("删除失败: %v", err)
	}

	// 记录删除的文件
	for _, path := range deletedPathsForLogging {
		log.Printf("Successfully deleted file from S3: %s", path)
	}

	return true, fmt.Sprintf("成功删除了 %d 个相关文件", len(objectsToDelete))
}
