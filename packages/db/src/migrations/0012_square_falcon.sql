ALTER TABLE "messages" RENAME COLUMN "content" TO "parts";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "status" SET DEFAULT 'queued';