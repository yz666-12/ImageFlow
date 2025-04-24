package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Yuri-NagaSaki/ImageFlow/config"
	"github.com/Yuri-NagaSaki/ImageFlow/utils/errors"
	"github.com/Yuri-NagaSaki/ImageFlow/utils/logger"
	"go.uber.org/zap"
)

// ConfigHandler returns a handler function that exposes selected configuration values to clients
func ConfigHandler(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			errors.HandleError(w, errors.ErrInvalidParam, "方法不允许", nil)
			logger.Warn("非法的请求方法",
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.String("remote_addr", r.RemoteAddr))
			return
		}

		// Get client-safe configuration
		clientConfig := cfg.GetClientConfig()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(clientConfig); err != nil {
			logger.Error("编码配置响应失败",
				zap.Error(err),
				zap.String("remote_addr", r.RemoteAddr))
			errors.HandleError(w, errors.ErrInternal, "服务器内部错误", nil)
			return
		}

		logger.Debug("配置请求成功",
			zap.String("remote_addr", r.RemoteAddr),
			zap.Any("config", clientConfig))
	}
}
