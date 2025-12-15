import { getMembership } from '@/actions/organizations'
import { getTeam } from '@/actions/teams'
import type { OrganizationTeamParams } from '@/lib/types'
import { DeleteTeamForm } from './_components/delete-team-form'
import { EditTeamNameForm } from './_components/edit-team-name-form'
import { ViewTeamId } from './_components/view-team-id'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { id: string }>
}>) {
  const { organizationSlug, id: teamId } = await params

  const member = await getMembership({ organizationSlug })

  const isAdmin = member?.isAdmin

  const team = await getTeam({ organizationSlug, teamId })

  return (
    <div className="flex w-full flex-col gap-4">
      {team && (
        <EditTeamNameForm
          params={{ organizationSlug, teamId }}
          name={team.name}
          isAdmin={isAdmin}
        />
      )}

      <ViewTeamId id={teamId} />

      {team && (
        <DeleteTeamForm
          params={{
            organizationSlug,
            organizationId: team.organizationId,
            teamId: team.id,
          }}
        />
      )}
    </div>
  )
}
