import type { MessageRole } from '@/lib/types'
import { Message, MessageContent } from '@workspace/ui/components/message'
import { Skeleton } from '@workspace/ui/components/skeleton'

export function LoadingMessage({ role }: { role: MessageRole }) {
  return (
    <Message from={role}>
      <MessageContent>
        <Skeleton className="h-5 w-40 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
      </MessageContent>
    </Message>
  )
}

export function LoadingMessages({ role }: { role: MessageRole }) {
  return (
    <>
      <Message from={role === 'user' ? 'assistant' : 'user'}>
        <MessageContent>
          <Skeleton className="h-5 w-40 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
          <Skeleton className="h-5 w-70 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
          <Skeleton className="h-5 w-50 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
        </MessageContent>
      </Message>
      {/* <Message from={role === 'user' ? 'user' : 'assistant'}>
          <MessageContent>
            <Skeleton className="h-5 w-25 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
            <Skeleton className="h-5 w-40 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
          </MessageContent>
        </Message>
        <Message from={role === 'user' ? 'assistant' : 'user'}>
          <MessageContent>
            <Skeleton className="h-5 w-40 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
            <Skeleton className="h-5 w-30 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
            <Skeleton className="h-5 w-60 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
          </MessageContent>
        </Message> */}
    </>
  )
}
