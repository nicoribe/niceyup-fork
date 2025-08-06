ALTER TABLE "database_connections" ADD COLUMN "payload" text;--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "host";--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "port";--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "user";--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "database";--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "schema";--> statement-breakpoint
ALTER TABLE "database_connections" DROP COLUMN "file_path";