'use client'

import { updateActiveOrganizationTeam } from '@/actions/organizations'
import { TeamSwitcher } from '@/components/organizations/team-switcher'
import type {
  listOrganizationTeams,
  listOrganizations,
} from '@/lib/auth/server'
import type { User } from '@workspace/auth'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { ChevronsUpDown, CircleDashed, PlusCircle, Slash } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type Organization = Awaited<ReturnType<typeof listOrganizations>>[number]
type Team = Awaited<ReturnType<typeof listOrganizationTeams>>[number]

export function OrganizationSwitcher({
  selectedOrganizationLabel,
  personalAccount,
  activeOrganization,
  organizations,
  activeTeam,
  teams,
}: {
  selectedOrganizationLabel?: string
  personalAccount: User
  activeOrganization?: Organization
  organizations: Organization[]
  activeTeam?: Team
  teams: Team[]
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="max-w-[250px]">
            {selectedOrganizationLabel ? (
              <>
                <CircleDashed className="mr-1 size-5" />
                <span className="truncate text-left">
                  {selectedOrganizationLabel}
                </span>
              </>
            ) : activeOrganization ? (
              <>
                <Avatar className="size-6 rounded-sm">
                  {activeOrganization.logo && (
                    <AvatarImage src={activeOrganization.logo} />
                  )}
                  <AvatarFallback className="rounded-sm" />
                </Avatar>
                <span className="truncate text-left">
                  {activeOrganization.name}
                </span>
                <div className="rounded-sm border px-2 py-0.5">
                  <span className="text-xs">Standard</span>
                </div>
              </>
            ) : (
              <>
                <Avatar className="size-6">
                  {personalAccount.image && (
                    <AvatarImage src={personalAccount.image} />
                  )}
                  <AvatarFallback />
                </Avatar>
                <span className="truncate text-left">
                  {personalAccount.name}
                </span>
                <div className="rounded-sm border px-2 py-0.5">
                  <span className="text-xs">Free</span>
                </div>
              </>
            )}
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={12}
          className="w-[200px]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Personal account</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={async () => {
                await updateActiveOrganizationTeam()
                redirect('/orgs/my-account/~/overview')
              }}
            >
              <Avatar className="mr-1 size-4">
                {personalAccount.image && (
                  <AvatarImage src={personalAccount.image} />
                )}
                <AvatarFallback />
              </Avatar>
              <span className="line-clamp-1">{personalAccount.name}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            {organizations.map((organization) => {
              return (
                <DropdownMenuItem
                  key={organization.id}
                  onClick={async () => {
                    await updateActiveOrganizationTeam(organization.id)
                    redirect(`/orgs/${organization.slug}/~/select-team`)
                  }}
                >
                  <Avatar className="mr-1 size-4 rounded-sm">
                    {organization.logo && (
                      <AvatarImage src={organization.logo} />
                    )}
                    <AvatarFallback className="rounded-sm" />
                  </Avatar>
                  <span className="line-clamp-1">{organization.name}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/onboarding/create-organization">
              <PlusCircle className="mr-1 size-4" />
              Create organization
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeOrganization && (
        <>
          <Slash className="-rotate-[24deg] size-3 text-border" />

          <TeamSwitcher
            organizationSlug={activeOrganization.slug}
            activeTeam={activeTeam}
            teams={teams}
          />
        </>
      )}
    </>
  )
}
