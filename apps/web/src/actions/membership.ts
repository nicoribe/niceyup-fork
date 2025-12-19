'use server'

import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { queries } from '@workspace/db/queries'
import { cache } from 'react'

type GetMembershipParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
}

export const getMembership = cache(
  async ({ organizationSlug }: GetMembershipParams) => {
    const {
      user: { id: userId },
    } = await authenticatedUser()

    const membership = await queries.context.getMembership({
      userId,
      organizationSlug,
    })

    return membership
  },
)

type IsOrganizationMemberAdminParams =
  | {
      organizationSlug: OrganizationTeamParams['organizationSlug']
      organizationId?: never
    }
  | {
      organizationSlug?: never
      organizationId: string
    }

export const isOrganizationMemberAdmin = cache(
  async ({
    organizationSlug,
    organizationId,
  }: IsOrganizationMemberAdminParams) => {
    const {
      user: { id: userId },
    } = await authenticatedUser()

    const isAdmin = await queries.context.isOrganizationMemberAdmin({
      userId,
      ...(organizationSlug ? { organizationSlug } : { organizationId }),
    })

    return isAdmin
  },
)
