import { env as baseEnv, createEnv, skipValidation } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv],
  runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation,
})
