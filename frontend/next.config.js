/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 启用静态导出
  images: {
    unoptimized: true, // 静态导出需要禁用图片优化
  },
  // 禁用服务端组件
  experimental: {
    appDir: true,
  }
}

module.exports = nextConfig 