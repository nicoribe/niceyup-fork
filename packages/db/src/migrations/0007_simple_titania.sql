CREATE TABLE "teams_to_agents" (
	"team_id" text NOT NULL,
	"agent_id" text NOT NULL,
	CONSTRAINT "teams_to_agents_team_id_agent_id_pk" PRIMARY KEY("team_id","agent_id")
);
--> statement-breakpoint
ALTER TABLE "workspaces" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "workspaces" CASCADE;--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ALTER COLUMN "name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD COLUMN "shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD COLUMN "agent_id" text;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "teams_to_agents" ADD CONSTRAINT "teams_to_agents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "teams_to_agents" ADD CONSTRAINT "teams_to_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD CONSTRAINT "conversation_explorer_tree_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD CONSTRAINT "conversation_explorer_tree_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD CONSTRAINT "conversation_explorer_tree_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "workspace_id";