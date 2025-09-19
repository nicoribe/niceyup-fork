import { env as baseEnv, createEnv } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv],
  runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
