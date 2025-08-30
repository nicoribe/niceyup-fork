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
  MessageContent,
  Metadata,
  PromptMessage,
  QueryExample,
  TableInfo,
  TableMetadata,
} from '../types'
import { encryptedJson, id, timestamps } from '../utils'
import { organizations, teams, users } from './auth'

export * from './auth'

export const sources = pgTable('sources', {
  ...id,
  name: text('name').notNull().default('Unnamed'),
  type: text('type').notNull(), // "structured"

  embaddingModel: text('embadding_model'), // "text-embedding-3-small"
  llmModel: text('llm_model'), // "gpt-4o-mini"

  chuckSize: integer('chuck_size'), // 4000
  chunkOverlap: integer('chunk_overlap'), // 100

  userId: text('user_id').references(() => users.id),
  organizationId: text('organization_id').references(() => organizations.id),
  databaseConnectionId: text('database_connection_id').references(
    () => databaseConnections.id,
  ),
  ...timestamps,
})

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  user: one(users, {
    fields: [sources.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [sources.organizationId],
    references: [organizations.id],
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

  userId: text('user_id').references(() => users.id),
  organizationId: text('organization_id').references(() => organizations.id),
  ...timestamps,
})

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id],
  }),
  teams: many(teamsToAgents),
  sources: many(agentsToSources),
  conversations: many(conversations),
}))

export const conversations = pgTable('conversations', {
  ...id,
  title: text('title').notNull().default('Untitled'),

  teamId: text('team_id').references(() => teams.id),
  ownerId: text('owner_id').references(() => users.id),

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
  status: text('status').notNull().default('queued'), // "queued", "in_progress", "finished", "stopped", "failed"
  role: text('role').notNull().default('user'), // "system", "user", "assistant"
  content: jsonb('content').$type<MessageContent>(),
  metadata: jsonb('metadata').$type<Metadata>(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  authorId: text('author_id').references(() => users.id),
  parentId: text('parent_id'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
})

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
    relationName: 'parent',
  }),
  children: many(messages, {
    relationName: 'parent',
  }),
}))

export const teamsToAgents = pgTable(
  'teams_to_agents',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.agentId] })],
)

export const teamsToAgentsRelations = relations(teamsToAgents, ({ one }) => ({
  team: one(teams, {
    fields: [teamsToAgents.teamId],
    references: [teams.id],
  }),
  agent: one(agents, {
    fields: [teamsToAgents.agentId],
    references: [agents.id],
  }),
}))

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

export const conversationExplorerTree = pgTable('conversation_explorer_tree', {
  ...id,
  name: text('name'),
  explorerType: text('explorer_type').notNull().default('private'), // "private", "shared", "team"
  shared: boolean('shared').notNull().default(false), // True if the owner shared a private conversation with another user
  agentId: text('agent_id').references(() => agents.id),
  ownerId: text('owner_id').references(() => users.id),
  teamId: text('team_id').references(() => teams.id),
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
    agent: one(agents, {
      fields: [conversationExplorerTree.agentId],
      references: [agents.id],
    }),
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
