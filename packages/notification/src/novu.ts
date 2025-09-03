import { Novu } from '@novu/api'
import { env } from '@workspace/env'

export const novu = new Novu({ secretKey: env.NOVU_SECRET_KEY })
