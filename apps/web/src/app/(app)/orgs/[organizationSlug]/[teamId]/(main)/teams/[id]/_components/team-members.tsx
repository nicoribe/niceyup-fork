'use client'

import type { listTeamMembers } from '@/actions/teams'
import type { OrganizationTeamParams } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar'
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { MoreHorizontalIcon, PlusIcon, SearchIcon } from 'lucide-react'
import * as React from 'react'
import { AddMemberDialog } from './add-member-dialog'

type Params = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  teamId: string
}

export function TeamMembers({
  params,
  userId,
  isAdmin,
  teamMembers,
}: {
  params: Params
  userId: string
  isAdmin?: boolean
  teamMembers?: Awaited<ReturnType<typeof listTeamMembers>>
}) {
  const [addMemberDialogOpen, setAddMemberDialogOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const filteredTeamMembers = React.useMemo(() => {
    return teamMembers?.filter(({ name }) =>
      name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [teamMembers, search])

  return (
    <div className="flex w-full flex-col gap-4">
      {isAdmin && (
        <AddMemberDialog
          params={params}
          open={addMemberDialogOpen}
          onOpenChange={setAddMemberDialogOpen}
        />
      )}

      <div className="flex w-full flex-row items-center gap-2">
        <InputGroup className="h-10 bg-background">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter..."
            className="[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
            disabled={!teamMembers?.length}
          />
        </InputGroup>

        {isAdmin && (
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setAddMemberDialogOpen(true)}
          >
            <PlusIcon />
            Add member
          </Button>
        )}
      </div>

      {!teamMembers?.length && (
        <div className="w-full rounded-lg border bg-background p-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No Team Members</EmptyTitle>
              <EmptyDescription>
                {isAdmin
                  ? 'Add team members to get started'
                  : 'No team members found'}
              </EmptyDescription>
            </EmptyHeader>

            {isAdmin && (
              <EmptyContent>
                <Button onClick={() => setAddMemberDialogOpen(true)}>
                  <PlusIcon />
                  Add Members
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      )}

      {search && !filteredTeamMembers?.length && (
        <div className="w-full rounded-lg border bg-background p-4">
          <Empty>
            <EmptyHeader>
              <EmptyTitle className="text-sm">No team members found</EmptyTitle>
              <EmptyDescription>
                Your search for "{search}" did not return any team members
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {!!filteredTeamMembers?.length && (
        <div className="flex w-full flex-col divide-y divide-border rounded-lg border bg-background">
          {filteredTeamMembers?.map((teamMember) => (
            <div
              key={teamMember.id}
              className="flex items-center justify-start gap-4 px-4 py-3"
            >
              <Avatar className="size-8">
                {teamMember.image && <AvatarImage src={teamMember.image} />}
                {teamMember.name && (
                  <AvatarFallback className="text-xs">
                    {getInitials(teamMember.name)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex flex-col">
                <span className="line-clamp-1 break-all text-start font-medium text-sm">
                  {teamMember.name}
                </span>
                <span className="line-clamp-1 break-all text-start font-normal text-muted-foreground text-xs">
                  {teamMember.email}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {userId === teamMember.id && (
                  <Badge variant="outline">You</Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {teamMember.role}
                </Badge>
              </div>

              <div className="ml-auto flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuItem variant="destructive">
                      {userId === teamMember.id
                        ? 'Leave Team'
                        : 'Remove from team'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
