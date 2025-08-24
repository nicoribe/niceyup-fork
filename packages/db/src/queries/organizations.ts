import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { members } from '../schema/auth'

export async function isOrganizationMemberAdmin({
  userId,
  organizationId,
}: {
  userId: string
  organizationId: string
}) {
  const [member] = await db
    .select({
      role: members.role,
    })
    .from(members)
    .where(
      and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId),
      ),
    )
    .limit(1)

  return (
    member?.role === 'owner' ||
    member?.role === 'admin' ||
    member?.role === 'billing'
  )
}
