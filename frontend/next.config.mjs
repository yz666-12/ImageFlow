/** @type {import('next').NextConfig} */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

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

// Parse remote patterns to extract protocol if present
const parseRemotePatterns = (pattern) => {
  if (!pattern) return { protocol: 'http', hostname: '' };

  // Check if pattern includes http:// or https://
  if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
    const url = new URL(pattern);
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname
    };
  }

  // Default to http if no protocol specified
  return {
    protocol: 'http',
    hostname: pattern
  };
};

const { protocol, hostname } = parseRemotePatterns(process.env.NEXT_PUBLIC_REMOTE_PATTERNS);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: isStaticExport ? 'export' : 'standalone',
  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      {
        protocol,
        hostname
      }
    ]
  },
  optimizeFonts: false,
  // We'll get the config from the API instead of environment variables
  env: {}
};

export default nextConfig;
