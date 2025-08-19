CREATE TABLE "conversation_explorer_tree" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '(untitled)' NOT NULL,
	"explorer_type" text DEFAULT 'private' NOT NULL,
	"conversation_id" text,
	"parent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_explorer_tree" ADD CONSTRAINT "conversation_explorer_tree_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;