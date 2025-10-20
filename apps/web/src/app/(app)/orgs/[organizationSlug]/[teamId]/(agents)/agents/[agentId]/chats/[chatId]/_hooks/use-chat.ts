'use client'

import { revalidateTag } from '@/actions/revalidate'
import { useUploadFiles } from '@/hooks/use-upload-files'
import { sdk } from '@/lib/sdk'
import type {
  ChatParams,
  Message,
  MessageNode,
  MessageRole,
  OrganizationTeamParams,
  PromptInputStatus,
  PromptMessagePart,
} from '@/lib/types'
import type { ScrollToBottom } from '@workspace/ui/components/conversation'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'
import { useChatRealtime } from './use-chat-realtime'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export type ChatMessageNode = MessageNode & {
  isBranch?: boolean
  isPersisted?: boolean
}

type ChatLoadingMessage = {
  id: string
  role: MessageRole
}

function hasMultipleChildren(parentNode: MessageNode) {
  return Boolean(parentNode.children?.length && parentNode.children.length > 1)
}

export function isStream(message: Message) {
  return Boolean(
    (message.status === 'queued' || message.status === 'in_progress') &&
      message.role === 'assistant',
  )
}

// Memoized message index for O(1) lookups
const createMessageNodeIndex = (messageNodes: ChatMessageNode[]) => {
  const index = new Map<string, ChatMessageNode>()
  const childrenIndex = new Map<string, string[]>()

  for (const messageNode of messageNodes) {
    if (messageNode.parentId) {
      const existing = childrenIndex.get(messageNode.parentId) || []
      existing.push(messageNode.id)
      childrenIndex.set(messageNode.parentId, existing)
    }
    index.set(messageNode.id, messageNode)
  }

  return { index, childrenIndex }
}

// Optimized nodes building with memoization
const buildMessageNodes = (
  targetNodeId: string | undefined,
  loadingMessage: ChatLoadingMessage | false,
  messageNodeIndex: Map<string, ChatMessageNode>,
  childrenIndex: Map<string, string[]>,
) => {
  if (!targetNodeId) {
    return []
  }

  const targetNode = messageNodeIndex.get(targetNodeId)
  if (!targetNode) {
    return []
  }

  // Handle loading state
  if (loadingMessage) {
    const loadingMessageNode = messageNodeIndex.get(loadingMessage.id)
    if (loadingMessageNode) {
      const ancestorNodes = buildAncestorNodes(
        loadingMessageNode,
        messageNodeIndex,
      )

      const lastAncestorNode = ancestorNodes.at(-1)

      const messageNode = {
        ...targetNode,
        isBranch: lastAncestorNode
          ? hasMultipleChildren(lastAncestorNode)
          : false,
      }

      return [...ancestorNodes, messageNode]
    }
  }

  const ancestorNodes = buildAncestorNodes(targetNode, messageNodeIndex)
  const descendantNodes = buildDescendantNodes(
    targetNode,
    messageNodeIndex,
    childrenIndex,
  )

  const lastAncestorNode = ancestorNodes.at(-1)

  const messageNode = {
    ...targetNode,
    isBranch: lastAncestorNode ? hasMultipleChildren(lastAncestorNode) : false,
  }

  return [...ancestorNodes, messageNode, ...descendantNodes]
}

// Build ancestor nodes chain efficiently
const buildAncestorNodes = (
  messageNode: ChatMessageNode,
  messageNodeIndex: Map<string, ChatMessageNode>,
) => {
  const ancestorNodes: ChatMessageNode[] = []
  let currentNode = messageNode

  while (currentNode.parentId) {
    const parentNode = messageNodeIndex.get(currentNode.parentId)
    if (!parentNode) {
      break
    }

    if (ancestorNodes[0]) {
      ancestorNodes[0].isBranch = hasMultipleChildren(parentNode)
    }

    ancestorNodes.unshift(parentNode)
    currentNode = parentNode
  }

  return ancestorNodes
}

// Build descendant nodes chain efficiently
const buildDescendantNodes = (
  messageNode: ChatMessageNode,
  messageNodeIndex: Map<string, ChatMessageNode>,
  childrenIndex: Map<string, string[]>,
) => {
  const descendantNodes: ChatMessageNode[] = []
  let currentNode = messageNode

  while (true) {
    const [firstChildId] = childrenIndex.get(currentNode.id) || []
    if (!firstChildId) {
      break
    }

    const firstChildNode = messageNodeIndex.get(firstChildId)
    if (!firstChildNode) {
      break
    }

    descendantNodes.push({
      ...firstChildNode,
      isBranch: hasMultipleChildren(firstChildNode),
    })
    currentNode = firstChildNode
  }

  return descendantNodes
}

// Memoized branch change handler
const createBranchChangeHandler = (
  params: Params,
  loadedMessageNodes: ChatMessageNode[],
  upsertLoadedMessageNodes: (messageNodes: ChatMessageNode[]) => void,
  setTargetNodeId: (targetNodeId: string | undefined) => void,
  setLoadingMessage: (loadingMessage: ChatLoadingMessage | false) => void,
) => {
  return React.useCallback(
    async ({
      previousNodeId,
      targetNodeId,
      role,
    }: {
      previousNodeId: string
      targetNodeId: string
      role: MessageRole
    }) => {
      // Check if message node is already loaded using the index
      const messageNodeIndex = createMessageNodeIndex(loadedMessageNodes)
      const targetNode = messageNodeIndex.index.get(targetNodeId)

      if (targetNode) {
        setTargetNodeId(targetNodeId)
        return
      }

      try {
        setLoadingMessage({ id: previousNodeId, role })

        const { data } = await sdk.listMessages({
          conversationId: params.chatId,
          params: {
            organizationSlug: params.organizationSlug,
            teamId: params.teamId,
            agentId: params.agentId,
            targetMessageId: targetNodeId,
          },
        })

        const messageNodes = (data?.messages || []) as ChatMessageNode[]

        upsertLoadedMessageNodes(messageNodes)

        setTargetNodeId(targetNodeId)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingMessage(false)
      }
    },
    [
      params,
      loadedMessageNodes,
      upsertLoadedMessageNodes,
      setTargetNodeId,
      setLoadingMessage,
    ],
  )
}

type SendMessageParams = {
  parts: PromptMessagePart[]
}

type ResendMessageParams = {
  messageId: string
  parts: PromptMessagePart[]
}

type RegenerateMessageParams = {
  messageId: string
}

type UseChatParams = {
  params: Params
  initialMessages?: MessageNode[]
  explorerNode?: {
    visibility: 'private' | 'team'
    folderId?: string | null
  }
}

export function useChat({
  params,
  initialMessages,
  explorerNode,
}: UseChatParams) {
  const router = useRouter()

  const refConversationScroll = React.useRef<ScrollToBottom | null>(null)

  const [loadedMessageNodes, setLoadedMessageNodes] = React.useState<
    ChatMessageNode[]
  >(initialMessages || [])
  const [targetNodeId, setTargetNodeId] = React.useState<string | undefined>(
    initialMessages?.at(-1)?.id,
  )

  const [loadingMessage, setLoadingMessage] = React.useState<
    ChatLoadingMessage | false
  >(false)

  const upsertLoadedMessageNodes = (messageNodes: ChatMessageNode[]) => {
    setLoadedMessageNodes((prevMessageNodes) => {
      const updatedMessageNodes = [...prevMessageNodes]
      const indexById = new Map(updatedMessageNodes.map((mn, i) => [mn.id, i]))
      let changed = false

      for (const messageNode of messageNodes) {
        const idx = indexById.get(messageNode.id)
        if (idx !== undefined) {
          if (updatedMessageNodes[idx] !== messageNode) {
            updatedMessageNodes[idx] = messageNode
            changed = true
          }
        } else {
          indexById.set(messageNode.id, updatedMessageNodes.length)
          updatedMessageNodes.push(messageNode)
          changed = true
        }
      }

      return changed ? updatedMessageNodes : prevMessageNodes
    })
  }

  const { messages: messageNodesRealtime, error: errorRealtime } =
    useChatRealtime({ params })

  React.useEffect(() => {
    if (errorRealtime) {
      toast.error(errorRealtime)
    }
  }, [errorRealtime])

  React.useEffect(() => {
    if (messageNodesRealtime.length) {
      upsertLoadedMessageNodes(messageNodesRealtime)
    }
  }, [messageNodesRealtime])

  // Memoized message node index
  const messageNodeIndex = React.useMemo(
    () => createMessageNodeIndex(loadedMessageNodes),
    [loadedMessageNodes],
  )

  // Memoized message node lookup function
  const getMessageNodeById = React.useCallback(
    (id: string | null | undefined) => {
      if (!id) {
        return undefined
      }

      return messageNodeIndex.index.get(id)
    },
    [messageNodeIndex.index],
  )

  const updateMessageNodeById = (
    messageNodeId: string,
    messageNode: Partial<Omit<ChatMessageNode, 'id'>>,
  ) => {
    setLoadedMessageNodes((prevMessageNodes) => {
      return prevMessageNodes.map((prevMessageNode) =>
        prevMessageNode.id === messageNodeId
          ? { ...prevMessageNode, ...messageNode }
          : prevMessageNode,
      )
    })
  }

  const getPersistentParentNode = React.useCallback(
    (parentNodeId: string | undefined): ChatMessageNode | undefined => {
      if (!parentNodeId) {
        return undefined
      }

      let currentNode = messageNodeIndex.index.get(parentNodeId)

      while (currentNode) {
        if (currentNode.isPersisted !== false) {
          return currentNode
        }

        if (!currentNode.parentId) {
          break
        }

        currentNode = messageNodeIndex.index.get(currentNode.parentId)
      }

      return undefined
    },
    [messageNodeIndex.index],
  )

  // Memoized branch change handler
  const handleBranchChange = createBranchChangeHandler(
    params,
    loadedMessageNodes,
    upsertLoadedMessageNodes,
    setTargetNodeId,
    setLoadingMessage,
  )

  // Memoized message node chain filtered by targetNodeId
  const messageNodeChain = React.useMemo<ChatMessageNode[]>(() => {
    return buildMessageNodes(
      targetNodeId,
      loadingMessage,
      messageNodeIndex.index,
      messageNodeIndex.childrenIndex,
    )
  }, [targetNodeId, loadingMessage, messageNodeIndex])

  const [promptInputStatus, setPromptInputStatus] =
    React.useState<PromptInputStatus>('ready')

  const generateFakeNodeId = () => {
    return Math.random().toString(36).substring(2, 15)
  }

  const addFakeNode = ({
    type,
    parentNodeId,
    fakeNodeId,
    parts,
  }:
    | {
        type: 'question'
        parentNodeId?: string
        fakeNodeId: string
        parts: PromptMessagePart[]
      }
    | {
        type: 'answer'
        parentNodeId: string
        fakeNodeId: string
        parts?: never
      }) => {
    setLoadedMessageNodes((prevMessageNodes) => {
      const updatedMessageNodes = prevMessageNodes.map((messageNode) => {
        if (messageNode.id === parentNodeId) {
          return {
            ...messageNode,
            children: [...(messageNode.children || []), fakeNodeId],
          }
        }

        return messageNode
      })

      updatedMessageNodes.push({
        id: fakeNodeId,
        status: 'queued',
        role: type === 'question' ? 'user' : 'assistant',
        parts: type === 'question' ? parts : [],
        parentId: parentNodeId,
        isPersisted: false,
      })

      return updatedMessageNodes
    })
  }

  const replaceFakeNode = ({
    type,
    parentNodeId,
    fakeNodeId,
    questionMessageNode,
    answerMessageNode,
  }:
    | {
        type: 'question'
        parentNodeId?: string
        fakeNodeId: string
        questionMessageNode: ChatMessageNode
        answerMessageNode: ChatMessageNode
      }
    | {
        type: 'answer'
        parentNodeId: string
        fakeNodeId: string
        questionMessageNode?: never
        answerMessageNode: ChatMessageNode
      }) => {
    setLoadedMessageNodes((prevMessageNodes) => {
      const updatedMessageNodes = prevMessageNodes.map((messageNode) => {
        if (messageNode.id === parentNodeId) {
          return {
            ...messageNode,
            children: messageNode.children?.map((id) =>
              id === fakeNodeId
                ? type === 'question'
                  ? questionMessageNode.id
                  : answerMessageNode.id
                : id,
            ),
          }
        }

        if (messageNode.id === fakeNodeId) {
          return {
            ...(type === 'question' ? questionMessageNode : answerMessageNode),
            parentId: messageNode.parentId, // Non-persistent parent node, kept to remain visually hierarchical
          }
        }

        return messageNode
      })

      if (type === 'question') {
        updatedMessageNodes.push(answerMessageNode)
      }

      return updatedMessageNodes
    })
  }

  const setErrorFakeNode = ({
    type,
    fakeNodeId,
  }: {
    type: 'question' | 'answer'
    fakeNodeId: string
  }) => {
    setLoadedMessageNodes((prevMessageNodes) => {
      const updatedMessageNodes = prevMessageNodes.map((messageNode) => {
        if (messageNode.id === fakeNodeId) {
          return {
            ...messageNode,
            status: 'failed',
            metadata: {
              error:
                type === 'question'
                  ? 'Failed to send message'
                  : 'Failed to generate answer',
            },
          } as ChatMessageNode
        }

        return messageNode
      })

      return updatedMessageNodes
    })
  }

  const sendMessage = async ({ parts }: SendMessageParams) => {
    if (
      uploading ||
      promptInputStatus === 'submitted' ||
      promptInputStatus === 'streaming'
    ) {
      return
    }

    setPromptInputStatus('submitted')

    const parentNodeId = messageNodeChain.at(-1)?.id
    const fakeNodeId = generateFakeNodeId()

    addFakeNode({ type: 'question', parentNodeId, fakeNodeId, parts })

    refConversationScroll.current?.scrollToBottom()

    try {
      const persistentParentNodeId = getPersistentParentNode(parentNodeId)?.id

      const { data, error } = await sdk.sendQuestionMessage({
        conversationId: params.chatId,
        data: {
          organizationSlug: params.organizationSlug,
          teamId: params.teamId,
          agentId: params.agentId,
          parentMessageId: persistentParentNodeId,
          message: { parts },
          explorerNode,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (params.chatId === 'new') {
        await revalidateTag(`agent-${params.agentId}-chats`)

        router.push(
          `/orgs/${params.organizationSlug}/${params.teamId}/agents/${params.agentId}/chats/${data.conversationId}`,
        )
      }

      replaceFakeNode({
        type: 'question',
        parentNodeId,
        fakeNodeId,
        questionMessageNode: data.questionMessage as ChatMessageNode,
        answerMessageNode: data.answerMessage as ChatMessageNode,
      })
    } catch {
      setPromptInputStatus('error')

      setErrorFakeNode({ type: 'question', fakeNodeId })
    }
  }

  const resendMessage = async ({ messageId, parts }: ResendMessageParams) => {
    if (
      uploading ||
      promptInputStatus === 'submitted' ||
      promptInputStatus === 'streaming'
    ) {
      return
    }

    setPromptInputStatus('submitted')

    const messageNode = getMessageNodeById(messageId)

    const parentNodeId = messageNode?.parentId

    if (!parentNodeId) {
      return
    }

    const fakeNodeId = generateFakeNodeId()

    addFakeNode({ type: 'question', parentNodeId, fakeNodeId, parts })

    setTargetNodeId(fakeNodeId)

    refConversationScroll.current?.scrollToBottom()

    try {
      const persistentParentNodeId = getPersistentParentNode(parentNodeId)?.id

      if (!persistentParentNodeId) {
        return
      }

      const { data, error } = await sdk.resendQuestionMessage({
        conversationId: params.chatId,
        data: {
          organizationSlug: params.organizationSlug,
          teamId: params.teamId,
          agentId: params.agentId,
          parentMessageId: persistentParentNodeId,
          message: { parts },
          // referenceMessageId: message.isPersisted === false ? undefined : message.id,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      replaceFakeNode({
        type: 'question',
        parentNodeId,
        fakeNodeId,
        questionMessageNode: data.questionMessage as ChatMessageNode,
        answerMessageNode: data.answerMessage as ChatMessageNode,
      })

      setTargetNodeId(data.questionMessage.id)
    } catch {
      setPromptInputStatus('error')

      setErrorFakeNode({ type: 'question', fakeNodeId })
    }
  }

  const regenerate = async ({ messageId }: RegenerateMessageParams) => {
    if (
      uploading ||
      promptInputStatus === 'submitted' ||
      promptInputStatus === 'streaming'
    ) {
      return
    }

    setPromptInputStatus('submitted')

    const messageNode = getMessageNodeById(messageId)

    const parentNodeId = messageNode?.parentId

    if (!parentNodeId) {
      return
    }

    const fakeNodeId = generateFakeNodeId()

    addFakeNode({ type: 'answer', parentNodeId, fakeNodeId })

    setTargetNodeId(fakeNodeId)

    refConversationScroll.current?.scrollToBottom()

    try {
      const persistentParentNodeId = getPersistentParentNode(parentNodeId)?.id

      if (!persistentParentNodeId) {
        return
      }

      const { data, error } = await sdk.regenerateAnswerMessage({
        conversationId: params.chatId,
        data: {
          organizationSlug: params.organizationSlug,
          teamId: params.teamId,
          agentId: params.agentId,
          parentMessageId: persistentParentNodeId,
          // referenceMessageId: message.isPersisted === false ? undefined : message.id,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      replaceFakeNode({
        type: 'answer',
        parentNodeId,
        fakeNodeId,
        answerMessageNode: data.answerMessage as ChatMessageNode,
      })

      setTargetNodeId(data.answerMessage.id)
    } catch {
      setPromptInputStatus('error')

      setErrorFakeNode({ type: 'answer', fakeNodeId })
    }
  }

  const { uploading, uploadFiles } = useUploadFiles(
    { organizationSlug: params.organizationSlug, teamId: params.teamId },
    {
      bucket: 'default',
      scope: 'conversations',
      metadata: {
        agentId: params.agentId,
        conversationId: params.chatId !== 'new' ? params.chatId : null,
      },
      accept: 'application/pdf,image/*,video/*,audio/*',
      expires: 5 * 60, // 5 minutes
    },
  )

  return {
    messages: messageNodeChain,
    loadingMessage,
    getMessageNodeById,
    updateMessageNodeById,
    handleBranchChange,
    refConversationScroll,
    sendMessage,
    resendMessage,
    regenerate,
    promptInputStatus,
    setPromptInputStatus,
    uploading,
    uploadFiles,
  }
}
