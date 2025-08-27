ALTER TABLE "messages" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp with time zone;