package errors

import (
	"encoding/json"
	"net/http"
)

type ErrorCode int

const (
	ErrInternal     ErrorCode = 1000 // 内部错误
	ErrInvalidParam ErrorCode = 1001 // 参数错误
	ErrUnauthorized ErrorCode = 1002 // 未授权
	ErrForbidden    ErrorCode = 1003 // 禁止访问
	ErrNotFound     ErrorCode = 1004 // 资源不存在

	ErrImageProcess ErrorCode = 2000 // 图片处理错误
	ErrImageUpload  ErrorCode = 2001 // 图片上传错误
	ErrImageDelete  ErrorCode = 2002 // 图片删除错误
	ErrImageList    ErrorCode = 2003 // 图片列表获取错误
	ErrMetadata     ErrorCode = 2004 // 元数据操作错误
)

type ErrorResponse struct {
	Code    ErrorCode   `json:"code"`              // 错误码
	Message string      `json:"message"`           // 错误信息
	Details interface{} `json:"details,omitempty"` // 错误详情
}

func (code ErrorCode) HTTPError() int {
	switch code {
	case ErrInvalidParam:
		return http.StatusBadRequest
	case ErrUnauthorized:
		return http.StatusUnauthorized
	case ErrForbidden:
		return http.StatusForbidden
	case ErrNotFound:
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}

func NewError(code ErrorCode, message string, details interface{}) *ErrorResponse {
	return &ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	}
}

func WriteError(w http.ResponseWriter, err *ErrorResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.Code.HTTPError())
	json.NewEncoder(w).Encode(err)
}

func HandleError(w http.ResponseWriter, code ErrorCode, message string, details interface{}) {
	err := NewError(code, message, details)
	WriteError(w, err)
}

var (
	ErrInvalidAPIKey = NewError(ErrUnauthorized, "无效的API密钥", nil)
	ErrNoPermission  = NewError(ErrForbidden, "没有权限访问", nil)
	ErrServerError   = NewError(ErrInternal, "服务器内部错误", nil)
)
