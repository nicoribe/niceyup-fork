import { getMembership, getOrganizationTeam } from '@/actions/organizations'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'
import { Avatar, AvatarFallback } from '@workspace/ui/components/avatar'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { CirclePlus, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug, teamId } = await params

  const member = await getMembership({ organizationSlug })

  if (organizationSlug !== 'my-account' && teamId === '~' && !member?.isAdmin) {
    return redirect(`/orgs/${organizationSlug}/~/select-team`)
  }

  if (teamId !== '~') {
    const organizationTeam = await getOrganizationTeam({
      organizationSlug,
      teamId,
    })

    if (organizationSlug !== 'my-account' && !organizationTeam) {
      return <OrganizationNotFound />
    }
  }

  const { data } = await sdk.listAgents({
    params: { organizationSlug, teamId },
  })

  return (
    <div className="flex size-full flex-1 flex-col">
      <div className="border-b bg-background p-4">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="md:max-w-sm">
              <h2 className="font-semibold text-sm">Agents</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Manage your AI agents across different workflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href={`/orgs/${organizationSlug}/${teamId}/agents/create`}>
                New agent
                <CirclePlus className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 p-4">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          {data?.agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/orgs/${organizationSlug}/${teamId}/agents/${agent.id}/chats`}
              className="group/card flex cursor-pointer flex-col gap-2 rounded-xl border bg-background p-4"
            >
              <div className="flex flex-row items-center justify-between gap-2">
                <Avatar className="size-8 rounded-sm">
                  <AvatarFallback className="rounded-sm" />
                </Avatar>

                <span className="line-clamp-2 w-full font-semibold text-sm">
                  {agent.name}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 transition-opacity group-hover/card:opacity-100"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/orgs/${organizationSlug}/${teamId}/agents/${agent.id}/settings`}
                      >
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="line-clamp-3 text-muted-foreground text-sm">
                AI Assistant for general tasks and automation
              </p>

              <div className="flex flex-wrap gap-2">
                {['OpenAI', 'Google', 'Anthropic'].map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="line-clamp-1 text-muted-foreground text-xs">
                Last trained 12 hours ago
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
