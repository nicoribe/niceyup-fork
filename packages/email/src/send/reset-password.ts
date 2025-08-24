import { resend } from '../resend'

export async function sendEmailResetPassword({
  email,
  url,
}: {
  email: string
  url: string
}) {
  const { data, error } = await resend.emails.send({
    from: 'Davy Jones <davy@resend.dev>',
    to: [email],
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${url}`,
  })

  if (error) {
    console.error({ error })
  } else {
    console.log({ data })
  }
}
