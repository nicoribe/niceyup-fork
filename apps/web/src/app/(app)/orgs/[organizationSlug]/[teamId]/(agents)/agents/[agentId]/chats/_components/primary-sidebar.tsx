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
import {
  FilesIcon,
  MessagesSquareIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { PrivateChatList } from './private-chat-list'

type Params = OrganizationTeamParams & { agentId: string }

export async function PrimarySidebar({ params }: { params: Params }) {
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
      <div className="flex flex-row items-center justify-start gap-1 p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="size-8">
              <MessagesSquareIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chats</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <FilesIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Explorer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <SearchIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link
            href={`/orgs/${params.organizationSlug}/${params.teamId}/agents/${params.agentId}/chats/new`}
          >
            <PlusIcon className="size-4" /> New chat
          </Link>
        </Button>

        <Label className="mt-2 px-2 py-1.5 text-muted-foreground text-sm">
          Your chats
        </Label>

        {data?.conversations.length ? (
          <PrivateChatList params={params} initialItems={data.conversations} />
        ) : (
          <p className="py-6 text-center text-muted-foreground text-xs">
            Empty
          </p>
        )}
      </div>
    </div>
  )
}
