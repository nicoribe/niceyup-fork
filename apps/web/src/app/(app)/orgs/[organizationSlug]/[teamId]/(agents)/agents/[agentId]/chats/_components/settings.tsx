'use client'

import { useAppearance } from '@/store/use-appearance'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { SettingsIcon } from 'lucide-react'
import { PanelLeftIcon, PanelRightIcon, PanelTopIcon } from 'lucide-react'

export function Settings() {
  const {
    topbar,
    primarySidebar,
    secondarySidebar,
    setTopbar,
    setPrimarySidebar,
    setSecondarySidebar,
  } = useAppearance()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <SettingsIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTopbar(!topbar)}>
          <PanelTopIcon className="size-4" />
          Top Bar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPrimarySidebar(!primarySidebar)}>
          <PanelLeftIcon className="size-4" />
          Primary Sidebar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setSecondarySidebar(!secondarySidebar)}
        >
          <PanelRightIcon className="size-4" />
          Secondary Sidebar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
