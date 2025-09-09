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
import { useExplorerTree } from '../../_components/explorer-tree'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export type MessageProps = Message & {
  isBranch?: boolean
  isStream?: boolean
  isPersisted?: boolean
}

function isBranch(message: Message) {
  return Boolean(message.children?.length && message.children.length > 1)
}

function isStream(message: Message) {
  return Boolean(
    (message.status === 'queued' || message.status === 'in_progress') &&
      message.metadata?.realtimeRun?.id,
  )
}

// Memoized message index for O(1) lookups
const createMessageIndex = (messages: Message[]) => {
  const index = new Map<string, MessageProps>()
  const childrenIndex = new Map<string, string[]>()

  for (const message of messages) {
    if (message.parentId) {
      const existing = childrenIndex.get(message.parentId) || []
      existing.push(message.id)
      childrenIndex.set(message.parentId, existing)
    }
    index.set(message.id, message)
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

      const lastAncestor = ancestors.at(-1)

      const message = {
        ...targetMessage,
        isBranch: lastAncestor ? isBranch(lastAncestor) : false,
        isStream: isStream(targetMessage),
      }

      return [...ancestors, message]
    }
  }

  const ancestors = buildAncestors(targetMessage, messageIndex)
  const descendants = buildDescendants(
    targetMessage,
    messageIndex,
    childrenIndex,
  )

  const lastAncestor = ancestors.at(-1)

  const message = {
    ...targetMessage,
    isBranch: lastAncestor ? isBranch(lastAncestor) : false,
    isStream: isStream(targetMessage),
  }

  return [...ancestors, message, ...descendants]
}

// Build ancestors chain efficiently
const buildAncestors = (
  message: Message,
  messageIndex: Map<string, Message>,
) => {
  const ancestors: MessageProps[] = []
  let current = message

  while (current.parentId) {
    const parent = messageIndex.get(current.parentId)
    if (!parent) {
      break
    }

    if (ancestors[0]) {
      ancestors[0].isBranch = isBranch(parent)
      ancestors[0].isStream = isStream(current)
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
  const descendants: MessageProps[] = []
  let current = message

  while (true) {
    const [firstChildId] = childrenIndex.get(current.id) || []
    if (!firstChildId) {
      break
    }

    const firstChild = messageIndex.get(firstChildId)
    if (!firstChild) {
      break
    }

    descendants.push({
      ...firstChild,
      isBranch: isBranch(message),
      isStream: isStream(firstChild),
    })
    current = firstChild
  }

  return descendants
}

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

export type SendMessageParams = {
  parts: PromptMessagePart[]
}

export type ResendMessageParams = {
  messageId: string
  parts: PromptMessagePart[]
}

export type RegenerateMessageParams = {
  messageId: string
}

export function useChat({
  initialMessages,
}: {
  initialMessages?: Message[]
} = {}) {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()
  const router = useRouter()

  const { selectedExplorerType, selectedFolder, setRevealItemInExplorer } =
    useExplorerTree()

  const refConversationScroll = React.useRef<ScrollToBottom | null>(null)

  const [allMessages, setAllMessages] = React.useState<MessageProps[]>(
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

  const updateMessageById = (
    messageId: string,
    message: Partial<Omit<Message, 'id'>>,
  ) => {
    setAllMessages((prevMessages) => {
      return prevMessages.map((prevMessage) =>
        prevMessage.id === messageId
          ? { ...prevMessage, ...message }
          : prevMessage,
      )
    })
  }

  const getPersistentParentMessage = React.useCallback(
    (parentMessageId: string | undefined): MessageProps | undefined => {
      if (!parentMessageId) {
        return undefined
      }

      let currentMessage = messageIndexData.index.get(parentMessageId)

      while (currentMessage) {
        if (currentMessage.isPersisted !== false) {
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
  const messagesFiltered = React.useMemo<MessageProps[]>(() => {
    return buildMessageTree(
      targetMessageId,
      loadingMessage,
      messageIndexData.index,
      messageIndexData.childrenIndex,
    )
  }, [targetMessageId, loadingMessage, messageIndexData])

  const [status, setStatus] = React.useState<PromptInputStatus>('ready')

  const generateFakeMessageId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const addFakeMessage = ({
    type,
    parentMessageId,
    fakeMessageId,
    parts,
  }:
    | {
        type: 'question'
        parentMessageId?: string
        fakeMessageId: string
        parts: PromptMessagePart[]
      }
    | {
        type: 'answer'
        parentMessageId: string
        fakeMessageId: string
        parts?: never
      }) => {
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
        role: type === 'question' ? 'user' : 'assistant',
        parts: type === 'question' ? parts : [],
        parentId: parentMessageId,
        isPersisted: false,
      })

      return updatedMessages
    })
  }

  const replaceFakeMessage = ({
    type,
    parentMessageId,
    fakeMessageId,
    questionMessage,
    answerMessage,
  }:
    | {
        type: 'question'
        parentMessageId?: string
        fakeMessageId: string
        questionMessage: Message
        answerMessage: Message
      }
    | {
        type: 'answer'
        parentMessageId: string
        fakeMessageId: string
        questionMessage?: never
        answerMessage: Message
      }) => {
    setAllMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((message) => {
        if (message.id === parentMessageId) {
          return {
            ...message,
            children: message.children?.map((id) =>
              id === fakeMessageId
                ? type === 'question'
                  ? questionMessage.id
                  : answerMessage.id
                : id,
            ),
          }
        }

        if (message.id === fakeMessageId) {
          return {
            ...(type === 'question' ? questionMessage : answerMessage),
            parentId: message.parentId, // Non-persistent parent message, kept to remain visually hierarchical
          }
        }

        return message
      })

      if (type === 'question') {
        updatedMessages.push(answerMessage)
      }

      return updatedMessages
    })
  }

  const setErrorFakeMessage = ({
    type,
    fakeMessageId,
  }: {
    type: 'question' | 'answer'
    fakeMessageId: string
  }) => {
    setAllMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((message) => {
        if (message.id === fakeMessageId) {
          return {
            ...message,
            status: 'failed',
            metadata: {
              error:
                type === 'question'
                  ? 'Failed to send message'
                  : 'Failed to generate answer',
            },
          } as Message
        }

        return message
      })

      return updatedMessages
    })
  }

  const sendMessage = async ({ parts }: SendMessageParams) => {
    if (status === 'submitted' || status === 'streaming') {
      return
    }

    setStatus('submitted')

    const parentMessageId = messagesFiltered.at(-1)?.id
    const fakeMessageId = generateFakeMessageId()

    addFakeMessage({ type: 'question', parentMessageId, fakeMessageId, parts })

    refConversationScroll.current?.scrollToBottom()

    // If chat is new, we need to reveal the item in the explorer tree
    const explorerType =
      selectedExplorerType === 'shared' ? 'private' : selectedExplorerType
    const pathFolderIdExplorerTree = selectedFolder.map(({ id }) => id)

    try {
      const persistentParentMessageId =
        getPersistentParentMessage(parentMessageId)?.id

      const { data, error } = await sdk.sendQuestionMessage({
        conversationId: chatId,
        data: {
          organizationSlug,
          teamId,
          agentId,
          parentMessageId: persistentParentMessageId,
          message: { parts },
          ...(chatId === 'new'
            ? {
                explorerTree: {
                  explorerType,
                  folderId: pathFolderIdExplorerTree.at(-1),
                },
              }
            : {}),
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (chatId === 'new') {
        if (data.explorerTree) {
          setRevealItemInExplorer({
            explorerType,
            revealItemInExplorer: {
              parentIds: pathFolderIdExplorerTree,
              id: data.explorerTree.itemId,
            },
          })
        }

        router.push(
          `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/${data.conversationId}`,
        )
      }

      replaceFakeMessage({
        type: 'question',
        parentMessageId,
        fakeMessageId,
        questionMessage: data.questionMessage as Message,
        answerMessage: data.answerMessage as Message,
      })
    } catch {
      setStatus('error')

      setErrorFakeMessage({ type: 'question', fakeMessageId })
    }
  }

  const resendMessage = async ({ messageId, parts }: ResendMessageParams) => {
    if (status === 'submitted' || status === 'streaming') {
      return
    }

    setStatus('submitted')

    const message = getMessageById(messageId)

    const parentMessageId = message?.parentId

    if (!parentMessageId) {
      return
    }

    const fakeMessageId = generateFakeMessageId()

    addFakeMessage({ type: 'question', parentMessageId, fakeMessageId, parts })

    setTargetMessageId(fakeMessageId)

    refConversationScroll.current?.scrollToBottom()

    try {
      const persistentParentMessageId =
        getPersistentParentMessage(parentMessageId)?.id

      if (!persistentParentMessageId) {
        return
      }

      console.log('sdk.resendMessage', {
        conversationId: chatId,
        data: {
          organizationSlug,
          teamId,
          agentId,
          parentMessageId: persistentParentMessageId,
          message: { parts },
        },
      })

      throw new Error('Implement resend message')

      // const { data, error } = await sdk.resendMessage({
      //   conversationId: chatId,
      //   data: {
      //     organizationSlug,
      //     teamId,
      //     agentId,
      //     parentMessageId: persistentParentMessageId,
      //     message: { parts },
      //   },
      // })

      // if (error) {
      //   throw new Error(error.message)
      // }

      // replaceFakeMessage({
      //   type: 'question',
      //   parentMessageId,
      //   fakeMessageId,
      //   questionMessage: data.questionMessage as Message,
      //   answerMessage: data.answerMessage as Message,
      // })
    } catch {
      setStatus('error')

      setErrorFakeMessage({ type: 'question', fakeMessageId })
    }
  }

  const regenerate = async ({ messageId }: RegenerateMessageParams) => {
    if (status === 'submitted' || status === 'streaming') {
      return
    }

    setStatus('submitted')

    const message = getMessageById(messageId)

    const parentMessageId = message?.parentId

    if (!parentMessageId) {
      return
    }

    const fakeMessageId = generateFakeMessageId()

    addFakeMessage({ type: 'answer', parentMessageId, fakeMessageId })

    setTargetMessageId(fakeMessageId)

    refConversationScroll.current?.scrollToBottom()

    try {
      const persistentParentMessageId =
        getPersistentParentMessage(parentMessageId)?.id

      if (!persistentParentMessageId) {
        return
      }

      console.log('sdk.regenerateMessage', {
        conversationId: chatId,
        data: {
          organizationSlug,
          teamId,
          agentId,
          parentMessageId: persistentParentMessageId,
        },
      })

      throw new Error('Implement regenerate message')

      // const { data, error } = await sdk.regenerateMessage({
      //   conversationId: chatId,
      //   data: {
      //     organizationSlug,
      //     teamId,
      //     agentId,
      //     parentMessageId: persistentParentMessageId,
      //   },
      // })

      // if (error) {
      //   throw new Error(error.message)
      // }

      // replaceFakeMessage({
      //   type: 'answer',
      //   parentMessageId,
      //   fakeMessageId,
      //   answerMessage: data.answerMessage as Message,
      // })
    } catch {
      setStatus('error')

      setErrorFakeMessage({ type: 'answer', fakeMessageId })
    }
  }

  return {
    messages: messagesFiltered,
    loadingMessage,
    getMessageById,
    updateMessageById,
    handleBranchChange,
    sendMessage,
    resendMessage,
    regenerate,
    status,
    setStatus,
    refConversationScroll,
  }
}
