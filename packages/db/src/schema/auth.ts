import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { id, timestamps } from '../utils'

export const users = pgTable('users', {
  ...id,
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  stripeCustomerId: text('stripe_customer_id'),
  ...timestamps,
})

export const sessions = pgTable('sessions', {
  ...id,
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
  activeTeamId: text('active_team_id'),
  ...timestamps,
})

export const accounts = pgTable('accounts', {
  ...id,
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
})

export const verifications = pgTable('verifications', {
  ...id,
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
})

export const organizations = pgTable('organizations', {
  ...id,
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdAt: timestamps.createdAt,
})

export const members = pgTable('members', {
  ...id,
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  createdAt: timestamps.createdAt,
})

export const invitations = pgTable('invitations', {
  ...id,
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  teamId: text('team_id'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const teams = pgTable('teams', {
  ...id,
  name: text('name').notNull(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const teamMembers = pgTable('team_members', {
  ...id,
  teamId: text('team_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamps.createdAt,
})

export const subscriptions = pgTable('subscriptions', {
  ...id,
  plan: text('plan').notNull(),
  referenceId: text('reference_id').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').default('incomplete'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  seats: integer('seats'),
})
