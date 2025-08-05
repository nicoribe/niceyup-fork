CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Unnamed' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"embadding_model" text,
	"llm_model" text,
	"variables" jsonb,
	"tools" jsonb,
	"reasoning_effort" text,
	"temperature" real,
	"top_p" real,
	"max_tokens" integer,
	"system_message" text,
	"prompt_messages" jsonb,
	"store_logs" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents_to_sources" (
	"agent_id" text NOT NULL,
	"source_id" text NOT NULL,
	CONSTRAINT "agents_to_sources_agent_id_source_id_pk" PRIMARY KEY("agent_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"agent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations_to_users" (
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "conversations_to_users_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "database_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Unnamed' NOT NULL,
	"dialect" text,
	"host" text,
	"port" text,
	"user" text,
	"password" text,
	"database" text,
	"schema" text,
	"file_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"content" text NOT NULL,
	"content_type" text DEFAULT 'text' NOT NULL,
	"conversation_id" text NOT NULL,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Unnamed' NOT NULL,
	"type" text NOT NULL,
	"embadding_model" text,
	"llm_model" text,
	"chuck_size" integer,
	"chunk_overlap" integer,
	"workspace_id" text NOT NULL,
	"database_connection_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "structured" (
	"id" text PRIMARY KEY NOT NULL,
	"tables_metadata" jsonb,
	"tables_info" jsonb,
	"columns_proper_names_by_tables" jsonb,
	"query_examples" jsonb,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "structured_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"organization_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "workspaces_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"team_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"reference_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'incomplete',
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"cancel_at_period_end" boolean,
	"seats" integer
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_team_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "agents_to_sources" ADD CONSTRAINT "agents_to_sources_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agents_to_sources" ADD CONSTRAINT "agents_to_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations_to_users" ADD CONSTRAINT "conversations_to_users_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversations_to_users" ADD CONSTRAINT "conversations_to_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_database_connection_id_database_connections_id_fk" FOREIGN KEY ("database_connection_id") REFERENCES "public"."database_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structured" ADD CONSTRAINT "structured_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;