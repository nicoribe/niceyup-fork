import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
