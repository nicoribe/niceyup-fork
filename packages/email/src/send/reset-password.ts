import { ResetPassword } from '../emails/reset-password'
import { env } from '../lib/env'
import type { User } from '../lib/types'
import { resend } from '../resend'

export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: User
  url: string
}) {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [user.email],
    subject: 'Reset your password',
    react: ResetPassword({ user, url }),
  })

  if (error) {
    console.error(error)
  }
}
