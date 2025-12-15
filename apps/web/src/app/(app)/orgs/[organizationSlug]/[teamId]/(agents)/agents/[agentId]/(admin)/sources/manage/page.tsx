import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'
import { ManageSourcesWithPreview } from './_components/manage-sources-with-preview'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string }>
}>) {
  const { organizationSlug, teamId, agentId } = await params

  const { data } = await sdk.listAgentSources({
    agentId,
    params: { organizationSlug, teamId },
  })

  return (
    <ManageSourcesWithPreview
      params={{ organizationSlug, teamId, agentId }}
      initialSourceIds={data?.sources.map(({ id }) => id)}
    />
  )
}
