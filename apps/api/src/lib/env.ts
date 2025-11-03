import { env as aiEnv } from '@workspace/ai/env'
import { env as authEnv } from '@workspace/auth/env'
import { env as cacheEnv } from '@workspace/cache/env'
import { env as databaseEnv } from '@workspace/db/env'
import { env as engineEnv } from '@workspace/engine/env'
import { env as baseEnv, createEnv, z } from '@workspace/env'
import { env as storageEnv } from '@workspace/storage/env'
import { env as vectorStoreEnv } from '@workspace/vector-store/env'

export const env = createEnv({
  extends: [
    baseEnv,
    aiEnv,
    authEnv,
    cacheEnv,
    databaseEnv,
    engineEnv,
    storageEnv,
    vectorStoreEnv,
  ],
  server: {
    PORT: z.coerce.number().optional(),

    UPLOAD_SECRET: z.string(),
  },
  runtimeEnv: {
    PORT: process.env.PORT,

    UPLOAD_SECRET: process.env.UPLOAD_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
