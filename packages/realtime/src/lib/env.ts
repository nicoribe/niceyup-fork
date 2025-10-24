import { env as cacheEnv } from '@workspace/cache/env'
import { createEnv, z } from '@workspace/env'
import { env as baseEnv } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv, cacheEnv],
  shared: {
    NEXT_PUBLIC_WEBSOCKET_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
