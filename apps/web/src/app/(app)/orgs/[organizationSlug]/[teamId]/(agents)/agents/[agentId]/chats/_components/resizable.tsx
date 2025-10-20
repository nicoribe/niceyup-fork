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

const DEFAULT_MIN_SIZE = 220 // 220px
const DEFAULT_MAX_SIZE = 30 // 30% of the width

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

  const [minSidebarSize, setMinSidebarSize] = React.useState(0)

  React.useEffect(() => {
    if (width) {
      setMinSidebarSize(Math.round((DEFAULT_MIN_SIZE / width) * 100))
    }
  }, [width])

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full',
        topbar ? 'h-[calc(100vh-90px)]' : 'h-screen',
        props.className,
      )}
    >
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={0}
          minSize={leftSidebar ? minSidebarSize : 0}
          maxSize={leftSidebar ? DEFAULT_MAX_SIZE : 0}
          className={cn(
            'flex flex-col border-r bg-background',
            !leftSidebar && 'hidden',
          )}
        >
          {leftSidebarComponent}
        </ResizablePanel>

        <ResizableHandle className="w-0.1" />

        <ResizablePanel>{children}</ResizablePanel>

        <ResizableHandle className="w-0.1" />

        <ResizablePanel
          defaultSize={0}
          minSize={rightSidebar ? minSidebarSize : 0}
          maxSize={rightSidebar ? DEFAULT_MAX_SIZE : 0}
          className={cn(
            'flex flex-col border-l bg-background',
            !rightSidebar && 'hidden',
          )}
        >
          {rightSidebarComponent}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
