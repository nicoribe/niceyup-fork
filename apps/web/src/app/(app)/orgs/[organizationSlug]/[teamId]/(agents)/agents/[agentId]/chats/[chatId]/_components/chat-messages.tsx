'use client'

import type { MessagePart, Message as MessageType } from '@/lib/types'
import type { ChatParams } from '@/lib/types'
import { useRealtimeRunWithStreams } from '@workspace/engine/client'
import type { STREAMS, answerTask } from '@workspace/engine/trigger/answer'
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
import { Message, MessageContent } from '@workspace/ui/components/message'
import { Response } from '@workspace/ui/components/response'
import { useParams } from 'next/navigation'
import { useChat } from '../_hooks/use-chat'
import { LoadingMessage, LoadingMessages } from './loading-message'
import { SendMessage } from './send-message'

export function ChatMessages({
  initialMessages,
}: {
  initialMessages: MessageType[]
}) {
  const { chatId } = useParams<ChatParams>()

  const {
    messages,
    loadingMessage,
    getMessageById,
    handleBranchChange,
    status,
    sendMessage,
    handle,
  } = useChat({ chatId, initialMessages })

  return (
    <div className="relative flex size-full flex-col items-center divide-y overflow-hidden">
      <Conversation className="w-full">
        <ConversationContent className="mx-auto h-20 max-w-3xl">
          {messages.map((message) => {
            const parentMessage = getMessageById(message.parent_id)
            const isBranch =
              parentMessage?.children && parentMessage.children.length > 1

            if (isBranch) {
              return (
                <Branch
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
                  key={message.id}
                >
                  <BranchMessages>
                    {parentMessage.children?.map((id) => {
                      if (id === message.id) {
                        return <ChatMessage message={message} key={id} />
                      }

                      // Message is already loaded
                      const branchMessage = getMessageById(id)
                      if (branchMessage) {
                        return <ChatMessage message={branchMessage} key={id} />
                      }

                      return <LoadingMessage role={message.role} key={id} />
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

            return <ChatMessage message={message} key={message.id} />
          })}

          {loadingMessage && <LoadingMessages role={loadingMessage.role} />}

          <StreamAnswer handle={handle} />

          {status === 'submitted' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid w-full max-w-3xl shrink-0 gap-4 p-4">
        <SendMessage status={status} sendMessage={sendMessage} />
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: MessageType }) {
  // Messages from the system are not displayed
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null
  }

  let content: MessagePart[] = []

  if (!Array.isArray(message.content)) {
    content =
      typeof message.content === 'string'
        ? [{ type: 'text', text: message.content }]
        : [message.content]
  } else {
    content = message.content
  }

  return (
    <Message from={message.role}>
      <MessageContent>
        {content.map((part, i) => {
          switch (part.type) {
            case 'text': // we don't use any reasoning or tool calls in this example
              return (
                <Response
                  className="[&_[data-streamdown='code-block']]:bg-background"
                  key={`${part.type}-${i}`}
                >
                  {part.text}
                </Response>
              )
            default:
              return null
          }
        })}
      </MessageContent>
    </Message>
  )
}

function StreamAnswer({
  handle,
}: {
  handle:
    | { id: string; publicAccessToken: string; taskIdentifier: string }
    | undefined
}) {
  if (!handle) {
    return null
  }

  // Stream the response from the streamingResult task
  const { streams, run } = useRealtimeRunWithStreams<
    typeof answerTask,
    STREAMS
  >(handle.id, {
    accessToken: handle.publicAccessToken,
  })

  console.log('streams', streams)

  if (streams.content) {
    return (
      <ChatMessage
        message={{
          id: '1',
          role: 'assistant',
          content: streams.content.join(''),
          status: run?.status === 'COMPLETED' ? 'finished' : 'in_progress',
        }}
      />
    )
  }
}
