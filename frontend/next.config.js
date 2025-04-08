/** @type {import('next').NextConfig} */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

// Load environment variables from parent directory's .env file
const parentEnvPath = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(parentEnvPath)) {
  const parentEnv = dotenv.parse(fs.readFileSync(parentEnvPath));
  // Merge parent .env variables into process.env
  for (const [key, value] of Object.entries(parentEnv)) {
    process.env[key] = value;
  }
}

/** @type {boolean} */
const isStaticExport = !process.env.NEXT_PUBLIC_API_URL;
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: isStaticExport ? 'export' : 'standalone',
  images: {
    unoptimized: isStaticExport,
    domains: [process.env.NEXT_PUBLIC_ALLOW_DOMAINS || 'localhost']
  },
  optimizeFonts: false,
  // We'll get the config from the API instead of environment variables
  env: {}
};

export default nextConfig;
