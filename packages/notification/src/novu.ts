import { Novu } from '@novu/api'
import { env } from '@workspace/env'

export const novu = new Novu(env.NOVU_API_KEY)
