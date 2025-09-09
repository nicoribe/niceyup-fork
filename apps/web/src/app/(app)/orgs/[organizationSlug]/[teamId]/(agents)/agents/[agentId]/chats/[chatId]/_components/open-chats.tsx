'use client'

import type {
  Chat,
  ChatParams,
  ConversationExplorerType,
  OrganizationTeamParams,
} from '@/lib/types'
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
import { toast } from 'sonner'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useExplorerTree } from '../../_components/explorer-tree'
import type { PathInExplorer } from '../../_lib/types'

interface OpenChatsStore {
  openChats: { [agentId: string]: Chat[] }
  setOpenChats: (
    agentId: string,
    openChats: Chat[] | ((prevChats: Chat[]) => Chat[]),
  ) => void
}

export const useOpenChats = create<OpenChatsStore>()(
  persist(
    (set) => ({
      openChats: {},
      setOpenChats: (agentId, openChats) =>
        set((state) => ({
          openChats: {
            ...state.openChats,
            [agentId]:
              typeof openChats === 'function'
                ? openChats(state.openChats[agentId] || [])
                : openChats,
          },
        })),
    }),
    {
      name: 'open-chats-storage',
    },
  ),
)

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export function OpenChats({
  chat,
  explorerType,
  pathInExplorer,
}: {
  chat: Chat | null
  explorerType: ConversationExplorerType
  pathInExplorer: PathInExplorer[]
}) {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()

  const { openChats, setOpenChats } = useOpenChats()
  const { revealItemInExplorer, setRevealItemInExplorer } = useExplorerTree()

  const onCloseChat = () => {
    setOpenChats(agentId, (prevChats) =>
      prevChats.filter(({ id }) => id !== chatId),
    )
    redirect(`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`)
  }

  const onCloseAllChats = () => {
    setOpenChats(agentId, [])
    redirect(`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`)
  }

  const onCloseOtherChats = () => {
    setOpenChats(agentId, (prevChats) =>
      prevChats.filter(({ id }) => id === chatId),
    )
  }

  React.useEffect(() => {
    if (chatId === 'new') {
      return
    }

    if (!chat) {
      setOpenChats(agentId, (prevChats) =>
        prevChats.filter(({ id }) => id !== chatId),
      )
      return
    }

    setOpenChats(agentId, (prevChats) => {
      const chatIndex = prevChats.findIndex(({ id }) => id === chat.id)
      if (chatIndex !== -1) {
        prevChats[chatIndex] = chat
        return prevChats
      }

      return [...prevChats, chat]
    })
  }, [chat])

  return (
    <div className="flex flex-row items-center bg-background">
      <div className="no-scrollbar flex flex-1 flex-row items-center gap-1 overflow-x-auto pl-1">
        {openChats[agentId]?.map((chat, index) => {
          const Comp = chatId === chat.id ? 'div' : Link

          return (
            <React.Fragment key={`${chat.id}-${index}`}>
              <Tooltip>
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

              {index !== (openChats[agentId] || []).length - 1 && (
                <Separator
                  orientation="vertical"
                  className="data-[orientation=vertical]:h-4"
                />
              )}
            </React.Fragment>
          )
        })}

        <div className="sticky right-0 flex flex-1 flex-row items-center gap-1 bg-background">
          {!!openChats[agentId]?.length && (
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
          <DropdownMenuTrigger asChild>
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
              disabled={!chat || !!revealItemInExplorer}
              onSelect={async () => {
                if (chat?.teamId !== teamId) {
                  toast.error(
                    'Select the conversation team to reveal the chat in the explorer. Go to Conversation settings to learn more.',
                  )
                  return
                }

                const lastItem = pathInExplorer.at(-1)
                if (lastItem) {
                  setRevealItemInExplorer({
                    explorerType,
                    revealItemInExplorer: {
                      parentIds: pathInExplorer
                        .map(({ id }) => id)
                        .slice(0, -1),
                      id: lastItem.id,
                    },
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
