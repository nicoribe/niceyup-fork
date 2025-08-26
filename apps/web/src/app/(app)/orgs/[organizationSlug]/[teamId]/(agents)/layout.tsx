import {
  getMembership,
  getOrganization,
  getOrganizationTeam,
} from '@/actions/organizations'
import { Header } from '@/components/organizations/header'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId } = await params

  const organization = await getOrganization({ organizationSlug })

  if (organizationSlug !== 'my-account' && !organization) {
    return (
      <>
        <Header selectedOrganizationLabel="Not found" />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <OrganizationNotFound />
        </main>
      </>
    )
  }

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
      return (
        <>
          <Header selectedOrganizationLabel="Not found" />

          <main className="flex flex-1 flex-col items-center justify-center gap-4">
            <OrganizationNotFound />
          </main>
        </>
      )
    }
  }

  return <>{children}</>
}
