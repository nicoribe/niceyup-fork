ALTER TABLE "messages" ADD COLUMN "content" jsonb;--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "parts";