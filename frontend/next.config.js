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
  output: 'export',
  images: {
    unoptimized: true,
  },
  optimizeFonts: false,
  // We'll get the config from the API instead of environment variables
  env: {}
}

module.exports = nextConfig
