import { env } from '@workspace/env'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui'],
  async rewrites() {
    return [
      {
        source: '/auth',
        destination: '/auth/sign-in',
      },
      {
        source: '/api/:path*',
        destination: `${env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
