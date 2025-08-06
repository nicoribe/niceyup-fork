import { db, generateId } from '@workspace/db'
import { createWorkspace } from '@workspace/db/queries'
import { sendEmailResetPassword, sendVerificationEmail } from '@workspace/email'
import { env } from '@workspace/env'
import { compare, hash } from 'bcryptjs'
import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI, organization } from 'better-auth/plugins'
import { ac, roles } from './access'
import { COOKIE_PREFIX } from './constants'
import { stripe } from './stripe'

const config = {
  appName: 'Acme-Chat',
  baseURL: env.WEB_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ email: user.email, url })
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password) => await hash(password, 12),
      verify: async ({ hash, password }) => await compare(password, hash),
    },
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmailResetPassword({ email: user.email, url })
    },
  },
  socialProviders: {
    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined,
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await createWorkspace({ userId: user.id })
        },
      },
    },
  },
  plugins: [
    openAPI({ path: '/docs' }),
    organization({
      ac,
      roles,
      teams: {
        enabled: true,
      },
      organizationCreation: {
        afterCreate: async ({ organization }) => {
          await createWorkspace({ organizationId: organization.id })
        },
      },
    }),
    stripe(),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth(config)
