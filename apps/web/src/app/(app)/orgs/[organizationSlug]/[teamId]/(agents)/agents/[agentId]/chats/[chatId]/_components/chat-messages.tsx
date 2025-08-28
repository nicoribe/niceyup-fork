'use client'

import {
  type MessageRole,
  type Message as MessageType,
  listMessages,
} from '@/actions/messages'
import type { ChatParams } from '@/lib/types'
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
import { Message, MessageContent } from '@workspace/ui/components/message'
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@workspace/ui/components/prompt-input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { GlobeIcon, MicIcon, PlusIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import * as React from 'react'

// Memoized message index for O(1) lookups
const createMessageIndex = (messages: MessageType[]) => {
  const index = new Map<string, MessageType>()
  const childrenIndex = new Map<string, string[]>()

  for (const message of messages) {
    index.set(message.id, message)

    if (message.parent_id) {
      const existing = childrenIndex.get(message.parent_id) || []
      existing.push(message.id)
      childrenIndex.set(message.parent_id, existing)
    }
  }

  return { index, childrenIndex }
}

// Optimized tree building with memoization
const buildMessageTree = (
  targetMessageId: string | undefined,
  loadingMessage: { id: string; role: MessageRole } | false,
  messageIndex: Map<string, MessageType>,
  childrenIndex: Map<string, string[]>,
) => {
  if (!targetMessageId) {
    return []
  }

  const targetMessage = messageIndex.get(targetMessageId)
  if (!targetMessage) {
    return []
  }

  // Handle loading state
  if (loadingMessage) {
    const loadingMsg = messageIndex.get(loadingMessage.id)
    if (loadingMsg) {
      const ancestors = buildAncestors(loadingMsg, messageIndex)
      return [...ancestors, loadingMsg]
    }
  }

  const ancestors = buildAncestors(targetMessage, messageIndex)
  const descendants = buildDescendants(
    targetMessage,
    messageIndex,
    childrenIndex,
  )

  return [...ancestors, targetMessage, ...descendants]
}

// Build ancestors chain efficiently
const buildAncestors = (
  message: MessageType,
  messageIndex: Map<string, MessageType>,
) => {
  const ancestors: MessageType[] = []
  let current = message

  while (current.parent_id) {
    const parent = messageIndex.get(current.parent_id)
    if (!parent) {
      break
    }
    ancestors.unshift(parent)
    current = parent
  }

  return ancestors
}

// Build descendants chain efficiently
const buildDescendants = (
  message: MessageType,
  messageIndex: Map<string, MessageType>,
  childrenIndex: Map<string, string[]>,
) => {
  const descendants: MessageType[] = []
  let current = message

  while (true) {
    const children = childrenIndex.get(current.id) || []
    if (children.length === 0) {
      break
    }

    const firstChildId = children[0]
    if (!firstChildId) {
      break
    }

    const firstChild = messageIndex.get(firstChildId)
    if (!firstChild) {
      break
    }

    descendants.push(firstChild)
    current = firstChild
  }

  return descendants
}

// Memoized branch change handler
const createBranchChangeHandler = (
  chatId: string,
  messages: MessageType[],
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  setTargetMessageId: React.Dispatch<React.SetStateAction<string | undefined>>,
  setLoadingMessage: React.Dispatch<
    React.SetStateAction<{ id: string; role: MessageRole } | false>
  >,
) => {
  return React.useCallback(
    async ({
      previousMessageId,
      targetMessageId,
      role,
    }: {
      previousMessageId: string
      targetMessageId: string
      role: MessageRole
    }) => {
      // Check if message is already loaded using the index
      const messageIndex = createMessageIndex(messages)
      const targetMessage = messageIndex.index.get(targetMessageId)

      if (targetMessage) {
        setTargetMessageId(targetMessageId)
        return
      }

      try {
        setLoadingMessage({ id: previousMessageId, role })

        const newMessages = await listMessages({
          conversationId: chatId,
          targetMessageId,
        })

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages]

          for (const newMessage of newMessages) {
            const existingIndex = updatedMessages.findIndex(
              ({ id }) => id === newMessage.id,
            )
            if (existingIndex >= 0) {
              updatedMessages[existingIndex] = newMessage
            } else {
              updatedMessages.push(newMessage)
            }
          }

          return updatedMessages
        })

        setTargetMessageId(targetMessageId)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingMessage(false)
      }
    },
    [chatId, messages, setMessages, setTargetMessageId, setLoadingMessage],
  )
}

type LoadingMessage = {
  id: string
  role: MessageRole
}

type PromptInputStatus = 'submitted' | 'streaming' | 'ready' | 'error'

const models = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-2', name: 'Claude 2' },
  { id: 'claude-instant', name: 'Claude Instant' },
  { id: 'palm-2', name: 'PaLM 2' },
  { id: 'llama-2-70b', name: 'Llama 2 70B' },
  { id: 'llama-2-13b', name: 'Llama 2 13B' },
  { id: 'cohere-command', name: 'Command' },
  { id: 'mistral-7b', name: 'Mistral 7B' },
] as const

export function ChatMessages({
  initialMessages,
}: {
  initialMessages: MessageType[]
}) {
  const { chatId } = useParams<ChatParams>()

  const [messages, setMessages] = React.useState<MessageType[]>(initialMessages)
  const [targetMessageId, setTargetMessageId] = React.useState<
    string | undefined
  >(initialMessages.at(-1)?.id)

  const [loadingMessage, setLoadingMessage] = React.useState<
    LoadingMessage | false
  >(false)

  // Memoized message index
  const messageIndexData = React.useMemo(
    () => createMessageIndex(messages),
    [messages],
  )

  // Memoized message tree
  const messageTree = React.useMemo(() => {
    return buildMessageTree(
      targetMessageId,
      loadingMessage,
      messageIndexData.index,
      messageIndexData.childrenIndex,
    )
  }, [targetMessageId, loadingMessage, messageIndexData])

  // Memoized branch change handler
  const handleBranchChange = createBranchChangeHandler(
    chatId,
    messages,
    setMessages,
    setTargetMessageId,
    setLoadingMessage,
  )

  // Memoized message lookup function
  const getMessageById = React.useCallback(
    (id: string) => {
      return messageIndexData.index.get(id)
    },
    [messageIndexData.index],
  )

  const [text, setText] = React.useState<string>('')
  const [model, setModel] = React.useState<string>(models[0].id)
  const [status, setStatus] = React.useState<PromptInputStatus>('ready')

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    if (!text) {
      return
    }

    setStatus('submitted')

    setTimeout(() => {
      setStatus('streaming')
    }, 200)

    setTimeout(() => {
      setStatus('ready')
    }, 2000)
  }

  return (
    <div className="relative flex size-full flex-col items-center divide-y overflow-hidden">
      <Conversation className="w-full">
        <ConversationContent className="mx-auto h-20 max-w-4xl">
          {messageTree.map((message) => {
            const parentMessage = message.parent_id
              ? getMessageById(message.parent_id)
              : undefined
            const isBranch = parentMessage && parentMessage.children.length > 1

            if (isBranch) {
              return (
                <Branch
                  defaultBranch={parentMessage.children.indexOf(message.id)}
                  onBranchChange={async (branchIndex) => {
                    const targetMessageId =
                      parentMessage.children.at(branchIndex)

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
                    {parentMessage.children.map((id) => {
                      if (id === message.id) {
                        return (
                          <Message from={message.role} key={id}>
                            <MessageContent>{message.content}</MessageContent>
                          </Message>
                        )
                      }

                      // Message is already loaded
                      const branchMessage = getMessageById(id)
                      if (branchMessage) {
                        return (
                          <Message from={branchMessage.role} key={id}>
                            <MessageContent>
                              {branchMessage.content}
                            </MessageContent>
                          </Message>
                        )
                      }

                      return (
                        <Message from={message.role} key={id}>
                          <MessageContent>
                            <Skeleton className="h-5 w-40 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
                          </MessageContent>
                        </Message>
                      )
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
              <Message from={message.role} key={message.id}>
                <MessageContent>{message.content}</MessageContent>
              </Message>
            )
          })}

          {loadingMessage && <LoadingMessage role={loadingMessage.role} />}
          {/* {status === 'submitted' && <Loader />} */}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid w-full max-w-4xl shrink-0 gap-4 p-4">
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
              <PromptInputModelSelect onValueChange={setModel} value={model}>
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}

function LoadingMessage({ role }: { role: MessageRole }) {
  return (
    <>
      <Message from={role === 'user' ? 'assistant' : 'user'}>
        <MessageContent>
          <Skeleton className="h-5 w-30 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
          <Skeleton className="h-5 w-60 opacity-5 group-[.is-assistant]:bg-primary group-[.is-user]:bg-secondary" />
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
