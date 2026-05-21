ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "managed_by_team" boolean NOT NULL DEFAULT false;

CREATE TYPE "listing_claim_status" AS ENUM('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS "listing_claim_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "requester_name" varchar(100) NOT NULL,
  "requester_phone" varchar(20) NOT NULL,
  "requester_email" varchar(255),
  "message" text,
  "status" "listing_claim_status" NOT NULL DEFAULT 'pending',
  "assigned_host_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "listing_claim_requests_listing_id_idx" ON "listing_claim_requests" ("listing_id");
CREATE INDEX IF NOT EXISTS "listing_claim_requests_status_idx" ON "listing_claim_requests" ("status");
