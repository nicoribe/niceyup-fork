ALTER TABLE "agents" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_slug_unique" UNIQUE("slug");