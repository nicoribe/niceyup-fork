import { createEnv, skipValidation, z } from '@workspace/env'

export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation,
})
