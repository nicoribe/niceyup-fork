import { listOrganizationTeams } from '@/actions/organizations'
import type { OrganizationTeamParams } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { ArrowRightIcon, CircleDashedIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug, teamId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  if (isPersonalAccount) {
    return redirect('/orgs/my-account/~/overview')
  }

  const teams = await listOrganizationTeams({ organizationSlug })

  return (
    <div className="w-full max-w-xl p-4 md:p-10">
      <Card>
        <CardHeader>
          <h1 className="text-center font-semibold text-xl leading-none">
            Select a team
          </h1>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-4xl flex-col divide-y divide-border rounded-lg border bg-background">
            {teams.map((team) => (
              <Link
                key={team.id}
                className="flex items-center justify-start gap-4 p-3"
                href={`/orgs/${organizationSlug}/${team.id}/overview`}
              >
                <div className="flex size-8 items-center justify-center rounded-sm bg-muted">
                  <CircleDashedIcon className="size-4" />
                </div>
                <span className="font-medium text-sm">{team.name}</span>

                <div className="ml-auto flex items-center">
                  <Button variant="ghost" size="icon">
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
