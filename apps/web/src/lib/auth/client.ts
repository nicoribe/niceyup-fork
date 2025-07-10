'use client'

import { createAuthClient } from '@workspace/auth/react'
import { env } from '@workspace/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_WEB_URL,
})
