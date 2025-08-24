import { db, generateId } from '@workspace/db'
import { sendEmailResetPassword, sendVerificationEmail } from '@workspace/email'
import { env } from '@workspace/env'
import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI, organization } from 'better-auth/plugins'
import { ac, roles } from './access'
import { COOKIE_PREFIX } from './constants'
import { stripe } from './stripe'

const config = {
  appName: 'Better Chat',
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
  plugins: [
    organization({
      ac,
      roles,
      teams: {
        enabled: true,
      },
    }),
    stripe(),

    // API Reference for Better Auth
    ...(env.NODE_ENV === 'development' ? [openAPI({ path: '/docs' })] : []),
  ],
} satisfies BetterAuthOptions

export const auth = betterAuth(config)
