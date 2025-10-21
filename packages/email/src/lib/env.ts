import { env as baseEnv, createEnv, z } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv],
  server: {
    RESEND_API_KEY: z.string(),
    RESEND_FROM_EMAIL: z.string(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
