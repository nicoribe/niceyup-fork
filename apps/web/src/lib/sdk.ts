import { env } from '@/lib/env'
import { getHeaders } from '@/lib/headers'
import { createClient } from '@workspace/sdk'

export const sdk = createClient({
  baseURL: `${env.NEXT_PUBLIC_WEB_URL}/api`,
  headers: getHeaders,
})
