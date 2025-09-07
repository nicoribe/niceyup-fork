import { env as aiEnv } from '@workspace/ai/env'
import { env as authEnv } from '@workspace/auth/env'
import { env as databaseEnv } from '@workspace/db/env'
import { triggerEnv } from '@workspace/engine/env'
import { env as baseEnv, createEnv, z } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv, aiEnv, authEnv, databaseEnv, triggerEnv],
  server: {
    PORT: z.coerce.number().optional(),
  },
  runtimeEnv: {
    PORT: process.env.PORT,
  },
})
