CREATE TABLE IF NOT EXISTS "listing_claim_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "claim_id" uuid NOT NULL REFERENCES "listing_claim_requests"("id") ON DELETE CASCADE,
  "file_name" varchar(255) NOT NULL,
  "file_url" text NOT NULL,
  "mime_type" varchar(128),
  "byte_size" integer,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "listing_claim_attachments_claim_id_idx" ON "listing_claim_attachments" ("claim_id");
