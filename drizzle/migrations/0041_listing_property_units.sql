CREATE TYPE "public"."listing_kind" AS ENUM('standalone', 'property', 'unit');--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "kind" "listing_kind" DEFAULT 'standalone' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "property_listing_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_property_listing_id_listings_id_fk" FOREIGN KEY ("property_listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_property_listing_id_idx" ON "listings" USING btree ("property_listing_id");--> statement-breakpoint
CREATE INDEX "listings_kind_idx" ON "listings" USING btree ("kind");
