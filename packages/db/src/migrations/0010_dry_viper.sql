ALTER TABLE "messages" ADD COLUMN "parts" jsonb;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "content";