'use client'

import type { Chat, ChatParams, OrganizationTeamParams } from '@/lib/types'
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
import { redirect, useParams } from 'next/navigation'
import * as React from 'react'
import { create } from 'zustand'
import { useExplorerTree } from '../../_components/explorer-tree'
import type { PathInExplorer } from '../../_lib/types'

interface OpenChatsStore {
  openChats: Chat[]
  setOpenChats: (openChats: Chat[] | ((prevChats: Chat[]) => Chat[])) => void
}

export const useOpenChats = create<OpenChatsStore>((set) => ({
  openChats: [],
  setOpenChats: (openChats) =>
    set((state) => ({
      openChats:
        typeof openChats === 'function'
          ? openChats(state.openChats)
          : openChats,
    })),
}))

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export function OpenChats({
  chat,
  pathInExplorer,
}: {
  chat: Chat | null
  pathInExplorer: PathInExplorer[]
}) {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()

  const { openChats, setOpenChats } = useOpenChats()
  const { revealItemInExplorer, setRevealItemInExplorer } = useExplorerTree()

  const onCloseChat = () => {
    setOpenChats((prevChats) => prevChats.filter(({ id }) => id !== chatId))
    redirect(`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`)
  }

  const onCloseAllChats = () => {
    setOpenChats([])
    redirect(`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`)
  }

  const onCloseOtherChats = () => {
    setOpenChats((prevChats) => prevChats.filter(({ id }) => id === chatId))
  }

  React.useEffect(() => {
    if (chatId === 'new') {
      return
    }

    if (!chat) {
      setOpenChats((prevChats) => prevChats.filter(({ id }) => id !== chatId))
      return
    }

    setOpenChats((prevChats) => {
      const chatIndex = prevChats.findIndex(({ id }) => id === chat.id)
      if (chatIndex !== -1) {
        prevChats[chatIndex] = chat
        return prevChats
      }

      return [...prevChats, chat]
    })
  }, [chat])

  return (
    <div className="flex flex-row items-center bg-background px-1">
      <div className="no-scrollbar flex flex-1 flex-row items-center gap-1 overflow-x-scroll">
        {openChats.map((chat, index) => {
          const Comp = chatId === chat.id ? 'div' : Link

          return (
            <>
              <Tooltip key={`${chat.id}-${index}-tooltip`}>
                <TooltipTrigger asChild>
                  <Comp
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
                        <div onClick={onCloseChat}>
                          <XIcon className="size-3 shrink-0 text-muted-foreground hover:text-foreground" />
                        </div>
                      )}
                    </div>
                  </Comp>
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
          )
        })}

        <div className="sticky right-0 flex flex-1 flex-row items-center gap-1 bg-background">
          {!!openChats.length && (
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
          )}
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
            <DropdownMenuItem onSelect={onCloseChat}>
              Close Chat
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCloseAllChats}>
              Close All Chats
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCloseOtherChats}>
              Close Other Chats
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!!revealItemInExplorer}
              onSelect={async () => {
                const lastItem = pathInExplorer.at(-1)

                if (lastItem) {
                  setRevealItemInExplorer({
                    parentIds: pathInExplorer.map(({ id }) => id).slice(0, -1),
                    id: lastItem.id,
                  })
                }
              }}
            >
              Reveal in Explorer
            </DropdownMenuItem>
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
