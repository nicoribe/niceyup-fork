'use client'

import { createAuthClient, organizationClient } from '@workspace/auth/client'
import { env } from '@workspace/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_WEB_URL,
  plugins: [organizationClient()],
})
