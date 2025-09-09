'use client'

import type { OrganizationTeamParams } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Files, Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ExplorerTree } from './explorer-tree'

export function LeftSidebar() {
  // const { loadingAnimation, refresh } = useRefresh()

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="z-20 flex flex-row items-center justify-start gap-1 p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="size-8">
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
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={refresh}
            >
              <RotateCw
                className={cn('size-4', loadingAnimation && 'animate-spin')}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip> */}
      </div>

      <Separator />

      <Explorer />
    </div>
  )
}

function Explorer() {
  const { organizationSlug } = useParams<OrganizationTeamParams>()

  return (
    <div className="flex flex-1 flex-col items-stretch overflow-hidden py-2">
      {organizationSlug !== 'my-account' && (
        <>
          <ExplorerTree explorerType="team" expanded />

          <Separator />
        </>
      )}

      <ExplorerTree explorerType="private" expanded />

      <Separator />

      <ExplorerTree explorerType="shared" />
    </div>
  )
}
