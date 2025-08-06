'use client'

import {
  createAuthClient,
  organizationClient,
  stripeClient,
} from '@workspace/auth/client'
import { env } from '@workspace/env'

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
