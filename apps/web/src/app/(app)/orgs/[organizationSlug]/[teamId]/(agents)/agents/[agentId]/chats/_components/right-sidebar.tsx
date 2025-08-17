import { Button } from '@workspace/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/tooltip'
import { Settings } from 'lucide-react'

export function RightSidebar() {
  return (
    <>
      <div className="z-20 flex flex-row items-center justify-end gap-1 border-b bg-background p-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="size-8">
              <Settings className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-scroll p-2">
        <h1 className="text-sm">Right Sidebar</h1>
      </div>
    </>
  )
}
