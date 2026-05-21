DO $$ BEGIN
 CREATE TYPE "public"."oauth_provider" AS ENUM('yandex', 'vk');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "oauth_provider" NOT NULL,
	"provider_user_id" varchar(128) NOT NULL,
	"profile_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_accounts_provider_provider_user_id_unique" UNIQUE("provider","provider_user_id")
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "location" geography(Point,4326);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
UPDATE listings SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography WHERE location IS NULL AND (latitude <> 0 OR longitude <> 0);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS listings_location_gist ON listings USING GIST (location);
