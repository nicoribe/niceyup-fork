ALTER TABLE "structured" RENAME COLUMN "columns_proper_names_by_tables" TO "tables_column_proper_nouns";--> statement-breakpoint
ALTER TABLE "database_connections" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "database_connections" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "database_connections" ADD CONSTRAINT "database_connections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_connections" ADD CONSTRAINT "database_connections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;