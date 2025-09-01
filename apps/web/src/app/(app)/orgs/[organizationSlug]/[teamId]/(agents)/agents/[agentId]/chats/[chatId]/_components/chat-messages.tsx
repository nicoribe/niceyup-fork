'use client'

import type {
  MessageStatus as MessageStatusType,
  Message as MessageType,
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
import { Loader } from '@workspace/ui/components/loader'
import {
  Message as UIMessage,
  MessageContent as UIMessageContent,
} from '@workspace/ui/components/message'
import { Response } from '@workspace/ui/components/response'
import { LoaderCircle, XCircle } from 'lucide-react'
import * as React from 'react'
import { useStickToBottomContext } from 'use-stick-to-bottom'
import { useChat } from '../_hooks/use-chat'
import { ChatPromptInput } from './chat-prompt-input'
import { LoadingMessage, LoadingMessages } from './loading-message'

export function ChatMessages({
  initialMessages,
}: {
  initialMessages: MessageType[]
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
                          <Message
                            key={id}
                            message={message}
                            setStatus={setStatus}
                          />
                        )
                      }

                      // Message is already loaded
                      const branchMessage = getMessageById(id)
                      if (branchMessage) {
                        return (
                          <Message
                            key={id}
                            message={branchMessage}
                            setStatus={setStatus}
                          />
                        )
                      }

                      return <LoadingMessage key={id} role={message.role} />
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
              <Message
                key={message.id}
                message={message}
                setStatus={setStatus}
              />
            )
          })}

          {loadingMessage && <LoadingMessages role={loadingMessage.role} />}
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

function Message({
  message,
  setStatus,
}: { message: MessageType; setStatus: (status: PromptInputStatus) => void }) {
  if (
    (message.status === 'queued' || message.status === 'in_progress') &&
    message.metadata?.realtimeRun
  ) {
    return <MessageContentStream message={message} setStatus={setStatus} />
  }

  return <MessageContent message={message} />
}

function MessageContentStream({
  message,
  setStatus,
}: {
  message: MessageType
  setStatus: (status: PromptInputStatus) => void
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
  }, [streams])

  React.useEffect(() => {
    if (run) {
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
            <XCircle className="size-4 text-destructive" />
            {message.role === 'assistant'
              ? 'An error occurred while generating the response.'
              : 'An error occurred while loading the message.'}
          </div>
        </UIMessageContent>
      </UIMessage>
    )
  }

  const messageStream = streams.messageStream?.at(-1)

  if (run?.isQueued || !messageStream) {
    return <Loader />
  }

  function messageStatus(): MessageStatusType {
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
    <MessageContent
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

function MessageContent({
  stream,
  message,
}: { stream?: boolean; message: MessageType }) {
  // Messages from the system are not displayed
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null
  }

  return (
    <UIMessage from={message.role}>
      <UIMessageContent>
        {/* If the message failed and there is no text, display an error message */}
        {message.status === 'failed' && !message.parts?.length && (
          <div className="flex flex-row items-center gap-2">
            <XCircle className="size-4 text-destructive" />
            {message.role === 'assistant'
              ? 'An error occurred while generating the response.'
              : 'An error occurred while loading the message.'}
          </div>
        )}

        {/* If the message is streaming and there is no text, display a loading message */}
        {stream && !message.parts?.length && (
          <div className="flex flex-row items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            <AnimatedDots
              text={message.role === 'assistant' ? 'Generating' : 'Loading'}
            />
          </div>
        )}

        {!!message.parts?.length &&
          message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                // If the message is streaming and there is no text, display a loading message
                if (stream && !part.text) {
                  return (
                    <div className="flex flex-row items-center gap-2">
                      <LoaderCircle className="size-4 animate-spin" />
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
      </UIMessageContent>
    </UIMessage>
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
