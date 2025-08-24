import { resend } from '../resend'

export async function sendVerificationEmail({
  email,
  url,
}: {
  email: string
  url: string
}) {
  const { data, error } = await resend.emails.send({
    from: 'Davy Jones <davy@resend.dev>',
    to: [email],
    subject: 'Verify your email address',
    text: `Click the link to verify your email: ${url}`,
  })

  if (error) {
    console.error({ error })
  } else {
    console.log({ data })
  }
}
