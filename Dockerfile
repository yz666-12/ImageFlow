FROM golang:1.22-alpine AS builder

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

ENV GOPROXY=https://goproxy.cn,direct
ENV GO111MODULE=on

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o imageflow

FROM alpine:latest

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

RUN apk add --no-cache \
    ca-certificates \
    libwebp-tools \
    libavif-apps \
    wget

RUN mkdir -p /app/static/images/original/landscape && \
    mkdir -p /app/static/images/original/portrait && \
    mkdir -p /app/static/images/landscape/webp && \
    mkdir -p /app/static/images/landscape/avif && \
    mkdir -p /app/static/images/portrait/webp && \
    mkdir -p /app/static/images/portrait/avif 

COPY --from=builder /app/imageflow /app/
COPY --from=builder /app/static /app/static
COPY --from=builder /app/config /app/config


ENV API_KEY=""
ENV STORAGE_TYPE="local"
ENV LOCAL_STORAGE_PATH="/app/static/images"

EXPOSE 8686

CMD ["./imageflow"]


