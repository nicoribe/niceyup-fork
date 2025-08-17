'use client'

import type { ChatParams, OrganizationTeamParams } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Separator } from '@workspace/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'
import { PlusIcon, XIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export function OpenChats() {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()

  const openChats = [
    {
      id: 'foo',
      title: '(untitled)',
      path: [
        { id: 'my-chats', title: 'My Chats' },
        { id: 'untitled', title: '(untitled)' },
      ],
    },
  ]

  return (
    <div className="flex flex-row items-center bg-background px-1">
      <div className="no-scrollbar flex flex-1 flex-row items-center gap-1 overflow-x-scroll">
        {openChats.map((chat, index) => (
          <>
            <Tooltip key={`${chat.id}-${index}-tooltip`}>
              <TooltipTrigger asChild>
                <Link
                  href={`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/${chat.id}`}
                >
                  <div
                    key={`${chat.id}-${index}`}
                    className={cn(
                      'flex select-none flex-row items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 font-medium text-sm hover:bg-accent',
                      chat.id === chatId
                        ? 'max-w-40 bg-secondary'
                        : 'max-w-36 bg-transparent',
                    )}
                  >
                    <p className="truncate">{chat.title}</p>
                    {chat.id === chatId && (
                      <XIcon className="size-3 shrink-0 text-muted-foreground hover:text-foreground" />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{chat.title}</TooltipContent>
            </Tooltip>
            {index !== openChats.length - 1 && (
              <Separator
                key={`${chat.id}-${index}-separator`}
                orientation="vertical"
                className="data-[orientation=vertical]:h-4"
              />
            )}
          </>
        ))}

        <div className="sticky right-0 flex flex-1 flex-row items-center gap-1 bg-background">
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={chatId === 'new' ? 'secondary' : 'ghost'}
                size="icon"
                className="mr-1 size-8"
                asChild
              >
                <Link
                  href={`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`}
                >
                  <PlusIcon className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-full"
      />

      <div className="flex flex-row items-center gap-1 p-1">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Close Chat</DropdownMenuItem>
            <DropdownMenuItem>Close All Chats</DropdownMenuItem>
            <DropdownMenuItem>Close Other Chats</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`}
              >
                New Chat
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
