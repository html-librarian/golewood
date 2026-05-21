ALTER TABLE "listing_news" ADD COLUMN "preview_image_url" varchar(512);
--> statement-breakpoint
ALTER TABLE "listing_news" ADD COLUMN "show_booking_button" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "listing_news" ADD COLUMN "likes_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "listing_news" ADD COLUMN "dislikes_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "listing_news_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"url" varchar(512) NOT NULL,
	"media_type" varchar(16) DEFAULT 'photo' NOT NULL,
	"embed_url" varchar(512),
	"provider" varchar(32),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_news_reactions" (
	"news_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" varchar(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_news_reactions_news_id_user_id_pk" PRIMARY KEY("news_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "listing_news_media" ADD CONSTRAINT "listing_news_media_news_id_listing_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."listing_news"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "listing_news_reactions" ADD CONSTRAINT "listing_news_reactions_news_id_listing_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."listing_news"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "listing_news_reactions" ADD CONSTRAINT "listing_news_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "listing_news_media_news_id_idx" ON "listing_news_media" USING btree ("news_id");
