import { getMembership } from '@/actions/organizations'
import { listTeams } from '@/actions/teams'
import type { OrganizationTeamParams } from '@/lib/types'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@workspace/ui/components/empty'
import {
  CircleDashedIcon,
  CirclePlusIcon,
  MoreHorizontalIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { SearchParams } from 'nuqs/server'
import { SearchInput } from './_components/search-input'
import { loadSearchParams } from './_lib/searchParams'

export default async function Page({
  params,
  searchParams,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  searchParams: Promise<SearchParams>
}>) {
  const { organizationSlug } = await params
  const { search } = await loadSearchParams(searchParams)

  const member = await getMembership({ organizationSlug })

  const isAdmin = member?.isAdmin

  const teams = await listTeams({ organizationSlug, search })

  return (
    <div className="flex size-full flex-1 flex-col">
      <div className="border-b bg-background p-4">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="md:max-w-sm">
              <h2 className="font-semibold text-sm">Teams</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Manage your teams within the organization
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-4">
              <Button asChild>
                <Link href={`/orgs/${organizationSlug}/~/teams/create`}>
                  New team
                  <CirclePlusIcon className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 p-4">
        {!search && !teams.length && (
          <div className="w-full max-w-4xl rounded-lg border bg-background p-4">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No Teams Yet</EmptyTitle>
                <EmptyDescription>
                  Create a team to get started
                </EmptyDescription>
              </EmptyHeader>

              {isAdmin && (
                <EmptyContent>
                  <Button asChild>
                    <Link href={`/orgs/${organizationSlug}/~/teams/create`}>
                      New team
                      <CirclePlusIcon className="ml-1 size-4" />
                    </Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </div>
        )}

        {(search || !!teams.length) && (
          <div className="flex w-full max-w-4xl flex-col">
            <SearchInput />
          </div>
        )}

        {search && !teams.length && (
          <div className="w-full max-w-4xl rounded-lg border bg-background p-4">
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="text-sm">No teams found</EmptyTitle>
                <EmptyDescription>
                  Your search for "{search}" did not return any teams
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}

        {!!teams.length && (
          <div className="flex w-full max-w-4xl flex-col divide-y divide-border rounded-lg border bg-background">
            {teams.map((team) => (
              <Link
                key={team.id}
                className="flex items-center justify-start gap-4 p-4"
                href={`/orgs/${organizationSlug}/~/teams/${team.id}`}
              >
                <div className="flex size-8 items-center justify-center rounded-sm bg-muted">
                  <CircleDashedIcon className="size-4" />
                </div>

                <span className="font-medium text-sm">{team.name}</span>

                <Badge variant="outline" className="text-xs">
                  {team.memberCount}{' '}
                  {team.memberCount > 1 ? 'members' : 'member'}
                </Badge>

                <div className="ml-auto flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/orgs/${organizationSlug}/~/teams/${team.id}`}
                        >
                          Manage
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
