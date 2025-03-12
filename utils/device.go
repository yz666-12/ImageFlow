package utils

import (
	"net/http"
	"regexp"
)

// DeviceType 表示设备类型
type DeviceType int

const (
	Desktop DeviceType = iota
	Mobile
)

var (
	mobileRegex = regexp.MustCompile(`(?i)(android|webos|iphone|ipad|ipod|blackberry|windows phone)`)
)

// DetectDevice 根据User-Agent检测设备类型
func DetectDevice(r *http.Request) DeviceType {
	userAgent := r.Header.Get("User-Agent")
	if mobileRegex.MatchString(userAgent) {
		return Mobile
	}
	return Desktop
}
