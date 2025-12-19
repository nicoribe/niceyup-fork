ALTER TABLE "agents" RENAME COLUMN "owner_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "connections" RENAME COLUMN "owner_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "conversations" RENAME COLUMN "owner_team_id" TO "team_id";--> statement-breakpoint
ALTER TABLE "conversations" RENAME COLUMN "owner_user_id" TO "created_by_user_id";--> statement-breakpoint
ALTER TABLE "files" RENAME COLUMN "owner_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" RENAME COLUMN "owner_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "sources" RENAME COLUMN "owner_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "agents" DROP CONSTRAINT "agents_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "agents" DROP CONSTRAINT "agents_owner_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "connections" DROP CONSTRAINT "connections_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "connections" DROP CONSTRAINT "connections_owner_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_owner_team_id_teams_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_owner_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" DROP CONSTRAINT "source_explorer_nodes_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" DROP CONSTRAINT "source_explorer_nodes_owner_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_owner_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" ADD CONSTRAINT "source_explorer_nodes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "owner_user_id";--> statement-breakpoint
ALTER TABLE "connections" DROP COLUMN "owner_user_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "owner_user_id";--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" DROP COLUMN "owner_user_id";--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "owner_user_id";