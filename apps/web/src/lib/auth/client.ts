'use client'

import { env } from '@/lib/env'
import {
  createAuthClient,
  organizationClient,
  stripeClient,
} from '@workspace/auth/client'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_WEB_URL,
  plugins: [
    organizationClient({
      teams: {
        enabled: true,
      },
    }),
    stripeClient({
      subscription: true,
    }),
  ],
})
