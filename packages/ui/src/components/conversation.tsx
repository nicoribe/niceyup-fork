'use client'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { ArrowDownIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import * as React from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

export type ConversationProps = ComponentProps<typeof StickToBottom>

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn('relative flex-1 overflow-y-auto', className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
)

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content className={cn('p-4', className)} {...props} />
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export type ScrollToBottom = {
  scrollToBottom: ReturnType<typeof useStickToBottomContext>['scrollToBottom']
}

export const ConversationScrollButton = ({
  refConversationScroll,
  className,
  ...props
}: ConversationScrollButtonProps & {
  refConversationScroll?: React.RefObject<ScrollToBottom | null>
}) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  React.useImperativeHandle(refConversationScroll, () => ({
    scrollToBottom: () => scrollToBottom(),
  }))

  const handleScrollToBottom = React.useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  return (
    !isAtBottom && (
      <Button
        className={cn(
          'absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full',
          className,
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  )
}
