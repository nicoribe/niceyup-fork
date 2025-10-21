import { VerifyEmail } from '../emails/verify-email'
import { env } from '../lib/env'
import type { User } from '../lib/types'
import { resend } from '../resend'

export async function sendVerificationEmail({
  user,
  url,
}: {
  user: User
  url: string
}) {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [user.email],
    subject: 'Verify your email address',
    react: VerifyEmail({ user, url }),
  })

  if (error) {
    console.error({ error })
  }
}
