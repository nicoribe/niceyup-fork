import { OrganizationInvitationEmail } from '../emails/organization-invitation'
import { env } from '../lib/env'
import type { Organization, User } from '../lib/types'
import { resend } from '../resend'

export async function sendOrganizationInvitation({
  organization,
  inviter,
  user,
  url,
  expiresIn,
}: {
  organization: Organization
  inviter: User
  user: {
    email: string
    role: string
    name?: string | null
    image?: string | null
  }
  url: string
  expiresIn: string
}) {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [user.email],
    subject: `You're invited to join ${organization.name} on Niceyup`,
    react: OrganizationInvitationEmail({
      organization,
      inviter,
      user,
      url,
      expiresIn,
    }),
  })

  if (error) {
    console.error(error)
  }
}
