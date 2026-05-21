CREATE TYPE "public"."gift_certificate_purchase_status" AS ENUM('pending', 'paid', 'redeemed', 'cancelled');
--> statement-breakpoint
CREATE TABLE "gift_certificate_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"amount_rub" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_certificate_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"recipient_name" varchar(100),
	"total_price" integer NOT NULL,
	"host_amount" integer NOT NULL,
	"platform_fee" integer NOT NULL,
	"code" varchar(16),
	"status" "gift_certificate_purchase_status" DEFAULT 'pending' NOT NULL,
	"yookassa_payment_id" varchar(64),
	"confirmation_url" varchar(512),
	"expires_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gift_certificate_offers" ADD CONSTRAINT "gift_certificate_offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "gift_certificate_offers" ADD CONSTRAINT "gift_certificate_offers_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "gift_certificate_purchases" ADD CONSTRAINT "gift_certificate_purchases_offer_id_gift_certificate_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."gift_certificate_offers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "gift_certificate_purchases" ADD CONSTRAINT "gift_certificate_purchases_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "gift_certificate_purchases" ADD CONSTRAINT "gift_certificate_purchases_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "gift_certificate_purchases" ADD CONSTRAINT "gift_certificate_purchases_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "gift_certificate_offers_listing_amount_idx" ON "gift_certificate_offers" USING btree ("listing_id","amount_rub");
--> statement-breakpoint
CREATE INDEX "gift_certificate_offers_listing_active_idx" ON "gift_certificate_offers" USING btree ("listing_id","is_active");
--> statement-breakpoint
CREATE UNIQUE INDEX "gift_certificate_purchases_code_idx" ON "gift_certificate_purchases" USING btree ("code") WHERE "code" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "gift_certificate_purchases_yookassa_payment_id_idx" ON "gift_certificate_purchases" USING btree ("yookassa_payment_id") WHERE "yookassa_payment_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "gift_certificate_purchases_created_idx" ON "gift_certificate_purchases" USING btree ("created_at");
