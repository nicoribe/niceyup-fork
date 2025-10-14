ALTER TABLE "structured" RENAME TO "structured_sources";--> statement-breakpoint
ALTER TABLE "structured_sources" DROP CONSTRAINT "structured_source_id_unique";--> statement-breakpoint
ALTER TABLE "structured_sources" DROP CONSTRAINT "structured_source_id_sources_id_fk";
--> statement-breakpoint
ALTER TABLE "structured_sources" ADD CONSTRAINT "structured_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structured_sources" DROP COLUMN "tables_info";--> statement-breakpoint
ALTER TABLE "structured_sources" DROP COLUMN "tables_column_proper_nouns";--> statement-breakpoint
ALTER TABLE "structured_sources" ADD CONSTRAINT "structured_sources_source_id_unique" UNIQUE("source_id");