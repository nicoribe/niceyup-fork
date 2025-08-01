import { db, generateId } from '@workspace/db'
import { env } from '@workspace/env'
import { compare, hash } from 'bcryptjs'
import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI, organization } from 'better-auth/plugins'
import { ac, roles } from './access'
import { COOKIE_PREFIX } from './constants'

const config = {
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => await hash(password, 6),
      verify: async ({ hash, password }) => await compare(password, hash),
    },
  },
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [env.WEB_URL],
  advanced: {
    cookiePrefix: COOKIE_PREFIX,
    database: { generateId },
  },
  plugins: [
    openAPI({ path: '/docs' }),
    organization({
      ac,
      roles,
    }),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth(config)
