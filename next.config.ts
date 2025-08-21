import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    optimizeCss: false
  }
  // add other config here
}

export default nextConfig
