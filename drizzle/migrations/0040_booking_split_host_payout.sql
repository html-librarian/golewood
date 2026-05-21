ALTER TABLE "bookings" ADD COLUMN "host_amount" integer;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "platform_fee" integer;
--> statement-breakpoint
UPDATE "bookings" SET "host_amount" = "total_price", "platform_fee" = 0 WHERE "host_amount" IS NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "host_amount" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "platform_fee" SET NOT NULL;
--> statement-breakpoint
CREATE TYPE "public"."host_payout_status" AS ENUM('not_started', 'pending', 'active', 'rejected');
--> statement-breakpoint
CREATE TABLE "host_payout_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" "host_payout_status" DEFAULT 'not_started' NOT NULL,
	"inn" varchar(12),
	"bank_account" varchar(20),
	"bik" varchar(9),
	"yookassa_recipient_id" varchar(64),
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "host_payout_profiles" ADD CONSTRAINT "host_payout_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
