import { Novu } from '@novu/api'
import { env } from './lib/env'

export const novu = new Novu({ secretKey: env.NOVU_SECRET_KEY })
