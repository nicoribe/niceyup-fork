CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_mime_type" text NOT NULL,
	"file_uri" text NOT NULL,
	"bucket" text NOT NULL,
	"scope" text NOT NULL,
	"metadata" jsonb,
	"owner_id" text,
	"organization_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" RENAME COLUMN "user_id" TO "owner_id";--> statement-breakpoint
ALTER TABLE "sources" RENAME COLUMN "user_id" TO "owner_id";--> statement-breakpoint
ALTER TABLE "agents" DROP CONSTRAINT "agents_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sources" DROP CONSTRAINT "sources_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;