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
    libavif-apps \
    wget

# Create app user and set up directories with proper permissions
RUN mkdir -p /app/static/images/original/landscape && \
    mkdir -p /app/static/images/original/portrait && \
    mkdir -p /app/static/images/landscape/webp && \
    mkdir -p /app/static/images/landscape/avif && \
    mkdir -p /app/static/images/portrait/webp && \
    mkdir -p /app/static/images/portrait/avif 

# Copy the binary and static files
COPY --from=builder /app/imageflow /app/
COPY --from=builder /app/static /app/static
COPY --from=builder /app/config /app/config


# Set environment variables
ENV API_KEY=""
ENV STORAGE_TYPE="local"
ENV LOCAL_STORAGE_PATH="/app/static/images"

# Expose the port your application uses
EXPOSE 8686

CMD ["./imageflow"]


