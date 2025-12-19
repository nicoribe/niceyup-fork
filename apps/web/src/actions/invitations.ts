'use server'

import { authenticatedUser } from '@/lib/auth/server'
import { queries } from '@workspace/db/queries'
import { cacheTag } from 'next/cache'

type GetInvitationParams = {
  invitationId: string
}

export async function getInvitation({ invitationId }: GetInvitationParams) {
  const {
    user: { id: userId },
  } = await authenticatedUser()

  const invitation = await queries.context.getInvitation(
    { userId },
    { invitationId },
  )

  return invitation
}

type ListPendingInvitationsParams = {
  organizationSlug: string
}

export async function listPendingInvitations({
  organizationSlug,
}: ListPendingInvitationsParams) {
  'use cache: private'
  cacheTag('invite-member', 'cancel-invitation')

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const pendingInvitations = await queries.context.listPendingInvitations({
    userId,
    organizationSlug,
  })

  return pendingInvitations
}
