ALTER TYPE "public"."host_promo_transaction_type" ADD VALUE 'points_purchase';
--> statement-breakpoint
CREATE TABLE "host_promo_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"package_slug" varchar(32) NOT NULL,
	"points" integer NOT NULL,
	"amount_rub" integer NOT NULL,
	"yookassa_payment_id" varchar(64),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"confirmation_url" varchar(512),
	"promo_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "host_promo_purchases" ADD CONSTRAINT "host_promo_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "host_promo_purchases" ADD CONSTRAINT "host_promo_purchases_promo_transaction_id_host_promo_transactions_id_fk" FOREIGN KEY ("promo_transaction_id") REFERENCES "public"."host_promo_transactions"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "host_promo_purchases_user_created_idx" ON "host_promo_purchases" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "host_promo_purchases_yookassa_payment_id_idx" ON "host_promo_purchases" USING btree ("yookassa_payment_id") WHERE "yookassa_payment_id" IS NOT NULL;
