import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { sendUserMessageToAssistant } from '@/http/functions/ai-assistant'
import {
  createConversationExplorerNodeItem,
  getConversationExplorerNodeFolder,
} from '@/http/functions/explorer-nodes/conversation-explorer-nodes'
import { generateTitleFromUserMessage } from '@/http/functions/generate-title-from-user-message'
import {
  getNamespaceContext,
  getOrganizationContext,
} from '@/http/functions/organization-context'
import { authenticate } from '@/http/middlewares/authenticate'
import type { FastifyTypedInstance } from '@/types/fastify'
import {
  aiMessageMetadataSchema,
  aiMessagePartSchema,
  aiMessageRoleSchema,
  aiMessageStatusSchema,
} from '@workspace/ai/schemas'
import type { AIMessageMetadata } from '@workspace/ai/types'
import { db } from '@workspace/db'
import { and, desc, eq, isNull } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import { conversations, messages } from '@workspace/db/schema'
import { conversationPubSub } from '@workspace/realtime/pubsub'
import { z } from 'zod'

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
})

const filePartSchema = z.object({
  type: z.literal('file'),
  mediaType: z.string(),
  filename: z.string().optional(),
  url: z.string(),
})

const promptMessagePartSchema = z.union([textPartSchema, filePartSchema])

const messageSchema = z.object({
  id: z.string(),
  status: aiMessageStatusSchema,
  role: aiMessageRoleSchema,
  parts: z.array(aiMessagePartSchema).nullable(),
  metadata: aiMessageMetadataSchema.nullable(),
  authorId: z.string().nullish(),
  parentId: z.string().nullish(),
  children: z.array(z.string()).optional(),
})

export async function sendMessage(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/conversations/:conversationId/messages/send',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Send a user message to a conversation',
        operationId: 'sendMessage',
        params: z.object({
          conversationId: z.string(),
        }),
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          agentId: z.string(),
          parentMessageId: z.string().nullish(),
          message: z.object({
            parts: z.array(promptMessagePartSchema).nonempty(),
            metadata: aiMessageMetadataSchema.nullish(),
          }),
          explorerNode: z
            .object({
              visibility: z.enum(['private', 'team']),
              folderId: z.string().nullish(),
            })
            .optional()
            .describe('Used only when conversation is created'),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              conversationId: z.string(),
              userMessage: messageSchema,
              assistantMessage: messageSchema,
              explorerNode: z
                .object({
                  itemId: z.string(),
                })
                .optional()
                .describe('Return only when the conversation is created'),
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { conversationId } = request.params

      const {
        organizationId,
        organizationSlug,
        teamId,
        agentId,
        parentMessageId,
        message,
        explorerNode,
      } = request.body

      const context = await getOrganizationContext({
        userId,
        organizationId,
        organizationSlug,
        teamId,
      })

      if (explorerNode?.visibility === 'team' && !context.teamId) {
        throw new BadRequestError({
          code: 'TEAM_ID_REQUIRED',
          message:
            'Team is required when the explorer node visibility is set to "team"',
        })
      }

      const ownerTypeCondition =
        explorerNode?.visibility === 'team'
          ? { ownerTeamId: context.teamId }
          : { ownerUserId: context.userId }

      if (conversationId === 'new') {
        const checkAccessToAgent = await queries.context.getAgent(context, {
          agentId,
        })

        if (!checkAccessToAgent) {
          throw new BadRequestError({
            code: 'AGENT_NOT_FOUND',
            message: 'Agent not found or you don’t have access',
          })
        }

        if (explorerNode?.folderId && explorerNode.folderId !== 'root') {
          const folderExplorerNode = await getConversationExplorerNodeFolder({
            id: explorerNode.folderId,
            visibility: explorerNode.visibility,
            agentId,
            ...ownerTypeCondition,
          })

          if (!folderExplorerNode) {
            throw new BadRequestError({
              code: 'FOLDER_IN_EXPLORER_NOT_FOUND',
              message: 'Folder in explorer not found or you don’t have access',
            })
          }
        }
      } else {
        const conversation = await queries.context.getConversation(context, {
          agentId,
          conversationId,
        })

        if (!conversation) {
          throw new BadRequestError({
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found or you don’t have access',
          })
        }
      }

      let _conversationId = conversationId
      let _parentMessageId = parentMessageId

      const { userMessage, assistantMessage, itemExplorerNode } =
        await db.transaction(async (tx) => {
          let _itemExplorerNode = null

          if (conversationId === 'new') {
            let title = message.parts.find((part) => part.type === 'text')?.text

            if (title) {
              title = await generateTitleFromUserMessage({ userMessage: title })
            }

            const [conversation] = await tx
              .insert(conversations)
              .values({
                agentId,
                title,
                ...ownerTypeCondition,
              })
              .returning({
                id: conversations.id,
              })

            if (!conversation) {
              throw new BadRequestError({
                code: 'CONVERSATION_NOT_CREATED',
                message: 'Conversation not created',
              })
            }

            _conversationId = conversation.id

            // TODO: make this dynamic based on the agent's configuration
            const systemMessageText = `You are a helpful assistant. Check your knowledge base before answering any questions.
Only respond to questions using information from tool calls.
if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`

            const [systemMessage] = await tx
              .insert(messages)
              .values({
                conversationId: conversation.id,
                status: 'finished',
                role: 'system',
                parts: [
                  {
                    type: 'text',
                    text: systemMessageText,
                  },
                ],
              })
              .returning({
                id: messages.id,
              })

            if (!systemMessage) {
              throw new BadRequestError({
                code: 'SYSTEM_MESSAGE_NOT_CREATED',
                message: 'System message not created',
              })
            }

            _parentMessageId = systemMessage.id

            // Create a new conversation in the explorerNode
            if (explorerNode) {
              const itemExplorerNode = await createConversationExplorerNodeItem(
                {
                  agentId,
                  visibility: explorerNode.visibility,
                  parentId: explorerNode.folderId,
                  conversationId: conversation.id,
                  ...ownerTypeCondition,
                },
                tx,
              )

              _itemExplorerNode = itemExplorerNode
            }
          } else {
            const [parentMessage] = await tx
              .select({
                id: messages.id,
              })
              .from(messages)
              .where(
                and(
                  eq(messages.conversationId, _conversationId),
                  parentMessageId
                    ? eq(messages.id, parentMessageId)
                    : undefined,
                  isNull(messages.deletedAt),
                ),
              )
              .orderBy(desc(messages.createdAt))
              .limit(1)

            if (!parentMessage) {
              throw new BadRequestError({
                code: 'PARENT_MESSAGE_NOT_FOUND',
                message: 'Parent message not found',
              })
            }

            _parentMessageId = parentMessage.id
          }

          const [userMessage] = await tx
            .insert(messages)
            .values({
              conversationId: _conversationId,
              status: 'finished',
              role: 'user',
              parts: message.parts,
              metadata: message.metadata as AIMessageMetadata,
              authorId: userId,
              parentId: _parentMessageId,
            })
            .returning({
              id: messages.id,
              status: messages.status,
              role: messages.role,
              parts: messages.parts,
              metadata: messages.metadata,
              authorId: messages.authorId,
              parentId: messages.parentId,
            })

          if (!userMessage) {
            throw new BadRequestError({
              code: 'USER_MESSAGE_NOT_CREATED',
              message: 'User message not created',
            })
          }

          const [assistantMessage] = await tx
            .insert(messages)
            .values({
              conversationId: _conversationId,
              status: 'queued',
              role: 'assistant',
              parts: [],
              metadata: {
                authorId: userId,
              },
              parentId: userMessage.id,
            })
            .returning({
              id: messages.id,
              status: messages.status,
              role: messages.role,
              parts: messages.parts,
              metadata: messages.metadata,
              authorId: messages.authorId,
              parentId: messages.parentId,
            })

          if (!assistantMessage) {
            throw new BadRequestError({
              code: 'ASSISTANT_MESSAGE_NOT_CREATED',
              message: 'Assistant message not created',
            })
          }

          return {
            userMessage: { ...userMessage, children: [assistantMessage.id] },
            assistantMessage: { ...assistantMessage, children: [] },
            itemExplorerNode: _itemExplorerNode,
          }
        })

      // TODO: make this dynamic based on the agent's configuration
      const contextMessages = true
      const maxContextMessages = 10

      sendUserMessageToAssistant({
        namespace: getNamespaceContext(context),
        conversationId: _conversationId,
        userMessage: {
          id: userMessage.id,
          parts: message.parts,
        },
        assistantMessage,
        agentConfiguration: {
          contextMessages,
          maxContextMessages,
        },
      })

      conversationPubSub.publish({
        channel: `conversations:${_conversationId}:updated`,
        messages: [userMessage, assistantMessage],
      })

      return {
        conversationId: _conversationId,
        userMessage,
        assistantMessage,
        ...(itemExplorerNode && {
          explorerNode: { itemId: itemExplorerNode.id },
        }),
      }
    },
  )
}
