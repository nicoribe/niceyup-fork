'use client'

import { useAppearance } from '@/store/use-appearance'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/resizable'
import { cn } from '@workspace/ui/lib/utils'
import * as React from 'react'
import { useComponentSize } from 'react-use-size'

const DEFAULT_MIN_SIZE = 220
const DEFAULT_MAX_SIZE = 30

export function Resizable({
  leftSidebar: leftSidebarComponent,
  rightSidebar: rightSidebarComponent,
  children,
  ...props
}: {
  leftSidebar: React.ReactNode
  rightSidebar: React.ReactNode
  children: React.ReactNode
} & React.ComponentProps<'div'>) {
  const { ref, width } = useComponentSize()

  const { topbar, leftSidebar, rightSidebar } = useAppearance()

  const [minSize, setMinSize] = React.useState(0)
  const [maxLeftSidebarSize, setMaxLeftSidebarSize] = React.useState(0)
  const [maxRightSidebarSize, setMaxRightSidebarSize] = React.useState(0)

  React.useEffect(() => {
    if (width) {
      setMinSize(Math.round((DEFAULT_MIN_SIZE / width) * 100))
    }
  }, [width])

  React.useEffect(() => {
    setMaxLeftSidebarSize(!leftSidebar ? DEFAULT_MAX_SIZE : 0)
  }, [leftSidebar])

  React.useEffect(() => {
    setMaxRightSidebarSize(!rightSidebar ? DEFAULT_MAX_SIZE : 0)
  }, [rightSidebar])

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-row',
        topbar ? 'h-[calc(100vh-90px)]' : 'h-screen',
        props.className,
      )}
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={minSize}
          minSize={minSize}
          maxSize={maxLeftSidebarSize}
          className="flex flex-col border-r bg-background"
        >
          {leftSidebarComponent}
        </ResizablePanel>
        <ResizableHandle className="w-0.1" />
        <ResizablePanel>{children}</ResizablePanel>
        <ResizableHandle className="w-0.1" />
        <ResizablePanel
          defaultSize={minSize}
          minSize={minSize}
          maxSize={maxRightSidebarSize}
          className="flex flex-col border-l bg-background"
        >
          {rightSidebarComponent}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
