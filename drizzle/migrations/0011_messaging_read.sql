ALTER TABLE "conversations" ADD COLUMN "guest_last_read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "host_last_read_at" timestamp with time zone;
