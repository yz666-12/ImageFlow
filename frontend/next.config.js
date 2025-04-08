/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from parent directory's .env file
const parentEnvPath = path.resolve(__dirname, '../.env');
let envConfig = {};

if (fs.existsSync(parentEnvPath)) {
  envConfig = dotenv.parse(fs.readFileSync(parentEnvPath));
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: process.env.NEXT_PUBLIC_API_URL === undefined || process.env.NEXT_PUBLIC_API_URL === '' ? 'export' : 'standalone',
  images: {
    unoptimized: process.env.NEXT_PUBLIC_API_URL === undefined || process.env.NEXT_PUBLIC_API_URL === '',
    domains: [process.env.NEXT_PUBLIC_ALLOW_DOMAINS || 'localhost']
  },
  optimizeFonts: false,
  // We'll get the config from the API instead of environment variables
  env: {}
}

module.exports = nextConfig
