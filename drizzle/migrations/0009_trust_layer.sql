CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict');--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "cancellation_policy" "cancellation_policy" DEFAULT 'moderate' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "cleaning_fee" integer DEFAULT 0 NOT NULL;
