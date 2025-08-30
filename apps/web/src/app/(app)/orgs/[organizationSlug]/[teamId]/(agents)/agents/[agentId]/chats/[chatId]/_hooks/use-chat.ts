import { listMessages, sendQuestionMessage } from '@/actions/messages'
import type { Message, MessageRole } from '@/lib/types'
import * as React from 'react'

// Memoized message index for O(1) lookups
const createMessageIndex = (messages: Message[]) => {
  const index = new Map<string, Message>()
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
  messageIndex: Map<string, Message>,
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
  message: Message,
  messageIndex: Map<string, Message>,
) => {
  const ancestors: Message[] = []
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
  message: Message,
  messageIndex: Map<string, Message>,
  childrenIndex: Map<string, string[]>,
) => {
  const descendants: Message[] = []
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
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
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

export function useChat({
  chatId,
  initialMessages,
}: { chatId: string; initialMessages?: Message[] }) {
  const [allMessages, setAllMessages] = React.useState<Message[]>(
    initialMessages || [],
  )
  const [targetMessageId, setTargetMessageId] = React.useState<
    string | undefined
  >(initialMessages?.at(-1)?.id)

  const [loadingMessage, setLoadingMessage] = React.useState<
    LoadingMessage | false
  >(false)

  // Memoized message index
  const messageIndexData = React.useMemo(
    () => createMessageIndex(allMessages),
    [allMessages],
  )

  // Memoized message lookup function
  const getMessageById = React.useCallback(
    (id: string | null | undefined) => {
      if (!id) {
        return undefined
      }

      return messageIndexData.index.get(id)
    },
    [messageIndexData.index],
  )

  // Memoized branch change handler
  const handleBranchChange = createBranchChangeHandler(
    chatId,
    allMessages,
    setAllMessages,
    setTargetMessageId,
    setLoadingMessage,
  )

  // Memoized message filtered by targetMessageId
  const messagesFiltered = React.useMemo(() => {
    return buildMessageTree(
      targetMessageId,
      loadingMessage,
      messageIndexData.index,
      messageIndexData.childrenIndex,
    )
  }, [targetMessageId, loadingMessage, messageIndexData])

  const [status, setStatus] = React.useState<PromptInputStatus>('ready')

  const [handle, setHandle] = React.useState<{
    id: string
    publicAccessToken: string
    taskIdentifier: string
  }>()

  const sendMessage = async (text: string) => {
    try {
      setStatus('submitted')

      const { handle } = await sendQuestionMessage({
        conversationId: chatId,
        message: {
          content: text,
        },
      })

      setHandle(handle)

      setStatus('streaming')

      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  return {
    messages: messagesFiltered,
    loadingMessage,
    getMessageById,
    handleBranchChange,
    sendMessage,
    status,
    setStatus,

    // In Dev
    handle,
    setHandle,
  }
}
