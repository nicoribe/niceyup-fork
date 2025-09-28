import Redis from 'ioredis'
import { env } from './lib/env'

export const cache = new Redis(env.REDIS_URL)
