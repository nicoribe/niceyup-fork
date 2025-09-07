import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    NOVU_SECRET_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NOVU_SECRET_KEY: process.env.NOVU_SECRET_KEY,
  },
})
