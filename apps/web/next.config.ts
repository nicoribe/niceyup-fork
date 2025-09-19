import { env } from '@/lib/env'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: env.NEXT_CONFIG_OUTPUT,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    '@workspace/ai',
    '@workspace/auth',
    '@workspace/db',
    '@workspace/engine',
    '@workspace/env',
    '@workspace/sdk',
    '@workspace/ui',
    '@workspace/utils',
    'shiki',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(env.STORAGE_URL).hostname,
      },
    ],
  },
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
