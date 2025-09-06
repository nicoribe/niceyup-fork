ALTER TABLE "agents" DROP COLUMN "embadding_model";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "llm_model";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "variables";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "tools";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "reasoning_effort";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "temperature";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "top_p";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "max_tokens";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "system_message";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "prompt_messages";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN "store_logs";--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "embadding_model";--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "llm_model";--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "chuck_size";--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "chunk_overlap";