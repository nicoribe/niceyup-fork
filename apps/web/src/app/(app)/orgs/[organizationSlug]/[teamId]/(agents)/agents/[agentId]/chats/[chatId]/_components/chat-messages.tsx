'use client'

import type {
  Message,
  MessageRole,
  MessageStatus,
  PromptInputStatus,
} from '@/lib/types'
import { useRealtimeRunWithStreams } from '@workspace/engine/client'
import type {
  STREAMS,
  answerMessageTask,
} from '@workspace/engine/trigger/answer-message'
import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from '@workspace/ui/components/branch'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@workspace/ui/components/conversation'
import {
  Message as UIMessage,
  MessageContent as UIMessageContent,
} from '@workspace/ui/components/message'
import { Response } from '@workspace/ui/components/response'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { LoaderCircle, Sparkles, XCircle } from 'lucide-react'
import * as React from 'react'
import { useStickToBottomContext } from 'use-stick-to-bottom'
import { useChat } from '../_hooks/use-chat'
import { ChatPromptInput } from './chat-prompt-input'

export function ChatMessages({
  userId,
  initialMessages,
}: {
  userId: string
  initialMessages: Message[]
}) {
  const refConversationScroll = React.useRef(null)

  const {
    messages,
    loadingMessage,
    getMessageById,
    handleBranchChange,
    sendMessage,
    status,
    setStatus,
  } = useChat({
    initialMessages,
    refConversationScroll,
  })

  return (
    <div className="relative flex size-full flex-col items-center divide-y overflow-hidden">
      <Conversation className="w-full">
        <ConversationContent className="mx-auto h-20 max-w-3xl">
          {messages.map((message) => {
            const parentMessage = getMessageById(message.parentId)
            const isBranch =
              parentMessage?.children && parentMessage.children.length > 1

            if (isBranch) {
              return (
                <Branch
                  key={message.id}
                  defaultBranch={parentMessage.children?.indexOf(message.id)}
                  onBranchChange={async (branchIndex) => {
                    const targetMessageId =
                      parentMessage.children?.at(branchIndex)

                    if (!targetMessageId) {
                      return
                    }

                    await handleBranchChange({
                      previousMessageId: message.id,
                      targetMessageId,
                      role: message.role,
                    })
                  }}
                >
                  <BranchMessages>
                    {parentMessage.children?.map((id) => {
                      if (id === message.id) {
                        return (
                          <ChatMessage
                            key={id}
                            message={message}
                            setStatus={setStatus}
                            userId={userId}
                          />
                        )
                      }

                      // Message is already loaded
                      const branchMessage = getMessageById(id)
                      if (branchMessage) {
                        return (
                          <ChatMessage
                            key={id}
                            message={branchMessage}
                            setStatus={setStatus}
                            userId={userId}
                          />
                        )
                      }

                      return <ChatLoadingMessage key={id} role={message.role} />
                    })}
                  </BranchMessages>

                  <BranchSelector from={message.role}>
                    <BranchPrevious />
                    <BranchPage />
                    <BranchNext />
                  </BranchSelector>
                </Branch>
              )
            }

            return (
              <ChatMessage
                key={message.id}
                message={message}
                setStatus={setStatus}
                userId={userId}
              />
            )
          })}

          {loadingMessage && <ChatLoadingMessages role={loadingMessage.role} />}
        </ConversationContent>
        <ConversationScrollButton
          refConversationScroll={refConversationScroll}
        />
      </Conversation>

      <div className="grid w-full max-w-3xl shrink-0 gap-4 p-4">
        <ChatPromptInput status={status} sendMessage={sendMessage} />
      </div>
    </div>
  )
}

function ChatMessage({
  message,
  setStatus,
  userId,
}: {
  message: Message
  setStatus: (status: PromptInputStatus) => void
  userId: string
}) {
  if (
    (message.status === 'queued' || message.status === 'in_progress') &&
    message.metadata?.realtimeRun
  ) {
    return (
      <ChatMessageContentStream
        message={message}
        setStatus={setStatus}
        userId={userId}
      />
    )
  }

  return <ChatMessageContent message={message} />
}

function ChatMessageContentStream({
  message,
  setStatus,
  userId,
}: {
  message: Message
  setStatus: (status: PromptInputStatus) => void
  userId: string
}) {
  const { streams, run, error } = useRealtimeRunWithStreams<
    typeof answerMessageTask,
    STREAMS
  >(message.metadata?.realtimeRun?.id, {
    accessToken: message.metadata?.realtimeRun?.publicAccessToken,
  })

  const { scrollToBottom } = useStickToBottomContext()

  React.useEffect(() => {
    scrollToBottom({ preserveScrollPosition: true })
  }, [streams, run])

  React.useEffect(() => {
    if (run && userId === message.metadata?.authorId) {
      if (run.isQueued) {
        setStatus('submitted')
      } else if (run.isExecuting) {
        setStatus('streaming')
      } else if (run.isFailed) {
        setStatus('error')
      } else if (run.isCompleted) {
        setStatus('ready')
      }
    }
  }, [run])

  if (error) {
    return (
      <UIMessage from={message.role}>
        <UIMessageContent>
          <div className="flex flex-row items-center gap-2 p-2">
            <XCircle className="size-4 shrink-0 text-destructive" />
            An error occurred while retrieving the message.
          </div>
        </UIMessageContent>
      </UIMessage>
    )
  }

  if (run?.error || run?.isFailed) {
    return (
      <UIMessage from={message.role}>
        <UIMessageContent>
          <div className="flex flex-row items-center gap-2 p-2">
            <XCircle className="size-4 shrink-0 text-destructive" />
            {message.role === 'assistant'
              ? 'An error occurred while generating the response.'
              : 'An error occurred while loading the message.'}
          </div>
          {run?.error && <ChatErrorResponse errorMessage={run.error.message} />}
        </UIMessageContent>
      </UIMessage>
    )
  }

  const messageStream = streams.messageStream?.at(-1)

  if (run?.isQueued || !messageStream) {
    return (
      <UIMessage from={message.role}>
        <UIMessageContent>
          <LoaderCircle className="size-4 shrink-0 animate-spin" />
        </UIMessageContent>
      </UIMessage>
    )
  }

  function messageStatus(): MessageStatus {
    if (run?.isCancelled) {
      return 'stopped'
    }

    if (run?.isFailed) {
      return 'failed'
    }

    if (run?.isSuccess) {
      return 'finished'
    }

    return 'in_progress'
  }

  return (
    <ChatMessageContent
      stream
      message={{
        id: messageStream.id,
        status: messageStatus(),
        role: messageStream.role,
        parts: messageStream.parts,
      }}
    />
  )
}

function ChatMessageContent({
  stream,
  message,
}: {
  stream?: boolean
  message: Message
}) {
  // Messages from the system are not displayed
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null
  }

  // Check if the message is not empty
  const messageNotEmpty = React.useMemo(() => {
    if (
      (message.status === 'queued' || message.status === 'in_progress') &&
      message.parts?.every((part) => part.type !== 'text')
    ) {
      return false
    }

    return !!message.parts?.length
  }, [message.status, message.parts])

  return (
    <UIMessage from={message.role}>
      <UIMessageContent>
        {/* If the message failed and there is no text, display an error message */}
        {message.status === 'failed' && !messageNotEmpty && (
          <div className="flex flex-row items-center gap-2 p-2">
            <XCircle className="size-4 shrink-0 text-destructive" />
            {message.role === 'assistant'
              ? 'An error occurred while generating the response.'
              : 'An error occurred while loading the message.'}
          </div>
        )}

        {/* If the message is streaming and there is no text, display a loading message */}
        {stream && !messageNotEmpty && (
          <div className="flex flex-row items-center gap-2">
            <Sparkles className="size-4 shrink-0 animate-pulse" />
            <AnimatedDots
              text={message.role === 'assistant' ? 'Generating' : 'Loading'}
            />
          </div>
        )}

        {messageNotEmpty &&
          message.parts?.map((part, i) => {
            switch (part.type) {
              case 'text':
                // If the message is streaming and there is no text, display a loading message
                if (stream && !part.text) {
                  return (
                    <div className="flex flex-row items-center gap-2">
                      <Sparkles className="size-4 shrink-0 animate-pulse" />
                      <AnimatedDots
                        text={
                          message.role === 'assistant'
                            ? 'Generating response'
                            : 'Loading message'
                        }
                      />
                    </div>
                  )
                }

                return (
                  <Response
                    key={`${part.type}-${i}`}
                    className="[&_[data-streamdown='code-block']]:bg-background"
                  >
                    {part.text}
                  </Response>
                )
              default:
                return null
            }
          })}

        {message.status === 'failed' && message.metadata?.error && (
          <ChatErrorResponse errorMessage={message.metadata?.error} />
        )}
      </UIMessageContent>
    </UIMessage>
  )
}

function ChatErrorResponse({ errorMessage }: { errorMessage?: unknown }) {
  return (
    <Response className="rounded-md bg-destructive/50 px-3 pt-3 [&_[data-streamdown='code-block']]:bg-background">
      {`**Error message:**\n\`\`\`json\n${JSON.stringify(errorMessage, null, 2)}\n\`\`\``}
    </Response>
  )
}

function ChatLoadingMessage({ role }: { role: MessageRole }) {
  return (
    <UIMessage from={role}>
      <UIMessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
        <Skeleton className="w-40" />
      </UIMessageContent>
    </UIMessage>
  )
}

function ChatLoadingMessages({ role }: { role: MessageRole }) {
  const isUser = role === 'user'

  return (
    <>
      <UIMessage from={isUser ? 'assistant' : 'user'}>
        <UIMessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
          <Skeleton className="w-40" />
          <Skeleton className="w-70" />
          <Skeleton className="w-50" />
        </UIMessageContent>
      </UIMessage>
      <UIMessage from={isUser ? 'user' : 'assistant'}>
        <UIMessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
          <Skeleton className="w-25" />
          <Skeleton className="w-40" />
        </UIMessageContent>
      </UIMessage>
      <UIMessage from={isUser ? 'assistant' : 'user'}>
        <UIMessageContent className="*:h-5 *:opacity-5 *:group-[.is-assistant]:bg-primary *:group-[.is-user]:bg-secondary">
          <Skeleton className="w-40" />
          <Skeleton className="w-30" />
          <Skeleton className="w-60" />
        </UIMessageContent>
      </UIMessage>
    </>
  )
}

function AnimatedDots({ text }: { text: string }) {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const dots = ['...', '..', '.', '..'][step]

  return (
    <span className="flex flex-row items-center gap-1">
      {text}
      <span className="w-4 select-none">{dots}</span>
    </span>
  )
}
