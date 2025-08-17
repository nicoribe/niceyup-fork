'use client'

import { useAppearance } from '@/store/use-appearance'
import { Button } from '@workspace/ui/components/button'
import { PanelLeft, PanelRight, PanelTop } from 'lucide-react'

export function Appearance() {
  const {
    topbar,
    leftSidebar,
    rightSidebar,
    setTopbar,
    setLeftSidebar,
    setRightSidebar,
  } = useAppearance()

  return (
    <div className="flex flex-row items-center gap-1 p-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setLeftSidebar(!leftSidebar)}
      >
        <PanelLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setTopbar(!topbar)}
      >
        <PanelTop className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setRightSidebar(!rightSidebar)}
      >
        <PanelRight className="size-4" />
      </Button>
    </div>
  )
}
