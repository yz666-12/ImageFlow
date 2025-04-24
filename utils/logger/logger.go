package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	// Log 全局日志实例
	Log *zap.Logger
	// debugMode 全局debug模式开关
	debugMode bool
)

// InitLogger 初始化日志配置
func InitLogger(debug bool) error {
	debugMode = debug

	// 基础配置
	config := zap.NewProductionConfig()

	// 根据环境变量覆盖debug设置
	if envDebug := os.Getenv("DEBUG_MODE"); envDebug != "" {
		debugMode = envDebug == "true"
	}

	// 设置日志级别
	if debugMode {
		config.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	} else {
		config.Level = zap.NewAtomicLevelAt(zap.InfoLevel)
	}

	// 自定义编码配置
	config.EncoderConfig = zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	// 设置日志输出
	var cores []zapcore.Core

	// 总是输出到文件
	logFile, err := os.OpenFile("imageflow.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	cores = append(cores, zapcore.NewCore(
		zapcore.NewJSONEncoder(config.EncoderConfig),
		zapcore.AddSync(logFile),
		config.Level,
	))

	// 在debug模式下同时输出到控制台
	if debugMode {
		cores = append(cores, zapcore.NewCore(
			zapcore.NewConsoleEncoder(config.EncoderConfig),
			zapcore.AddSync(os.Stdout),
			config.Level,
		))
	}

	// 创建logger
	core := zapcore.NewTee(cores...)
	Log = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel))

	Info("Logger initialized",
		zap.Bool("debug_mode", debugMode),
		zap.String("log_level", config.Level.String()))

	return nil
}

// IsDebugMode 返回当前是否为debug模式
func IsDebugMode() bool {
	return debugMode
}

// Debug 输出debug级别日志
func Debug(msg string, fields ...zap.Field) {
	if debugMode {
		Log.Debug(msg, fields...)
	}
}

// Info 输出info级别日志
func Info(msg string, fields ...zap.Field) {
	Log.Info(msg, fields...)
}

// Warn 输出warn级别日志
func Warn(msg string, fields ...zap.Field) {
	Log.Warn(msg, fields...)
}

// Error 输出error级别日志
func Error(msg string, fields ...zap.Field) {
	Log.Error(msg, fields...)
}

// Fatal 输出fatal级别日志
func Fatal(msg string, fields ...zap.Field) {
	Log.Fatal(msg, fields...)
}

// With 创建带有额外字段的logger
func With(fields ...zap.Field) *zap.Logger {
	return Log.With(fields...)
}
