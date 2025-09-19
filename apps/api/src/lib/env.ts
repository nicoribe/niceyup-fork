import { env as aiEnv } from '@workspace/ai/env'
import { env as authEnv } from '@workspace/auth/env'
import { env as databaseEnv } from '@workspace/db/env'
import { env as engineEnv } from '@workspace/engine/env'
import { env as baseEnv, createEnv, skipValidation, z } from '@workspace/env'
import { env as storageEnv } from '@workspace/storage/env'

export const env = createEnv({
  extends: [baseEnv, aiEnv, authEnv, databaseEnv, engineEnv, storageEnv],
  server: {
    PORT: z.coerce.number().optional(),

    UPLOAD_SECRET: z.string(),
  },
  runtimeEnv: {
    PORT: process.env.PORT,

    UPLOAD_SECRET: process.env.UPLOAD_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation,
})
