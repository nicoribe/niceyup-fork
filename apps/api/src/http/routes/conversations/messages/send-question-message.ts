import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { generateTitleFromUserMessage } from '@/http/functions/ai'
import { authenticate } from '@/http/middlewares/authenticate'
import { conversationPubSub } from '@/http/realtime/pub-sub/conversation-pub-sub'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import {
  aiMessageMetadataSchema,
  aiMessagePartSchema,
  aiMessageRoleSchema,
  aiMessageStatusSchema,
} from '@workspace/ai/schemas'
import type { AIMessageMetadata } from '@workspace/ai/types'
import { db } from '@workspace/db'
import { and, desc, eq, isNull, sql } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import {
  conversationExplorerNodes,
  conversations,
  messages,
} from '@workspace/db/schema'
import { answerMessageTask } from '@workspace/engine/tasks/answer-message'
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

export async function sendQuestionMessage(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/conversations/:conversationId/messages/send-question',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Send a question message to a conversation',
        operationId: 'sendQuestionMessage',
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
            .describe('Used only when conversation is new'),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              conversationId: z.string(),
              questionMessage: messageSchema,
              answerMessage: messageSchema,
              explorerNode: z
                .object({
                  itemId: z.string(),
                })
                .optional()
                .describe(
                  'Return only when the conversation is created in the explorerNode',
                ),
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

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
          teamId,
        }),
      }

      if (conversationId === 'new') {
        const agent = await queries.context.getAgent(context, {
          agentId,
        })

        if (!agent) {
          throw new BadRequestError({
            code: 'AGENT_NOT_FOUND',
            message: 'Agent not found or you don’t have access',
          })
        }

        if (explorerNode?.visibility) {
          if (explorerNode.visibility === 'team' && teamId === '~') {
            throw new BadRequestError({
              code: 'TEAM_NOT_FOUND',
              message: 'Team not found',
            })
          }

          if (explorerNode.folderId && explorerNode.folderId !== 'root') {
            const [folderExplorerNode] = await db
              .select({
                id: conversationExplorerNodes.id,
              })
              .from(conversationExplorerNodes)
              .where(
                and(
                  eq(conversationExplorerNodes.id, explorerNode.folderId),
                  eq(
                    conversationExplorerNodes.visibility,
                    explorerNode.visibility,
                  ),
                  eq(conversationExplorerNodes.agentId, agentId),
                  isNull(conversationExplorerNodes.conversationId),
                  isNull(conversationExplorerNodes.deletedAt),
                ),
              )
              .limit(1)

            if (!folderExplorerNode) {
              throw new BadRequestError({
                code: 'FOLDER_IN_EXPLORER_NOT_FOUND',
                message:
                  'Folder in explorer not found or you don’t have access',
              })
            }
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
      let _explorerNode = null

      const { questionMessage, answerMessage } = await db.transaction(
        async (tx) => {
          if (conversationId === 'new') {
            let title = message.parts.find((part) => part.type === 'text')?.text

            if (title) {
              title = await generateTitleFromUserMessage({ message: title })
            }

            const ownerTypeCondition =
              explorerNode?.visibility === 'team'
                ? { ownerTeamId: context.teamId }
                : { ownerUserId: userId }

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

            // TODO: Make this dynamic based on the agent's configuration
            const systemMessageText = `### Role
- Primary Function: You are an AI agent who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.`

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
            if (explorerNode?.visibility) {
              const [newItemExplorerNode] = await tx
                .insert(conversationExplorerNodes)
                .values({
                  visibility: explorerNode.visibility,
                  agentId,
                  ...ownerTypeCondition,
                  conversationId: conversation.id,
                  parentId:
                    explorerNode.folderId === 'root'
                      ? null
                      : explorerNode.folderId,
                })
                .returning({
                  id: conversationExplorerNodes.id,
                })

              if (newItemExplorerNode) {
                _explorerNode = { itemId: newItemExplorerNode.id }
              }
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

          const [questionMessage] = await tx
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

          if (!questionMessage) {
            throw new BadRequestError({
              code: 'QUESTION_MESSAGE_NOT_CREATED',
              message: 'Question message not created',
            })
          }

          const [answerMessage] = await tx
            .insert(messages)
            .values({
              conversationId: _conversationId,
              status: 'queued',
              role: 'assistant',
              parts: [],
              parentId: questionMessage.id,
            })
            .returning({
              id: messages.id,
            })

          if (!answerMessage) {
            throw new BadRequestError({
              code: 'ANSWER_MESSAGE_NOT_CREATED',
              message: 'Answer message not created',
            })
          }

          const handle = await answerMessageTask.trigger({
            conversationId: _conversationId,
            questionMessageId: questionMessage.id,
            answerMessageId: answerMessage.id,
          })

          const metadata: AIMessageMetadata = {
            triggerTask: {
              id: handle.id,
              taskIdentifier: handle.taskIdentifier,
            },
            authorId: userId,
          }

          const [answerMessageUpdated] = await tx
            .update(messages)
            .set({
              metadata: sql`COALESCE(${messages.metadata}, '{}'::jsonb) || ${JSON.stringify(metadata)}::jsonb`,
            })
            .where(eq(messages.id, answerMessage.id))
            .returning({
              id: messages.id,
              status: messages.status,
              role: messages.role,
              parts: messages.parts,
              metadata: messages.metadata,
              authorId: messages.authorId,
              parentId: messages.parentId,
            })

          if (!answerMessageUpdated) {
            throw new BadRequestError({
              code: 'ANSWER_MESSAGE_NOT_UPDATED',
              message: 'Answer message not updated',
            })
          }

          return {
            questionMessage: {
              ...questionMessage,
              children: [answerMessage.id],
            },
            answerMessage: {
              ...answerMessageUpdated,
              children: [],
            },
          }
        },
      )

      conversationPubSub.publish({
        channel: `conversations:${_conversationId}:updated`,
        messages: [questionMessage, answerMessage],
      })

      return {
        conversationId: _conversationId,
        questionMessage,
        answerMessage,
        ...(_explorerNode ? { explorerNode: _explorerNode } : {}),
      }
    },
  )
}
