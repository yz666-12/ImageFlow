package utils

import (
	"net/http"
	"regexp"
)

type DeviceType int

const (
	Desktop DeviceType = iota
	Mobile
)

var (
	mobileRegex = regexp.MustCompile(`(?i)(android|webos|iphone|ipad|ipod|blackberry|windows phone)`)
)

func DetectDevice(r *http.Request) DeviceType {
	userAgent := r.Header.Get("User-Agent")
	if mobileRegex.MatchString(userAgent) {
		return Mobile
	}
	return Desktop
}
