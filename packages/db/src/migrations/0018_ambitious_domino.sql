CREATE TABLE "connections" (
	"id" text PRIMARY KEY NOT NULL,
	"app" text NOT NULL,
	"name" text DEFAULT 'Unnamed' NOT NULL,
	"payload" text,
	"owner_id" text,
	"organization_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_explorer_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"shared" boolean DEFAULT false NOT NULL,
	"agent_id" text,
	"conversation_id" text,
	"parent_id" text,
	"owner_id" text,
	"team_id" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"dialect" text NOT NULL,
	"tables_metadata" jsonb NOT NULL,
	"query_examples" jsonb NOT NULL,
	"source_id" text NOT NULL,
	"file_id" text,
	"connection_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "database_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "file_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"file_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "file_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "question_answer_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"questions" jsonb NOT NULL,
	"answer" text NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "question_answer_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "source_explorer_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"source_id" text,
	"parent_id" text,
	"owner_id" text,
	"organization_id" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "text_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE TABLE "website_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "website_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "database_connections" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "structured_sources" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "conversation_explorer_tree" CASCADE;--> statement-breakpoint
DROP TABLE "database_connections" CASCADE;--> statement-breakpoint
DROP TABLE "structured_sources" CASCADE;--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_database_connection_id_database_connections_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "chuck_size" integer;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "chunk_overlap" integer;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_nodes" ADD CONSTRAINT "conversation_explorer_nodes_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_nodes" ADD CONSTRAINT "conversation_explorer_nodes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_nodes" ADD CONSTRAINT "conversation_explorer_nodes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_nodes" ADD CONSTRAINT "conversation_explorer_nodes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_sources" ADD CONSTRAINT "database_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_sources" ADD CONSTRAINT "database_sources_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_sources" ADD CONSTRAINT "database_sources_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_sources" ADD CONSTRAINT "file_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_sources" ADD CONSTRAINT "file_sources_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answer_sources" ADD CONSTRAINT "question_answer_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" ADD CONSTRAINT "source_explorer_nodes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" ADD CONSTRAINT "source_explorer_nodes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" ADD CONSTRAINT "source_explorer_nodes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_sources" ADD CONSTRAINT "text_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_sources" ADD CONSTRAINT "website_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "database_connection_id";