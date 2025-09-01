import { env } from '@workspace/env'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui', 'shiki'],
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/auth/sign-in',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${env.API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
