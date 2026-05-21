CREATE TYPE "public"."bonus_transaction_type" AS ENUM('review_reward', 'booking_payment', 'booking_refund');
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bonus_balance" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "bonus_applied" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "bonus_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"type" "bonus_transaction_type" NOT NULL,
	"booking_id" uuid,
	"review_id" uuid,
	"balance_after" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bonus_transactions" ADD CONSTRAINT "bonus_transactions_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "bonus_transactions_user_id_created_at_idx" ON "bonus_transactions" USING btree ("user_id","created_at");
