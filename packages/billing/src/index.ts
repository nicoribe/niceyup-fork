import { Polar } from '@polar-sh/sdk'
import { env } from './lib/env'

export const billing = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: env.POLAR_ENVIRONMENT,
})
