ALTER TABLE "agents" ADD COLUMN "language_model" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "embedding_model" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "language_model" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "language_model" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "embedding_model" text;