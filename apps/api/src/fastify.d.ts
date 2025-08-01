import 'fastify'
import type { auth } from '@workspace/auth'

declare module 'fastify' {
  export interface FastifyRequest {
    authSession: typeof auth.$Infer.Session
  }
}
