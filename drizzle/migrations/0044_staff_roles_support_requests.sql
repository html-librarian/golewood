ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'content_manager';

CREATE TABLE IF NOT EXISTS "support_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "email" varchar(255) NOT NULL,
  "context_url" varchar(512),
  "message" text NOT NULL,
  "status" "report_status" DEFAULT 'open' NOT NULL,
  "staff_note" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
