'use client'

import { revalidateTag } from '@/actions/revalidate'
import { sdk } from '@/lib/sdk'
import type { Chat, OrganizationTeamParams } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Input } from '@workspace/ui/components/input'
import { cn } from '@workspace/ui/lib/utils'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

type Params = OrganizationTeamParams & { agentId: string } & { chatId: string }

export function ItemChat({ chat }: { chat: Chat }) {
  const params = useParams<Params>()
  const router = useRouter()

  const [newTitle, setNewTitle] = React.useState(chat.title)
  const [renaming, setRenaming] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const refInput = React.useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    if (loading) {
      return
    }

    if (!newTitle.trim() || newTitle === chat.title) {
      return handleCancel()
    }

    setLoading(true)

    try {
      const { error } = await sdk.updateConversation({
        conversationId: chat.id,
        data: {
          organizationSlug: params.organizationSlug,
          teamId: params.teamId,
          agentId: params.agentId,
          title: newTitle.trim(),
        },
      })

      if (error) {
        setNewTitle(chat.title)

        toast.error(error.message)
      } else {
        await revalidateTag(`chat-${chat.id}`)

        setRenaming(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setNewTitle(chat.title)
    setRenaming(false)
  }

  const onKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      await handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()

      handleCancel()
    }
  }

  const onBlur = async () => {
    await handleSave()
  }

  const onRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenaming(true)

    // Fix: The renaming input is not focused
    setTimeout(() => refInput.current?.focus(), 300)
  }

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    setLoading(true)

    try {
      const { error } = await sdk.deleteConversation({
        conversationId: chat.id,
        data: {
          organizationSlug: params.organizationSlug,
          teamId: params.teamId,
          agentId: params.agentId,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        await revalidateTag(`agent-${params.agentId}-chats`)

        router.push(
          `/orgs/${params.organizationSlug}/${params.teamId}/agents/${params.agentId}/chats/new`,
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      className={cn('group/chat h-8 w-full gap-0', renaming && 'bg-muted')}
      asChild
    >
      <Link
        href={`/orgs/${params.organizationSlug}/${params.teamId}/agents/${params.agentId}/chats/${chat.id}`}
      >
        <span
          className={cn(
            'flex-1 truncate',
            chat.id === params.chatId && 'font-bold',
            renaming && 'hidden',
          )}
        >
          {newTitle}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  !renaming &&
                    'ml-2 hidden size-6 rounded-sm hover:bg-foreground/10 group-hover/chat:block',
                  renaming && 'hidden',
                )}
                disabled={loading}
              >
                <MoreVertical className="ml-1 size-4" />
              </Button>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {renaming && (
          <Input
            ref={refInput}
            className="border-none shadow-none"
            placeholder="Enter a new title"
            value={newTitle}
            onClick={(e) => e.preventDefault()}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            disabled={loading}
          />
        )}
      </Link>
    </Button>
  )
}
