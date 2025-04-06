/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Disable Babel completely
  experimental: {
    forceSwcTransforms: true,
  },
  
  // Ensure we can access files from contract directories
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Add image domains for external images if needed
  images: {
    domains: ['ipfs.io'],
  },
}

module.exports = nextConfig
