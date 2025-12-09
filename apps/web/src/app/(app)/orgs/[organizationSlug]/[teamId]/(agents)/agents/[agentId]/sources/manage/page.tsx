import { getMembership } from '@/actions/organizations'
import { PermissionDenied } from '@/components/organizations/permission-denied'
import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'
import { ManageSourcesWithPreview } from './_components/manage-sources-with-preview'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string }>
}>) {
  const { organizationSlug, teamId, agentId } = await params

  const member = await getMembership({ organizationSlug })

  if (organizationSlug !== 'my-account' && !member?.isAdmin) {
    return (
      <div className="flex w-full flex-col">
        <div className="rounded-lg border bg-background p-4 py-24">
          <PermissionDenied />
        </div>
      </div>
    )
  }

  const { data } = await sdk.listAgentSources(
    {
      agentId,
      params: { organizationSlug, teamId },
    },
    { next: { tags: [`agent-${agentId}-sources`] } },
  )

  return (
    <ManageSourcesWithPreview
      params={{ organizationSlug, teamId, agentId }}
      initialSourceIds={data?.sources.map(({ id }) => id)}
    />
  )
}
