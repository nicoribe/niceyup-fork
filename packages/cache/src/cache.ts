import Redis from 'ioredis'
import { env } from './lib/env'

export const cache = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
})
