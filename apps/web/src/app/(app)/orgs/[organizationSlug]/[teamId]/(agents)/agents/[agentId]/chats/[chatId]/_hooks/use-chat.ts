'use client'

import { sdk } from '@/lib/sdk'
import type {
  ChatParams,
  Message,
  MessageRole,
  OrganizationTeamParams,
  PromptInputStatus,
  PromptMessagePart,
} from '@/lib/types'
import type { ScrollToBottom } from '@workspace/ui/components/conversation'
import { useParams, useRouter } from 'next/navigation'
import * as React from 'react'

// Memoized message index for O(1) lookups
const createMessageIndex = (messages: Message[]) => {
  const index = new Map<string, MessagePersisted>()
  const childrenIndex = new Map<string, string[]>()

  for (const message of messages) {
    index.set(message.id, message)

    if (message.parentId) {
      const existing = childrenIndex.get(message.parentId) || []
      existing.push(message.id)
      childrenIndex.set(message.parentId, existing)
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

  while (current.parentId) {
    const parent = messageIndex.get(current.parentId)
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

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

// Memoized branch change handler
const createBranchChangeHandler = (
  params: OrganizationTeamParams & ChatParams,
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

        const { data } = await sdk.listMessages({
          conversationId: params.chatId,
          params: {
            organizationSlug: params.organizationSlug,
            teamId: params.teamId,
            targetMessageId,
          },
        })

        const newMessages = (data?.messages || []) as Message[]

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
    [params, messages, setMessages, setTargetMessageId, setLoadingMessage],
  )
}

type MessagePersisted = Message & { persisted?: false }

export function useChat({
  initialMessages,
  refConversationScroll,
}: {
  initialMessages?: Message[]
  refConversationScroll?: React.RefObject<ScrollToBottom | null>
} = {}) {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()

  const router = useRouter()

  const [allMessages, setAllMessages] = React.useState<MessagePersisted[]>(
    initialMessages || [],
  )
  const [targetMessageId, setTargetMessageId] = React.useState<
    string | undefined
  >(initialMessages?.at(-1)?.id)

  const [loadingMessage, setLoadingMessage] = React.useState<
    { id: string; role: MessageRole } | false
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

  const getPersistentParentMessage = React.useCallback(
    (parentMessageId: string | undefined): MessagePersisted | undefined => {
      if (!parentMessageId) {
        return undefined
      }

      let currentMessage = messageIndexData.index.get(parentMessageId)

      while (currentMessage) {
        if (currentMessage.persisted !== false) {
          return currentMessage
        }

        if (!currentMessage.parentId) {
          break
        }

        currentMessage = messageIndexData.index.get(currentMessage.parentId)
      }

      return undefined
    },
    [messageIndexData.index],
  )

  // Memoized branch change handler
  const handleBranchChange = createBranchChangeHandler(
    { organizationSlug, teamId, chatId },
    allMessages,
    setAllMessages,
    setTargetMessageId,
    setLoadingMessage,
  )

  // Memoized message filtered by targetMessageId
  const messagesFiltered = React.useMemo<MessagePersisted[]>(() => {
    return buildMessageTree(
      targetMessageId,
      loadingMessage,
      messageIndexData.index,
      messageIndexData.childrenIndex,
    )
  }, [targetMessageId, loadingMessage, messageIndexData])

  const [status, setStatus] = React.useState<PromptInputStatus>('ready')

  const sendMessage = async ({ parts }: { parts: PromptMessagePart[] }) => {
    if (status === 'submitted' || status === 'streaming') {
      return
    }

    setStatus('submitted')

    const parentMessageId = messagesFiltered.at(-1)?.id
    const fakeMessageId = Math.random().toString(36).substring(2, 15)

    setAllMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((message) => {
        if (message.id === parentMessageId) {
          return {
            ...message,
            children: [...(message.children || []), fakeMessageId],
          }
        }

        return message
      })

      updatedMessages.push({
        id: fakeMessageId,
        status: 'queued',
        role: 'user',
        parts,
        parentId: parentMessageId,
        persisted: false,
      })

      return updatedMessages
    })

    if (refConversationScroll?.current) {
      refConversationScroll.current.scrollToBottom()
    }

    try {
      const persistentParentMessageId =
        getPersistentParentMessage(parentMessageId)?.id

      const { data, error } = await sdk.sendQuestionMessage({
        conversationId: chatId,
        data: {
          organizationSlug: 'error',
          teamId: 'error',
          agentId: 'error',
          parentMessageId: persistentParentMessageId,
          message: { parts },
          // explorerType,
          // folderIdExplorerTree,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (chatId === 'new') {
        router.push(
          `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/${data.conversationId}`,
        )
      }

      setAllMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((message) => {
          if (message.id === parentMessageId) {
            return {
              ...message,
              children: message.children?.map((id) =>
                id === fakeMessageId ? data.questionMessage.id : id,
              ),
            }
          }

          if (message.id === fakeMessageId) {
            return {
              ...data.questionMessage,
              parentId: message.parentId, // Non-persistent parent message, kept to remain visually hierarchical
            } as Message
          }

          return message
        })

        updatedMessages.push(data.answerMessage as Message)

        return updatedMessages
      })
    } catch {
      setStatus('error')

      setAllMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((message) => {
          if (message.id === fakeMessageId) {
            return {
              ...message,
              status: 'failed',
              metadata: { error: 'Failed to send message' },
            } as Message
          }

          return message
        })

        return updatedMessages
      })
    }
  }

  const resendMessage = async ({
    messageId,
    parts,
  }: { messageId: string; parts: PromptMessagePart[] }) => {
    if (status === 'submitted' || status === 'streaming') {
      return
    }

    setStatus('submitted')

    const message = getMessageById(messageId)

    const parentMessageId = message?.parentId

    if (!parentMessageId) {
      return
    }

    try {
      // TODO: Implement resend message
      console.log('sdk.resendMessage', {
        conversationId: chatId,
        data: {
          organizationSlug,
          teamId,
          agentId,
          parentMessageId,
          message: { parts },
        },
      })
    } catch {
      setStatus('error')
    }
  }

  const regenerate = async ({ messageId }: { messageId: string }) => {
    if (status === 'submitted' || status === 'streaming') {
      return
    }

    setStatus('submitted')

    const message = getMessageById(messageId)

    const parentMessageId = message?.parentId

    if (!parentMessageId) {
      return
    }

    try {
      // TODO: Implement regenerate
      console.log('sdk.regenerateMessage', {
        conversationId: chatId,
        data: {
          organizationSlug,
          teamId,
          agentId,
          parentMessageId,
        },
      })
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
    resendMessage,
    regenerate,
    status,
    setStatus,
  }
}
