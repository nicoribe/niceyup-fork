'use client'

import { type MessageProps, useChat } from '@/hooks/use-chat'
import type { Message } from '@/lib/types'
import type { MessageRole, MessageStatus } from '@/lib/types'
import { useRealtimeRunWithStreams } from '@workspace/engine/client'
import type {
  STREAMS,
  answerMessageTask,
} from '@workspace/engine/trigger/answer-message'
import { Action, Actions } from '@workspace/ui/components/actions'
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
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@workspace/ui/components/prompt-input'
import { Response } from '@workspace/ui/components/response'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { cn } from '@workspace/ui/lib/utils'
import {
  CopyIcon,
  HeartIcon,
  LoaderCircle,
  type LucideIcon,
  PencilIcon,
  RefreshCcwIcon,
  ShareIcon,
  Sparkles,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XCircle,
} from 'lucide-react'
import { GlobeIcon, MicIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { useStickToBottomContext } from 'use-stick-to-bottom'

type ChatContextType = { authorId?: string } & ReturnType<typeof useChat>

const ChatContext = React.createContext<ChatContextType | undefined>(undefined)

export function useChatContext(): ChatContextType {
  const context = React.useContext(ChatContext)

  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }

  return context
}

export function ChatProvider({
  authorId,
  initialMessages,
  children,
}: {
  authorId?: string
  initialMessages?: Message[]
  children: React.ReactNode
}) {
  const chatHook = useChat({ initialMessages })

  const contextValue: ChatContextType = { authorId, ...chatHook }

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  )
}

export function ChatPromptInput({
  suggestion,
}: {
  suggestion?: string
}) {
  const { sendMessage, status } = useChatContext()

  const [text, setText] = React.useState<string>('')

  React.useEffect(() => {
    if (suggestion) {
      setText(suggestion)
    }
  }, [suggestion])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault()

    if (!text.trim() || status === 'submitted' || status === 'streaming') {
      return
    }

    setText('')

    await sendMessage({
      // parts: [
      //   {
      //     type: 'text',
      //     text: 'Describe the content of the image in detail!',
      //   },
      //   {
      //     type: 'file',
      //     mediaType: 'image/jpeg',
      //     filename: 'two-puppies.jpeg',
      //     url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
      //   },
      // ],
      parts: [{ type: 'text', text }],
    })
  }

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        onChange={(e) => setText(e.target.value)}
        value={text}
      />

      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton>
            <PlusIcon size={16} />
          </PromptInputButton>

          <PromptInputButton>
            <MicIcon size={16} />
          </PromptInputButton>

          <PromptInputButton>
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
        </PromptInputTools>

        <PromptInputSubmit
          status={status}
          disabled={!text.trim() && (status === 'ready' || status === 'error')}
        />
      </PromptInputToolbar>
    </PromptInput>
  )
}

export function ChatConversation() {
  const { messages, getMessageById } = useChatContext()

  return (
    <Conversation className="w-full">
      <ConversationContent className="mx-auto h-20 max-w-3xl">
        {messages.map((message) => {
          const parentMessage = message?.isBranch
            ? getMessageById(message.parentId)
            : undefined

          if (parentMessage) {
            return (
              <ChatMessageBranch
                key={message.id}
                message={message}
                parentMessage={parentMessage}
              />
            )
          }

          return <ChatMessage key={message.id} message={message} />
        })}

        <ChatLoadingMessages />
      </ConversationContent>
      <ConversationScroll />
    </Conversation>
  )
}

function ConversationScroll() {
  const { refConversationScroll } = useChatContext()

  return (
    <ConversationScrollButton refConversationScroll={refConversationScroll} />
  )
}

function ChatMessageBranch({
  message,
  parentMessage,
}: {
  message: MessageProps
  parentMessage: MessageProps
}) {
  const { getMessageById, handleBranchChange } = useChatContext()

  return (
    <Branch
      key={message.id}
      defaultBranch={parentMessage.children?.indexOf(message.id)}
      onBranchChange={async (branchIndex) => {
        const targetMessageId = parentMessage.children?.at(branchIndex)

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
            return <ChatMessage key={id} message={message} />
          }

          // Message is already loaded
          const branchMessage = getMessageById(id)
          if (branchMessage) {
            return <ChatMessage key={id} message={branchMessage} />
          }

          return <ChatLoadingMessage key={id} role={message.role} />
        })}
      </BranchMessages>
    </Branch>
  )
}

function ChatMessage({
  message,
}: {
  message: MessageProps
}) {
  if (message.isStream) {
    return <ChatMessageContentStream message={message} />
  }

  return <ChatMessageContent message={message} />
}

function ChatMessageContentStream({
  message,
}: {
  message: MessageProps
}) {
  const { authorId, setStatus } = useChatContext()

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
    if (run && authorId && authorId === message.metadata?.authorId) {
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
          <div className="flex flex-row items-center gap-2">
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
          <div className="flex flex-row items-center gap-2 not-only:p-2">
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
      message={{ ...messageStream, status: messageStatus() }}
    />
  )
}

type ItemAction = {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
}

function ChatMessageContent({
  message,
}: {
  message: MessageProps
}) {
  const { regenerate } = useChatContext()

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

  const actions = React.useMemo(() => {
    const listActions: ItemAction[] = [
      {
        icon: HeartIcon,
        label: 'Favorite',
        onClick: () => console.log('Favoriting...'),
        disabled: true,
      },
      {
        icon: CopyIcon,
        label: 'Copy',
        onClick: () => {
          const content = message.parts?.find(
            (part) => part.type === 'text',
          )?.text

          navigator.clipboard.writeText(content || '')

          toast.success('Copied to clipboard')
        },
      },
      {
        icon: ShareIcon,
        label: 'Share',
        onClick: () => console.log('Sharing...'),
        disabled: true,
      },
    ]

    if (message.role === 'assistant') {
      listActions.push(
        ...[
          {
            icon: ThumbsUpIcon,
            label: 'Like',
            onClick: () => console.log('Liking...'),
            disabled: true,
          },
          {
            icon: ThumbsDownIcon,
            label: 'Dislike',
            onClick: () => console.log('Disliking...'),
            disabled: true,
          },
          {
            icon: RefreshCcwIcon,
            label: 'Retry',
            onClick: async () => {
              await regenerate({ messageId: message.id })
            },
          },
        ],
      )
    }

    if (message.role === 'user') {
      listActions.push({
        icon: PencilIcon,
        label: 'Edit message',
        onClick: () => console.log('Editing...'),
        disabled: true,
      })
    }

    return listActions
  }, [message])

  return (
    <UIMessage
      className={cn(
        'gap-1 py-0.5',
        'group flex flex-col',
        message.role === 'assistant' ? 'items-start' : 'items-end',
      )}
      from={message.role}
    >
      <UIMessageContent>
        {/* If the message failed and there is no text, display an error message */}
        {message.status === 'failed' && !messageNotEmpty && (
          <div className="flex flex-row items-center gap-2 not-only:p-2">
            <XCircle className="size-4 shrink-0 text-destructive" />
            {message.role === 'assistant'
              ? 'An error occurred while generating the response.'
              : 'An error occurred while loading the message.'}
          </div>
        )}

        {/* If the message is streaming and there is no text, display a loading message */}
        {message.isStream && !messageNotEmpty && (
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
                if (message.isStream && !part.text) {
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

      <Actions>
        {actions.map((action) => (
          <Action
            key={action.label}
            className={cn(
              message.role === 'user' && 'opacity-0 group-hover:opacity-100',
            )}
            label={action.label}
            tooltip={action.label}
            disabled={action.disabled}
          >
            <action.icon className="size-3" />
          </Action>
        ))}

        {message.isBranch && (
          <BranchSelector className="self-center px-0" from={message.role}>
            <BranchPrevious />
            <BranchPage />
            <BranchNext />
          </BranchSelector>
        )}
      </Actions>
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

function ChatLoadingMessages() {
  const { loadingMessage } = useChatContext()

  if (!loadingMessage) {
    return null
  }

  const isUser = loadingMessage.role === 'user'

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
