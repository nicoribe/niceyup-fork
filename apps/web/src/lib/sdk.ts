import { getSessionToken } from '@/lib/auth/session-token'
import { env } from '@workspace/env'
import { createClient } from '@workspace/sdk'

export const sdk = createClient({
  baseURL: env.NEXT_PUBLIC_WEB_URL,
  getSessionTokenFn: getSessionToken,
})
