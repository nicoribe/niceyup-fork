'use client'

import type { OrganizationTeamParams, Team } from '@/lib/types'
import { ArrowLeftIcon, CircleDashedIcon } from 'lucide-react'
import Link from 'next/link'

type Params = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
}

export function Header({ params, team }: { params: Params; team: Team }) {
  return (
    <div className="border-b bg-background p-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-2">
        <Link
          className="flex w-fit flex-row items-center gap-2 text-muted-foreground text-sm"
          href={`/orgs/${params.organizationSlug}/~/teams`}
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to teams
        </Link>

        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center justify-start gap-4">
            <div className="flex size-8 items-center justify-center rounded-sm bg-muted">
              <CircleDashedIcon className="size-4" />
            </div>
            <span className="font-medium text-sm">{team.name}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
