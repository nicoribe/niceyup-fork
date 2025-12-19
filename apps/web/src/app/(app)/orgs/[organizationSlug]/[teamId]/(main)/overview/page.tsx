import type { OrganizationTeamParams } from '@/lib/types'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { teamId } = await params

  if (teamId === '~') {
    return (
      <p className="py-6 text-center text-muted-foreground text-xs">
        Coming soon
      </p>
    )
  }

  return (
    <p className="py-6 text-center text-muted-foreground text-xs">
      Coming soon ({teamId})
    </p>
  )
}
