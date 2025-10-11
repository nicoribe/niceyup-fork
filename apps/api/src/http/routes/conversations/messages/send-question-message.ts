import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { conversationPubSub } from '@/http/realtime/conversation-pub-sub'
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
  conversationExplorerTree,
  conversations,
  messages,
} from '@workspace/db/schema'
import { answerMessageTask } from '@workspace/engine/trigger/answer-message'
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
          agentId: z.string().nullish(),
          parentMessageId: z.string().nullish(),
          message: z.object({
            parts: z.array(promptMessagePartSchema).nonempty(),
            metadata: aiMessageMetadataSchema.nullish(),
          }),
          explorerTree: z
            .object({
              explorerType: z.enum(['private', 'team']),
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
              explorerTree: z
                .object({
                  itemId: z.string(),
                })
                .optional()
                .describe(
                  'Return only when the conversation is created in the explorerTree',
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
        explorerTree,
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
        if (!agentId) {
          throw new BadRequestError({
            code: 'AGENT_REQUIRED',
            message: 'Agent is required',
          })
        }

        const agent = await queries.context.getAgent(context, {
          agentId,
        })

        if (!agent) {
          throw new BadRequestError({
            code: 'AGENT_UNAVAILABLE',
            message: 'Agent not found or you don’t have access',
          })
        }

        if (explorerTree?.explorerType) {
          if (explorerTree.explorerType === 'team' && teamId === '~') {
            throw new BadRequestError({
              code: 'TEAM_NOT_FOUND',
              message: 'Team not found',
            })
          }

          if (explorerTree.folderId && explorerTree.folderId !== 'root') {
            const [folderExplorerTree] = await db
              .select({
                id: conversationExplorerTree.id,
              })
              .from(conversationExplorerTree)
              .where(
                and(
                  eq(conversationExplorerTree.id, explorerTree.folderId),
                  eq(
                    conversationExplorerTree.explorerType,
                    explorerTree.explorerType,
                  ),
                  eq(conversationExplorerTree.agentId, agentId),
                  isNull(conversationExplorerTree.conversationId),
                  isNull(conversationExplorerTree.deletedAt),
                ),
              )
              .limit(1)

            if (!folderExplorerTree) {
              throw new BadRequestError({
                code: 'FOLDER_EXPLORER_TREE_NOT_FOUND',
                message:
                  'Folder explorer tree not found or you don’t have access',
              })
            }
          }
        }
      } else {
        const conversation = await queries.context.getConversation(context, {
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
      let _explorerTree = null

      const { questionMessage, answerMessage } = await db.transaction(
        async (tx) => {
          if (conversationId === 'new') {
            // TODO: Implement AI to generate the title
            const title = message.parts
              .find((part) => part.type === 'text')
              ?.text?.slice(0, 50)

            const ownerTypeCondition =
              explorerTree?.explorerType === 'team'
                ? { teamId: context.teamId }
                : { ownerId: userId }

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

            const [systemMessage] = await tx
              .insert(messages)
              .values({
                conversationId: conversation.id,
                status: 'finished',
                role: 'system',
                parts: [
                  {
                    type: 'text',
                    text: `You are a helpful assistant. Check your knowledge base before answering any questions.
                    Only respond to questions using information from tool calls.
                    if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
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

            // Create a new conversation in the explorer tree
            if (explorerTree?.explorerType) {
              const [newItemExplorerTree] = await tx
                .insert(conversationExplorerTree)
                .values({
                  explorerType: explorerTree.explorerType,
                  agentId,
                  ...ownerTypeCondition,
                  conversationId: conversation.id,
                  parentId:
                    explorerTree.folderId === 'root'
                      ? null
                      : explorerTree.folderId,
                })
                .returning({
                  id: conversationExplorerTree.id,
                })

              if (newItemExplorerTree) {
                _explorerTree = { itemId: newItemExplorerTree.id }
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
        ...(_explorerTree ? { explorerTree: _explorerTree } : {}),
      }
    },
  )
}
