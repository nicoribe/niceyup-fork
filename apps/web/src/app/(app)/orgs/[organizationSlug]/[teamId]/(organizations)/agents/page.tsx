import { getMembership, getOrganizationTeam } from '@/actions/organizations'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug, teamId } = await params

  const member = await getMembership({ organizationSlug })

  if (organizationSlug !== 'my-account' && teamId === '~' && !member?.isAdmin) {
    return redirect(`/orgs/${organizationSlug}/~/select-team`)
  }

  if (teamId !== '~') {
    const organizationTeam = await getOrganizationTeam({
      organizationSlug,
      teamId,
    })

    if (organizationSlug !== 'my-account' && !organizationTeam) {
      return <OrganizationNotFound />
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-sm">Agents</h1>
    </div>
  )
}
