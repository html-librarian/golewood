ALTER TABLE "users" ADD COLUMN "host_promo_balance" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TYPE "public"."host_promo_transaction_type" AS ENUM('booking_reward', 'promotion_purchase', 'refund', 'admin_adjust');
--> statement-breakpoint
CREATE TABLE "listing_promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"product_slug" varchar(32) NOT NULL,
	"price_points" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "host_promo_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"type" "host_promo_transaction_type" NOT NULL,
	"listing_id" uuid,
	"promotion_id" uuid,
	"balance_after" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing_promotions" ADD CONSTRAINT "listing_promotions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "listing_promotions" ADD CONSTRAINT "listing_promotions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "host_promo_transactions" ADD CONSTRAINT "host_promo_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "host_promo_transactions" ADD CONSTRAINT "host_promo_transactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "host_promo_transactions" ADD CONSTRAINT "host_promo_transactions_promotion_id_listing_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."listing_promotions"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "listing_promotions_listing_active_idx" ON "listing_promotions" USING btree ("listing_id","ends_at");
--> statement-breakpoint
CREATE INDEX "host_promo_transactions_user_id_created_at_idx" ON "host_promo_transactions" USING btree ("user_id","created_at");
