'use client'

import { setActiveOrganizationTeam } from '@/actions/organizations'
import type { OrganizationTeamParams, Team } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { ChevronsUpDown, CircleDashed, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export function TeamSwitcher({
  activeTeam,
  teams,
}: {
  activeTeam?: Team
  teams: Team[]
}) {
  const { organizationSlug } = useParams<OrganizationTeamParams>()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-[250px]">
          {activeTeam ? (
            <>
              <CircleDashed className="mr-1 size-4" />
              <span className="truncate">{activeTeam.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select team</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={12} className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Teams</DropdownMenuLabel>
          {teams.map((team) => {
            return (
              <DropdownMenuItem
                key={team.id}
                onClick={async () => {
                  await setActiveOrganizationTeam({
                    organizationId: team.organizationId,
                    teamId: team.id,
                  })

                  router.push(`/orgs/${organizationSlug}/${team.id}/overview`)
                }}
              >
                <CircleDashed className="mr-1 size-4" />
                <span className="line-clamp-1">{team.name}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={`/orgs/${organizationSlug}/~/teams/create`}>
            <PlusCircle className="mr-1 size-4" />
            Create team
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
