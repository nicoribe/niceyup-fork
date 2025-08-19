import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import type {
  ColumnProperNamesByTables,
  DatabaseConnection,
  PromptMessage,
  QueryExample,
  TableInfo,
  TableMetadata,
} from '../types'
import { encryptedJson, id, timestamps } from '../utils'
import { organizations, users } from './auth'

export * from './auth'

export const workspaces = pgTable('workspaces', {
  ...id,
  userId: text('user_id')
    .unique()
    .references(() => users.id, {
      onDelete: 'set null',
    }),
  organizationId: text('organization_id')
    .unique()
    .references(() => organizations.id, {
      onDelete: 'set null',
    }),
  ...timestamps,
})

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [workspaces.organizationId],
    references: [organizations.id],
  }),
  sources: many(sources),
}))

export const sources = pgTable('sources', {
  ...id,
  name: text('name').notNull().default('Unnamed'),
  type: text('type').notNull(), // "structured"

  embaddingModel: text('embadding_model'), // "text-embedding-3-small"
  llmModel: text('llm_model'), // "gpt-4o-mini"

  chuckSize: integer('chuck_size'), // 4000
  chunkOverlap: integer('chunk_overlap'), // 100

  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  databaseConnectionId: text('database_connection_id').references(
    () => databaseConnections.id,
  ),
  ...timestamps,
})

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sources.workspaceId],
    references: [workspaces.id],
  }),
  databaseConnection: one(databaseConnections, {
    fields: [sources.databaseConnectionId],
    references: [databaseConnections.id],
  }),
  structured: one(structured),
  agents: many(agentsToSources),
}))

export const databaseConnections = pgTable('database_connections', {
  ...id,
  name: text('name').notNull().default('Unnamed'),
  dialect: text('dialect'), // "postgresql", "mysql", "sqlite"
  payload: encryptedJson('payload').$type<DatabaseConnection>(),
  ...timestamps,
})

export const databaseConnectionsRelations = relations(
  databaseConnections,
  ({ many }) => ({
    sources: many(sources),
  }),
)

export const structured = pgTable('structured', {
  ...id,
  tablesMetadata: jsonb('tables_metadata').$type<TableMetadata[]>(),
  tablesInfo: jsonb('tables_info').$type<TableInfo[]>(),
  columnsProperNamesByTables: jsonb('columns_proper_names_by_tables').$type<
    ColumnProperNamesByTables[]
  >(),
  queryExamples: jsonb('query_examples').$type<QueryExample[]>(),
  sourceId: text('source_id')
    .notNull()
    .unique()
    .references(() => sources.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const structuredRelations = relations(structured, ({ one }) => ({
  source: one(sources, {
    fields: [structured.sourceId],
    references: [sources.id],
  }),
}))

export const agents = pgTable('agents', {
  ...id,
  name: text('name').notNull().default('Unnamed'),
  published: boolean('published').notNull().default(false),

  embaddingModel: text('embadding_model'), // "text-embedding-3-small"
  llmModel: text('llm_model'), // "gpt-4o-mini"

  variables: jsonb('variables').$type<string[]>(), // Create variables to dynamically insert values into your prompt
  tools: jsonb('tools').$type<any[]>(), // Define tools to use in your prompt

  reasoningEffort: text('reasoning_effort'), // "low", "medium", "high"
  temperature: real('temperature'), // 1.00
  topP: real('top_p'), // 1.00
  maxTokens: integer('max_tokens'), // 10000

  systemMessage: text('system_message'), // Describe desired model behavior (tone, tool usage, response style)
  promptMessages: jsonb('prompt_messages').$type<PromptMessage[]>(), // Enter task specifics. use {{template variables}} for dynamic inputs

  storeLogs: boolean('store_logs').default(false), // Whether to store logs for later retrieval. Logs are visible to your organization.
  ...timestamps,
})

export const agentsRelations = relations(agents, ({ many }) => ({
  sources: many(agentsToSources),
  conversations: many(conversations),
}))

export const conversations = pgTable('conversations', {
  ...id,
  title: text('title').notNull().default('Untitled'),
  agentId: text('agent_id').references(() => agents.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
})

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    agent: one(agents, {
      fields: [conversations.agentId],
      references: [agents.id],
    }),
    messages: many(messages),
    participants: many(conversationsToUsers),
  }),
)

export const messages = pgTable('messages', {
  ...id,
  role: text('role').notNull().default('user'), // "user", "assistant", "system"
  content: text('content').notNull(),
  contentType: text('content_type').notNull().default('text'), // "text", "image", "file"
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  authorId: text('author_id').references(() => users.id),
  ...timestamps,
})

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
}))

export const conversationExplorerTree = pgTable('conversation_explorer_tree', {
  ...id,
  name: text('name').notNull().default('(untitled)'),
  explorerType: text('explorer_type').notNull().default('private'), // "private", "shared", "team"
  conversationId: text('conversation_id').references(() => conversations.id, {
    onDelete: 'cascade',
  }),
  parentId: text('parent_id'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
})

export const conversationExplorerTreeRelations = relations(
  conversationExplorerTree,
  ({ one, many }) => ({
    conversation: one(conversations, {
      fields: [conversationExplorerTree.conversationId],
      references: [conversations.id],
    }),
    parent: one(conversationExplorerTree, {
      fields: [conversationExplorerTree.parentId],
      references: [conversationExplorerTree.id],
      relationName: 'parent',
    }),
    children: many(conversationExplorerTree, {
      relationName: 'parent',
    }),
  }),
)

export const agentsToSources = pgTable(
  'agents_to_sources',
  {
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      }),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      }),
  },
  (t) => [primaryKey({ columns: [t.agentId, t.sourceId] })],
)

export const agentsToSourcesRelations = relations(
  agentsToSources,
  ({ one }) => ({
    agent: one(agents, {
      fields: [agentsToSources.agentId],
      references: [agents.id],
    }),
    source: one(sources, {
      fields: [agentsToSources.sourceId],
      references: [sources.id],
    }),
  }),
)

export const conversationsToUsers = pgTable(
  'conversations_to_users',
  {
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, {
        onUpdate: 'cascade',
        onDelete: 'cascade',
      }),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })],
)

export const conversationsToUsersRelations = relations(
  conversationsToUsers,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationsToUsers.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationsToUsers.userId],
      references: [users.id],
    }),
  }),
)
