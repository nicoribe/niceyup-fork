'use client'

import type { Agent } from '@/lib/types'
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

export function AgentSwitcher({
  organizationSlug,
  teamId,
  activeAgent,
  agents,
}: {
  organizationSlug?: string
  teamId?: string
  activeAgent?: Agent
  agents?: Agent[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-[250px]">
          {activeAgent ? (
            <>
              <CircleDashed className="mr-1 size-4" />
              <span className="truncate text-left">{activeAgent.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select agent</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={12} className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Agents</DropdownMenuLabel>
          {agents?.map((agent) => {
            return (
              <DropdownMenuItem
                key={agent.id}
                onClick={async () => {
                  redirect(
                    `/orgs/${organizationSlug || 'my-account'}/${
                      teamId || '~'
                    }/agents/${agent.id}/chats`,
                  )
                }}
              >
                <CircleDashed className="mr-1 size-4" />
                <span className="line-clamp-1">{agent.name}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link
            href={`/orgs/${organizationSlug || 'my-account'}/${
              teamId || '~'
            }/create-agent`}
          >
            <PlusCircle className="mr-1 size-4" />
            Create agent
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
