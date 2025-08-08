'use client'

import { updateActiveOrganizationTeam } from '@/actions/organizations'
import type { Team } from '@workspace/auth'
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
import { redirect } from 'next/navigation'

export function TeamSwitcher({
  organizationSlug,
  activeTeam,
  teams,
}: {
  organizationSlug: string
  activeTeam?: Team
  teams: Team[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-[250px]">
          {activeTeam ? (
            <>
              <CircleDashed className="mr-1 size-4" />
              <span className="truncate text-left">{activeTeam.name}</span>
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
          {teams?.map((team) => {
            return (
              <DropdownMenuItem
                key={team.id}
                onClick={async () => {
                  await updateActiveOrganizationTeam(
                    team.organizationId,
                    team.id,
                  )
                  redirect(`/orgs/${organizationSlug}/${team.id}/overview`)
                }}
              >
                <CircleDashed className="mr-1 size-4" />
                <span className="line-clamp-1">{team.name}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={`/orgs/${organizationSlug}/~/create-team`}>
            <PlusCircle className="mr-1 size-4" />
            Create team
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
