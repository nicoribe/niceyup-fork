import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Settings } from 'lucide-react'

export async function RightSidebar() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="z-20 flex flex-row items-center justify-end gap-1 p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="size-8">
              <Settings className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-2">
        <h1 className="py-6 text-center text-muted-foreground text-xs">
          Coming soon
        </h1>
      </div>
    </div>
  )
}
