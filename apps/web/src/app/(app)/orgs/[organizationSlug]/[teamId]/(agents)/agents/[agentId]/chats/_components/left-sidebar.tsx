import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import { Label } from '@workspace/ui/components/label'
import { Separator } from '@workspace/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Files, MessagesSquare, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { ItemChat } from './item-chat'

type Params = OrganizationTeamParams & { agentId: string }

export async function LeftSidebar({ params }: { params: Params }) {
  const { data } = await sdk.listConversations(
    {
      params: {
        organizationSlug: params.organizationSlug,
        teamId: params.teamId,
        agentId: params.agentId,
      },
    },
    { next: { tags: [`agent-${params.agentId}-chats`] } },
  )

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="z-20 flex flex-row items-center justify-start gap-1 p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="size-8">
              <MessagesSquare className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chats</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <Files className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Explorer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <Search className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link
              href={`/orgs/${params.organizationSlug}/${params.teamId}/agents/${params.agentId}/chats/new`}
            >
              <Plus className="size-4" /> New chat
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-1 p-2">
          <Label className="ml-3 font-medium text-muted-foreground text-xs tracking-wide">
            Chats
          </Label>

          {data?.conversations.map((chat) => (
            <ItemChat key={chat.id} chat={chat} />
          ))}

          {data && !data.conversations.length && (
            <h1 className="py-6 text-center text-muted-foreground text-xs">
              Empty
            </h1>
          )}
        </div>
      </div>
    </div>
  )
}
