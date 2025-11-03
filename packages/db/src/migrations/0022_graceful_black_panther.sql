CREATE TABLE "integration_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"connection_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "integration_sources_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
ALTER TABLE "database_sources" ALTER COLUMN "tables_metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "database_sources" ALTER COLUMN "query_examples" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "file_size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "source_explorer_nodes" ADD COLUMN "source_type" text;--> statement-breakpoint
ALTER TABLE "integration_sources" ADD CONSTRAINT "integration_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_sources" ADD CONSTRAINT "integration_sources_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "deleted_at";