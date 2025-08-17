import { Button } from '@workspace/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Files, RefreshCw, Search } from 'lucide-react'
import { Explorer } from './explorer'

export function LeftSidebar() {
  return (
    <>
      <div className="z-20 flex flex-row items-center justify-start gap-1 border-b bg-background p-1 px-2">
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
            <Button variant="ghost" size="icon" className="size-8">
              <RefreshCw className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-scroll p-2">
        <Explorer />
      </div>
    </>
  )
}
