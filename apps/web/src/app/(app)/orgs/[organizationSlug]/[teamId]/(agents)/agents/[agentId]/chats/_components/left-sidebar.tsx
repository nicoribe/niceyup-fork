'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/utils'
import { Files, RotateCw, Search } from 'lucide-react'
import { ExplorerTree } from './explorer-tree'
import { Refresh, useRefresh } from './refresh'

export function LeftSidebar() {
  const { loadingAnimation, refresh } = useRefresh()

  return (
    <>
      <div className="z-20 flex flex-row items-center justify-start gap-1 border-b bg-background p-1">
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
        <Tooltip>
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
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-scroll p-2">
        <Refresh>
          <ExplorerTree />
        </Refresh>
      </div>
    </>
  )
}
