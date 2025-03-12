FROM golang:1.22-alpine AS builder

# 设置 Alpine 镜像源为阿里云镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 设置 Go 模块代理为国内源
ENV GOPROXY=https://goproxy.cn,direct
ENV GO111MODULE=on

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o imageflow

# Final stage
FROM alpine:latest

# 设置 Alpine 镜像源为阿里云镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

# Install runtime dependencies and image conversion tools
RUN apk add --no-cache \
    ca-certificates \
    libwebp-tools \
    libavif-apps

# Create app user and set up directories with proper permissions
RUN adduser -D -u 1000 appuser && \
    mkdir -p /app/static/landscape/webp && \
    mkdir -p /app/static/landscape/avif && \
    mkdir -p /app/static/portrait/webp && \
    mkdir -p /app/static/portrait/avif && \
    chown -R appuser:appuser /app && \
    chmod -R 777 /app/static

# Copy the binary and static files
COPY --from=builder /app/imageflow /app/
COPY --from=builder /app/static /app/static
COPY --from=builder /app/config /app/config

# Ensure proper permissions after copy
RUN chown -R appuser:appuser /app && \
    chmod -R 777 /app/static

USER appuser

# Set environment variables
ENV API_KEY=""

# Expose the port your application uses
EXPOSE 8080

CMD ["./imageflow"] 
